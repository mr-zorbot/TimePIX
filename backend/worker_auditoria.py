# worker_auditoria.py
import os
import json
import pika
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Audit
from rabbitmq import RABBIT_HOST, RABBIT_PORT, RABBIT_USER, RABBIT_PASS

# URL de conexão com o banco de dados (credenciais devem ser trocadas)
DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://user:pass@localhost/timepix_db")

# engine do SQLAlchemy para gerir o BD
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# configurações para acessar o RabbitMQ
_creds = pika.PlainCredentials(RABBIT_USER, RABBIT_PASS)
_params = pika.ConnectionParameters(
    host=RABBIT_HOST, port=RABBIT_PORT, credentials=_creds)


def on_message(ch, method, properties, body):

    payload = json.loads(body)
    db = SessionLocal()
    try:  # tenta registrar os dados no BD
        evt = Audit(event_type=payload.get("event", "unknown"),
                    payload=json.dumps(payload), )
        db.add(evt)
        db.commit()
        print("[audit] Gravado evento:", payload.get("event"))
    except Exception as e:  # restaura se der erro
        db.rollback()
        print("[audit] Erro:", e)
    finally:  # fecha a conexão com o BD
        db.close()
    ch.basic_ack(delivery_tag=method.delivery_tag)


if __name__ == "__main__":
    # estabelece a conexão com o RabbitMQ
    conn = pika.BlockingConnection(_params)
    channel = conn.channel()
    # declara a fila e a torna persistente
    channel.queue_declare(queue="fila_auditoria", durable=True)
    channel.basic_qos(prefetch_count=1)  # pega uma mensagem por vez
    channel.basic_consume(queue="fila_auditoria",
                          on_message_callback=on_message)
    print("[audit worker] Aguardando mensagens na fila 'fila_auditoria'...")
    channel.start_consuming()
