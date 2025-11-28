# rabbitmq.py
import os
import json
import pika

RABBIT_HOST = os.getenv("RABBIT_HOST", "localhost")
RABBIT_PORT = int(os.getenv("RABBIT_PORT", 5672))
RABBIT_USER = os.getenv("RABBIT_USER", "guest")
RABBIT_PASS = os.getenv("RABBIT_PASS", "guest")

_creds = pika.PlainCredentials(RABBIT_USER, RABBIT_PASS)
# Adicionamos connection_attempts e retry_delay para robustez
_params = pika.ConnectionParameters(
    host=RABBIT_HOST, 
    port=RABBIT_PORT, 
    credentials=_creds,
    connection_attempts=3,
    retry_delay=2
)

def publish(queue_name: str, payload: dict):
    """Publica mensagem JSON persistente na fila de forma segura."""
    try:
        conn = pika.BlockingConnection(_params)
        ch = conn.channel()
        ch.queue_declare(queue=queue_name, durable=True)
        ch.basic_publish(
            exchange="",
            routing_key=queue_name,
            body=json.dumps(payload, default=str),
            properties=pika.BasicProperties(delivery_mode=2)
        )
        conn.close()
    except Exception as e:
        # Imprime o erro no terminal do Docker mas NÃO trava a aplicação
        print(f"⚠️ ERRO AO PUBLICAR NO RABBITMQ ({queue_name}): {e}")