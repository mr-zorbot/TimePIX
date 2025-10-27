# worker_transacoes.py
import os
import json
from datetime import datetime
import pika

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from models import User, Transaction
from rabbitmq import RABBIT_HOST, RABBIT_PORT, RABBIT_USER, RABBIT_PASS

DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://user:pass@localhost/timepix_db")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Rabbit connection
_creds = pika.PlainCredentials(RABBIT_USER, RABBIT_PASS)
_params = pika.ConnectionParameters(
    host=RABBIT_HOST, port=RABBIT_PORT, credentials=_creds)


def process_transaction(tx_id: int):
    db = SessionLocal()
    try:
        # Recarrega a transação
        # Usa lock FOR UPDATE para proteção contra corrida
        tx = db.query(Transaction).with_for_update().filter(
            Transaction.id == tx_id).one_or_none()
        if not tx:
            print(f"[worker] Transação {tx_id} não encontrada.")
            return

        if tx.status != "PENDING":
            print(f"[worker] Transação {
                  tx_id} já processada (status={tx.status}).")
            return

        sender = db.query(User).with_for_update().filter(
            User.id == tx.sender_id).one()
        recipient = db.query(User).with_for_update().filter(
            User.id == tx.recipient_id).one()

        if sender.balance < tx.amount:
            tx.status = "FAILED"
            tx.processed_at = datetime.utcnow()
            tx.note = "Saldo insuficiente"
            db.commit()
            # publicar auditoria
            publish_audit({
                "event": "transaction_failed",
                "transaction_id": tx.id,
                "reason": "insufficient_balance",
                "sender_id": sender.id,
                "recipient_id": recipient.id,
                "amount": tx.amount,
                "timestamp": datetime.utcnow().isoformat()
            })
            print(f"[worker] Transação {tx_id} falhou por saldo insuficiente.")
            return

        # tudo ok: efetua débito/crédito atomically
        sender.balance -= tx.amount
        recipient.balance += tx.amount
        tx.status = "PROCESSED"
        tx.processed_at = datetime.utcnow()
        db.commit()

        publish_audit({
            "event": "transaction_processed",
            "transaction_id": tx.id,
            "sender_id": sender.id,
            "recipient_id": recipient.id,
            "amount": tx.amount,
            "timestamp": datetime.utcnow().isoformat()
        })
        print(f"[worker] Transação {tx_id} processada com sucesso.")
    except SQLAlchemyError as e:
        db.rollback()
        print("[worker] Erro DB:", e)
    finally:
        db.close()


def publish_audit(payload: dict):
    # publica na fila de auditoria
    conn = pika.BlockingConnection(_params)
    ch = conn.channel()
    ch.queue_declare(queue="fila_auditoria", durable=True)
    ch.basic_publish(exchange="", routing_key="fila_auditoria",
                     body=json.dumps(payload, default=str),
                     properties=pika.BasicProperties(delivery_mode=2))
    conn.close()


def on_message(ch, method, properties, body):
    data = json.loads(body)
    tx_id = data.get("transaction_id")
    if not tx_id:
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return
    try:
        process_transaction(int(tx_id))
    except Exception as e:
        print("Erro ao processar:", e)
    ch.basic_ack(delivery_tag=method.delivery_tag)


if __name__ == "__main__":
    conn = pika.BlockingConnection(_params)
    channel = conn.channel()
    channel.queue_declare(queue="fila_transacoes", durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue="fila_transacoes",
                          on_message_callback=on_message)
    print("[worker] Aguardando mensagens na fila 'fila_transacoes'...")
    channel.start_consuming()
