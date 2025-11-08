#!/usr/bin/env python3
import os
import re
from datetime import datetime
from flask import (
    Flask, render_template, request, redirect, url_for, session, flash, abort
)
from flask_wtf import FlaskForm, CSRFProtect
from wtforms import StringField, PasswordField, SubmitField, IntegerField
from wtforms.validators import DataRequired, Email, EqualTo, Regexp, NumberRange
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session, aliased
from models import Base, User, Service, Transaction
from rabbitmq import publish

# Configurações para testes!

app = Flask(__name__)
# chave utilizada para assinar os cookies de sessão (obviamente deve ser trocada em prod)
app.secret_key = os.getenv("SECRET_KEY", "troque-em-producao")

app.config.update(
    # Bloqueia o acesso ao cookie de sessão via JS, para mitigar XSS
    SESSION_COOKIE_HTTPONLY=True,
    # Bloqueia o envio do cookie para outros sites, para mitigar XSRF
    SESSION_COOKIE_SAMESITE="Strict",
    # apenas para testes, permite o envio do cookie em conexões sem TLS
    SESSION_COOKIE_SECURE=False,
)

# Ativa a proteção contra Cross-Site Request Forgery para todas as rotas da aplicação
csrf = CSRFProtect(app)


# URL de conexão com o banco de dados (credenciais devem ser trocadas)
DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://user:senha@localhost/timepix_db")
# engine do SQLAlchemy para gerir o BD
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = scoped_session(sessionmaker(
    bind=engine, autoflush=False, autocommit=False))  # sessão local para gerir o BD
Base.metadata.create_all(bind=engine)  # Cria as tabelas no BD

# Formulários


class RegisterForm(FlaskForm):
    nome = StringField("Nome", validators=[DataRequired()])
    sobrenome = StringField("Sobrenome", validators=[DataRequired()])
    email = StringField("E-mail", validators=[DataRequired(), Email()])
    senha = PasswordField("Senha", validators=[DataRequired()])
    confirmar = PasswordField("Confirmar", validators=[EqualTo("senha")])
    telefone = StringField("Telefone", validators=[
        DataRequired(),
        Regexp(r"^\(\d{2}\) \d \d{4}-\d{4}$",
               message="Formato inválido.")  # (XX) X XXXX-XXXX
    ])
    submit = SubmitField("Registrar-se")


class LoginForm(FlaskForm):
    email = StringField("E-mail", validators=[DataRequired(), Email()])
    senha = PasswordField("Senha", validators=[DataRequired()])
    submit = SubmitField("Entrar")


class ServiceForm(FlaskForm):
    nome = StringField("Nome", validators=[DataRequired()])
    descricao = StringField("Descrição", validators=[DataRequired()])
    valor = IntegerField("Valor (em horas)", validators=[
                         DataRequired(), NumberRange(min=1)])
    submit = SubmitField("Salvar")


class TransferForm(FlaskForm):
    email_destino = StringField(
        "E-mail do destinatário", validators=[DataRequired(), Email()])
    valor = IntegerField("Valor (em horas)", validators=[
                         DataRequired(), NumberRange(min=1)])
    submit = SubmitField("Enviar")

# Helpers

# gera uma sessão por request


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# verificação de autenticação para algumas rotas


def require_login():
    if "usuario_id" not in session:
        abort(403)

# Rotas

# Redireciona o usuário para a tela de login, caso não esteja logado


@app.route("/")
def index():
    if "usuario_id" in session:
        return redirect(url_for("home"))
    return redirect(url_for("login"))


@app.route("/register", methods=["GET", "POST"])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        email = form.email.data.strip().lower()
        # restringe o registro a e-mails pertencentes à UFLA. Seria melhor implementar SSO, mas n temos acesso ;-;
        if not (email.endswith("@ufla.br") or email.endswith("@estudante.ufla.br")):
            flash("O e-mail deve ser do domínio ufla.br ou estudante.ufla.br.")
            return redirect(url_for("register"))
        db = next(get_db())
        if db.query(User).filter(User.email == email).first():
            flash("E-mail já cadastrado.")
            return redirect(url_for("register"))
        # Calcula o hash de senha + salt
        hashed = generate_password_hash(form.senha.data)
        user = User(
            first_name=form.nome.data,
            last_name=form.sobrenome.data,
            email=email,
            phone=form.telefone.data,
            password_hash=hashed,
            balance=4
        )
        db.add(user)
        db.commit()
        # envia o evento para a fila de auditoria do RabbitMQ
        publish("fila_auditoria", {"event": "user_registered", "email": email})
        flash("Registro realizado com sucesso!")
        return redirect(url_for("login"))
    return render_template("register.html", form=form)


