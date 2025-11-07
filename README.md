# ⏳ TimePIX  

**TimePIX** é um aplicativo de **banco de tempo**, uma plataforma onde as pessoas podem trocar serviços usando **horas como moeda**, em vez de dinheiro. Cada hora de serviço prestado equivale a **1 crédito** que pode ser usado para "comprar" outra hora de serviço oferecido por outro participante. O projeto está sendo desenvolvido para a disciplina **GCC267 - Projeto Integrador I** do curso **Bacharelado em Sistemas de Informação** da **Universidade Federal de Lavras**.

---

## 📌 Como funciona um Banco de Tempo?  
- Usuário A oferece 2h de aula de inglês.  
- Usuário B aceita a oferta e "paga" com 2 horas do seu saldo.  
- O sistema credita **+2h** na conta do Usuário A e debita **–2h** na conta do Usuário B.  
- Todos os usuários partem de um saldo inicial e podem acumular ou gastar horas conforme participam da comunidade.  

O objetivo é incentivar a **colaboração e solidariedade** dentro de uma rede de pessoas, valorizando o tempo de cada um igualmente.  

---

## ⚙️ Tecnologias utilizadas  

### 🐍 Flask  
O **Flask** é o framework web em Python que serve como núcleo do TimePIX, responsável por gerenciar cadastro, login, ofertas, solicitações e saldos dos usuários, além de atuar como ponto central de integração entre o banco de dados e o sistema de mensageria.  

### 📬 RabbitMQ  
O **RabbitMQ** é o sistema de mensageria do TimePIX, responsável por tornar os processos assíncronos e escaláveis, organizando filas de transações, notificações e auditoria para evitar sobrecarga da aplicação mesmo em alto volume de usuários.  

### 🗄️ MySQL 
O **MySQL** é o gerenciador do banco de dados do TimePIX, armazenando usuários, ofertas, solicitações, transações e saldos de horas.

## ✅ Fluxo simplificado de funcioamento

1. **Usuário preenche o formulário de transações**
   - Informa o e-mail do destinatário e o valor (em horas).
   - Clica em “Enviar”.

2. **Validação no Flask**
   - Verifica se:
     - O usuário está logado.
     - O destinatário existe.
     - O destinatário ≠ remetente.
     - O valor é um inteiro maior que zero.
     - O valor não excede o saldo do remetente.
   - Se falhar → mensagem de erro é exibida.

3. **Criação da transação**
   - Um registro é criado na tabela `transactions` com:
     ```
     status = "PENDING"
     ```
   - Ele representa uma transferência pendente de processamento.

4. **Publicação no RabbitMQ**
   - Flask envia uma mensagem na fila:
     ```
     fila_transacoes
     { "transaction_id": <id> }
     ```
   - Esse evento informa que a transação está aguardando processamento.

5. **Worker recebe a mensagem**
   - O `worker_transacoes.py` escuta a fila.
   - Ao receber `transaction_id`, ele:
     - Consulta novamente a transação no banco.
     - Obtém remetente e destinatário com lock (FOR UPDATE) → evita corrida.

6. **Validação feita pelo worker**
   - Verifica se o status ainda é `PENDING`.
   - Verifica saldo do remetente.
   - Se o saldo for insuficiente → falha a transação:
     ```
     tx.status = "FAILED"
     tx.processed_at = datetime.utcnow()
     tx.note = "Saldo insuficiente"
     ```

7. **Processamento da transferência**
   - Se o saldo for suficiente:
     - Debita `sender.balance -= tx.amount`
     - Credita `recipient.balance += tx.amount`
     - Atualiza:
       ```
       tx.status = "PROCESSED"
       tx.processed_at = datetime.utcnow()
       ```

8. **Registro de Auditoria**
   - Worker publica na fila `fila_auditoria` um objeto contendo:
     - IDs
     - Valor
     - Timestamp
     - Resultado

9. **Usuário visualiza resultado**
   - Na página de histórico, a transação é exibida com:
     - Remetente
     - Destinatário
     - Data
     - Valor
     - Status:
       - ✅ PROCESSED (sucesso)
       - ❌ FAILED (falha)
       - ⏳ PENDING (ainda aguardando)

---

## 🚀 Como testar o TimePIX

1. **Clone este repositório:** ```$ git clone https://github.com/mr-zorbot/TimePIX.git```
2. **Entre no diretório do projeto:** ```$ cd TimePIX/```
3. **Construa/baixe as imagens e execute os containeres:** ```$ (docker|podman) compose up -d --build```
4. **Acesse a aplicação:** A inteface web do TimePix ficará disponível em `http://localhost:8080/`
