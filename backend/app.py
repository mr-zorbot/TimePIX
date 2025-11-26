import os
import re
from datetime import datetime
from flask import (
    Flask, request, jsonify, session, abort
)
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import create_engine, or_
from sqlalchemy.orm import sessionmaker, scoped_session
from flask_cors import CORS

from models import Base, User, Service, Transaction
from rabbitmq import publish

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "troque-em-producao")

CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,
)

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://user:senha@localhost/timepix_db")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, autocommit=False))
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_login():
    if "usuario_id" not in session:
        abort(401, description="Não autorizado. Faça login.")
    return session["usuario_id"]

def serialize_user(user, include_private=False):
    data = {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
    }
    if include_private:
        data["phone"] = user.phone
        data["balance"] = user.balance
        data["created_at"] = user.created_at
    return data

def serialize_service(service):
    return {
        "id": service.id,
        "title": service.title,
        "description": service.description,
        "value": service.value,
        "owner_id": service.owner_id,
        "owner_name": f"{service.owner.first_name} {service.owner.last_name}" if service.owner else "Desconhecido",
        "owner_email": service.owner.email if service.owner else "Não informado",
        "owner_phone": service.owner.phone if service.owner else "Não informado"
    }

def serialize_transaction(tx, sender_email, recipient_email):
    return {
        "id": tx.id,
        "remetente": sender_email,
        "destinatario": recipient_email,
        "valor": tx.amount,
        "status": tx.status,
        "data": tx.created_at.strftime("%d/%m/%Y %H:%M")
    }

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    
    required = ["nome", "sobrenome", "email", "senha", "telefone"]
    if not all(k in data for k in required):
        return jsonify({"error": "Dados incompletos"}), 400

    email = data["email"].strip().lower()
    
    if not (email.endswith("@ufla.br") or email.endswith("@estudante.ufla.br")):
         return jsonify({"error": "O e-mail deve ser do domínio ufla.br ou estudante.ufla.br"}), 400

    db = next(get_db())
    if db.query(User).filter(User.email == email).first():
        return jsonify({"error": "E-mail já cadastrado"}), 409

    user = User(
        first_name=data["nome"],
        last_name=data["sobrenome"],
        email=email,
        phone=data["telefone"],
        password_hash=generate_password_hash(data["senha"]),
        balance=4
    )
    db.add(user)
    db.commit()
    
    publish("fila_auditoria", {"event": "user_registered", "email": email})
    return jsonify({"message": "Usuário registrado com sucesso"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    senha = data.get("senha", "")

    db = next(get_db())
    user = db.query(User).filter(User.email == email).first()

    if user and check_password_hash(user.password_hash, senha):
        session["usuario_id"] = user.id
        session["usuario_email"] = user.email
        
        publish("fila_auditoria", {"event": "login_success", "email": email})
        return jsonify({
            "message": "Login realizado com sucesso",
            "user": serialize_user(user, include_private=True)
        }), 200
    
    return jsonify({"error": "Usuário ou senha inválidos"}), 401

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logout realizado"}), 200

@app.route("/api/check-auth", methods=["GET"])
def check_auth():
    if "usuario_id" in session:
        db = next(get_db())
        user = db.query(User).get(session["usuario_id"])
        if user:
            return jsonify({"authenticated": True, "user": serialize_user(user, include_private=True)}), 200
    return jsonify({"authenticated": False}), 200

@app.route("/api/users/me", methods=["GET", "PUT"])
def me():
    user_id = require_login()
    db = next(get_db())
    user = db.query(User).get(user_id)

    if request.method == "GET":
        user_data = serialize_user(user, include_private=True)
        user_services = db.query(Service).filter(Service.owner_id == user.id).all()
        user_data["services"] = [serialize_service(s) for s in user_services]
        return jsonify(user_data), 200
    
    if request.method == "PUT":
        data = request.get_json()
        
        if "first_name" in data: user.first_name = data["first_name"]
        if "phone" in data: user.phone = data["phone"]
        
        if "nova_senha" in data and data["nova_senha"]:
            if not check_password_hash(user.password_hash, data.get("senha_atual", "")):
                return jsonify({"error": "Senha atual incorreta"}), 403
            user.password_hash = generate_password_hash(data["nova_senha"])
        
        db.commit()
        publish("fila_auditoria", {"event": "profile_updated", "email": user.email})
        return jsonify({"message": "Perfil atualizado"}), 200

@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user_public(user_id):
    require_login()
    db = next(get_db())
    user = db.query(User).get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404
    
    data = serialize_user(user, include_private=False)
    services = db.query(Service).filter(Service.owner_id == user.id).all()
    data["services"] = [serialize_service(s) for s in services]
    
    return jsonify(data), 200

@app.route("/api/services", methods=["GET", "POST"])
def services():
    user_id = require_login()
    db = next(get_db())

    if request.method == "GET":
        query = request.args.get("q", "").lower()
        services_query = db.query(Service).join(User)
        
        if query:
            like = f"%{query}%"
            services_query = services_query.filter(
                Service.title.ilike(like) | User.first_name.ilike(like)
            )
            
        results = services_query.all()
        return jsonify([serialize_service(s) for s in results]), 200

    if request.method == "POST":
        data = request.get_json()
        if not data.get("nome") or not data.get("valor"):
             return jsonify({"error": "Nome e valor são obrigatórios"}), 400
             
        new_service = Service(
            owner_id=user_id,
            title=data["nome"],
            description=data.get("descricao", ""),
            value=int(data["valor"])
        )
        db.add(new_service)
        db.commit()
        
        publish("fila_auditoria", {
            "event": "service_created", 
            "owner_email": session["usuario_email"],
            "service_title": new_service.title
        })
        return jsonify(serialize_service(new_service)), 201

@app.route("/api/services/<int:service_id>", methods=["GET", "PUT", "DELETE"])
def service_detail(service_id):
    user_id = require_login()
    db = next(get_db())
    service = db.query(Service).get(service_id)
    
    if not service:
        return jsonify({"error": "Serviço não encontrado"}), 404

    if request.method == "GET":
        return jsonify(serialize_service(service)), 200

    if service.owner_id != user_id:
        return jsonify({"error": "Acesso negado"}), 403

    if request.method == "DELETE":
        db.delete(service)
        db.commit()
        publish("fila_auditoria", {"event": "service_deleted", "service_id": service_id})
        return jsonify({"message": "Serviço removido"}), 200

    if request.method == "PUT":
        data = request.get_json()
        if "nome" in data: service.title = data["nome"]
        if "descricao" in data: service.description = data["descricao"]
        if "valor" in data: service.value = int(data["valor"])
        db.commit()
        return jsonify(serialize_service(service)), 200

@app.route("/api/transactions", methods=["GET", "POST"])
def transactions():
    user_id = require_login()
    db = next(get_db())

    if request.method == "POST":
        data = request.get_json()
        email_destino = data.get("email_destino", "").strip().lower()
        valor = int(data.get("valor", 0))
        
        remetente = db.query(User).get(user_id)
        destinatario = db.query(User).filter(User.email == email_destino).first()
        
        if not destinatario:
            return jsonify({"error": "Destinatário não encontrado"}), 404
        if destinatario.id == remetente.id:
            return jsonify({"error": "Não pode transferir para si mesmo"}), 400
        if valor <= 0:
            return jsonify({"error": "Valor deve ser positivo"}), 400
        if valor > remetente.balance:
            return jsonify({"error": "Saldo insuficiente"}), 400

        tx = Transaction(
            sender_id=remetente.id,
            recipient_id=destinatario.id,
            amount=valor,
            status="PENDING",
            created_at=datetime.utcnow()
        )
        db.add(tx)
        db.commit()

        publish("fila_transacoes", {"transaction_id": tx.id})
        return jsonify({"message": "Transferência em processamento", "transaction_id": tx.id}), 202

    if request.method == "GET":
        history = db.query(Transaction).filter(
            or_(Transaction.sender_id == user_id, Transaction.recipient_id == user_id)
        ).order_by(Transaction.created_at.desc()).limit(20).all()
        
        results = []
        for t in history:
            s = db.query(User).get(t.sender_id)
            r = db.query(User).get(t.recipient_id)
            results.append(serialize_transaction(t, s.email if s else "?", r.email if r else "?"))
            
        return jsonify(results), 200

@app.errorhandler(401)
def unauthorized(e):
    return jsonify({"error": str(e.description)}), 401

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Recurso não encontrado"}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Erro interno do servidor"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)