@app.route("/login", methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        db = next(get_db())
        email = form.email.data.strip().lower()
        user = db.query(User).filter(User.email == email).first()
        # valida as credenciais do usuário
        if user and check_password_hash(user.password_hash, form.senha.data):
            session["usuario_id"] = user.id
            session["usuario_email"] = user.email
            # envia o evento para a fila de auditoria do RabbitMQ
            publish("fila_auditoria", {
                    "event": "login_success", "email": email})
            return redirect(url_for("home"))
        flash("Usuário ou senha inválidos!")
    return render_template("login.html", form=form)


@app.route("/logout")
def logout():
    session.clear()  # apaga os dados da sessão
    return redirect(url_for("login"))


@app.route("/home")
def home():
    require_login()
    db = next(get_db())
    query = request.args.get("q", "").lower()
    # busca todos os serviços cadastrados
    services = db.query(Service).join(User)
    if query:  # permite filtrar os serviços com base no título ou nome do usuário
        like = f"%{query}%"
        services = services.filter(Service.title.ilike(
            like) | User.first_name.ilike(like))
    results = services.all()
    user = db.query(User).get(session["usuario_id"])
    return render_template("home.html", usuario=user, servicos=results, query=query)


@app.route("/perfil/<int:user_id>")
def perfil(user_id):
    require_login()
    db = next(get_db())
    user = db.query(User).get(user_id)
    if not user:
        abort(404)  # Not Found caso o usuário não exista
    # permite que apenas o próprio usuário altere seu perfil
    can_edit = (user.id == session["usuario_id"])
    return render_template("perfil.html", user=user, can_edit=can_edit)


@app.route("/gerenciar_servicos", methods=["GET", "POST"])
def gerenciar_servicos():
    require_login()
    db = next(get_db())
    form = ServiceForm()

    # Se preenchido corretamente, cria o novo serviço
    if form.validate_on_submit():
        new_service = Service(
            owner_id=session["usuario_id"],
            title=form.nome.data,
            description=form.descricao.data,
            value=form.valor.data
        )
        db.add(new_service)
        db.commit()
        publish("fila_auditoria", {  # envia o evento para a fila de auditoria do RabbitMQ
            "event": "service_created",
            "owner": session["usuario_email"],
            "service_title": form.nome.data
        })
        flash("Serviço adicionado com sucesso!")
        return redirect(url_for("gerenciar_servicos"))

    # Busca os serviços do usuário logado
    user_services = (
        db.query(Service)
        .filter(Service.owner_id == session["usuario_id"])
        .order_by(Service.created_at.desc())
        .all()
    )

    return render_template("gerenciar_servicos.html", form=form, servicos=user_services)


@app.route("/editar_servico/<int:service_id>", methods=["GET", "POST"])
def editar_servico(service_id):
    require_login()
    db = next(get_db())
    servico = db.query(Service).get(service_id)
    # Mitiga Broken Access Control
    if not servico or servico.owner_id != session["usuario_id"]:
        abort(403)

    form = ServiceForm(obj=servico)

    # Se preenchido corretamente, aplica as alterações ao serviço
    if form.validate_on_submit():
        servico.title = form.nome.data
        servico.description = form.descricao.data
        servico.value = form.valor.data
        db.commit()
        publish("fila_auditoria", {  # envia o evento para a fila de auditoria do RabbitMQ
            "event": "service_updated",
            "owner": session["usuario_email"],
            "service_id": service_id
        })
        flash("Serviço atualizado com sucesso!")
        return redirect(url_for("gerenciar_servicos"))

    return render_template("editar_servico.html", form=form, servico=servico)


@app.route("/excluir_servico/<int:service_id>", methods=["POST"])
def excluir_servico(service_id):
    require_login()
    db = next(get_db())
    servico = db.query(Service).get(service_id)
    # mitiga Broken Access Control
    if not servico or servico.owner_id != session["usuario_id"]:
        abort(403)

    db.delete(servico)
    db.commit()
    publish("fila_auditoria", {  # envia o evento para a fila de auditoria do RabbitMQ
        "event": "service_deleted",
        "owner": session["usuario_email"],
        "service_id": service_id
    })
    flash("Serviço excluído com sucesso!")
    return redirect(url_for("gerenciar_servicos"))


@app.route("/editar_perfil", methods=["GET", "POST"])
def editar_perfil():
    require_login()
    db = next(get_db())
    user = db.query(User).get(session["usuario_id"])

    form = FlaskForm()

    # Aplica as alterações caso preenchido corretamente
    if form.validate_on_submit():
        nome = request.form.get("first_name", "").strip()
        telefone = request.form.get("phone", "").strip()
        email = request.form.get("email", "").strip().lower()
        senha_atual = request.form.get("senha_atual", "")
        nova_senha = request.form.get("nova_senha", "")
        confirmar_senha = request.form.get("confirmar_senha", "")

        # Valida o telefone
        if not re.match(r"^\(\d{2}\) \d \d{4}-\d{4}$", telefone):
            flash("Telefone inválido. Use o formato (XX) X XXXX-XXXX.")
            return redirect(url_for("editar_perfil"))

        # Valida o domínio do e-mail
        if not (email.endswith("@ufla.br") or email.endswith("@estudante.ufla.br")):
            flash("O e-mail deve ser do domínio ufla.br ou estudante.ufla.br.")
            return redirect(url_for("editar_perfil"))

        # Impede duplicação de e-mail
        existing_user = db.query(User).filter(
            User.email == email, User.id != user.id).first()
        if existing_user:
            flash("Este e-mail já está em uso por outro usuário.")
            return redirect(url_for("editar_perfil"))

        # Aplica as atualizações
        user.first_name = nome or user.first_name
        user.phone = telefone
        email_changed = (user.email != email)
        user.email = email

        # Troca de senha
        if senha_atual or nova_senha or confirmar_senha:
            # exige senha atual correta
            if not check_password_hash(user.password_hash, senha_atual):
                flash("Senha atual incorreta.")
                return redirect(url_for("editar_perfil"))

            if nova_senha != confirmar_senha:
                flash("A nova senha e a confirmação não coincidem.")
                return redirect(url_for("editar_perfil"))

            if len(nova_senha) < 6:  # TODO: exigir utilização de senha forte
                flash("A nova senha deve ter pelo menos 6 caracteres.")
                return redirect(url_for("editar_perfil"))

            user.password_hash = generate_password_hash(nova_senha)
            flash("Senha alterada com sucesso!")

        db.commit()

        # Atualiza sessão se o e-mail mudou
        if email_changed:
            session["usuario_email"] = user.email

        # envia o evento para a fila de auditoria do RabbitMQ
        publish("fila_auditoria", {
                "event": "profile_updated", "email": user.email})

        flash("Perfil atualizado com sucesso.")
        return redirect(url_for("perfil", user_id=user.id))

    return render_template("editar_perfil.html", user=user, form=form)


@app.route("/transferencias", methods=["GET", "POST"])
def transferencias():
    require_login()
    db = next(get_db())
    # define o usuário autenticado como remetente
    user = db.query(User).get(session["usuario_id"])
    form = TransferForm()

    if form.validate_on_submit():
        valor = form.valor.data
        destino_email = form.email_destino.data.strip().lower()
        destinatario = db.query(User).filter(
            User.email == destino_email).first()

        if not destinatario:
            flash("Usuário destinatário não encontrado.")
            return redirect(url_for("transferencias"))

        if destinatario.id == user.id:
            flash("Não é possível transferir para si mesmo.")
            return redirect(url_for("transferencias"))

        if valor <= 0:
            flash("O valor deve ser maior que 0.")
            return redirect(url_for("transferencias"))

        if valor > user.balance:
            flash("Saldo insuficiente para realizar a transferência.")
            return redirect(url_for("transferencias"))

        # Cria registro da transação com status PENDING
        tx = Transaction(
            sender_id=user.id,
            recipient_id=destinatario.id,
            amount=valor,
            status="PENDING",
            created_at=datetime.utcnow()
        )
        db.add(tx)
        db.commit()

        # Publica na fila de transações do RabbitMQ
        publish("fila_transacoes", {"transaction_id": tx.id})
        flash("Transferência enviada para processamento!")
        return redirect(url_for("transferencias"))

    sender_user = aliased(User)
    recipient_user = aliased(User)

    # recupera as transações em que o usuário logado é o remetente ou o destinatário
    historico = (
        db.query(
            Transaction,
            sender_user.email.label("sender_email"),
            recipient_user.email.label("recipient_email")
        )
        .join(sender_user, Transaction.sender_id == sender_user.id)
        .join(recipient_user, Transaction.recipient_id == recipient_user.id)
        .filter(
            (Transaction.sender_id == user.id) | (
                Transaction.recipient_id == user.id)
        )
        .order_by(Transaction.created_at.desc())
        .limit(5)
        .all()
    )

    historico_formatado = []
    for t in historico:
        tx, sender_email, recipient_email = t
        historico_formatado.append({
            "remetente": sender_email,
            "destinatario": recipient_email,
            "data": tx.created_at.strftime("%d/%m/%Y %H:%M"),
            "valor": tx.amount,
            "status": tx.status
        })

    return render_template(
        "transferencias.html",
        usuario=user,
        form=form,
        historico=historico_formatado
    )


@app.route("/historico_geral")
def historico_geral():
    require_login()
    db = next(get_db())
    query = request.args.get("q", "").strip().lower()

    # Busca todas as transações ordenadas por data
    transacoes = db.query(Transaction).order_by(
        Transaction.created_at.desc()).all()

    resultados = []
    for t in transacoes:
        remetente = db.query(User).get(t.sender_id)
        destinatario = db.query(User).get(t.recipient_id)

        dados = {
            "remetente": remetente.email if remetente else "Desconhecido",
            "destinatario": destinatario.email if destinatario else "Desconhecido",
            "data": t.created_at.strftime("%d/%m/%Y %H:%M"),
            "valor": t.amount
        }

        # Filtro de busca
        if query:
            if (
                query in dados["remetente"].lower()
                or query in dados["destinatario"].lower()
                or query in dados["data"].lower()
                or query in str(dados["valor"])
            ):
                resultados.append(dados)
        else:
            resultados.append(dados)

    return render_template("historico_geral.html", transacoes=resultados, query=query)


# Protege contra XSRF globalmente via Flask-WTF
csrf.init_app(app)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
