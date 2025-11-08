# rabbitmq.py
import os
import json
import pika

RABBIT_HOST = os.getenv("RABBIT_HOST", "localhost")
RABBIT_PORT = int(os.getenv("RABBIT_PORT", 5672))
RABBIT_USER = os.getenv("RABBIT_USER", "guest")  # apenas para testes
RABBIT_PASS = os.getenv("RABBIT_PASS", "guest")  # apenas para testes

_creds = pika.PlainCredentials(RABBIT_USER, RABBIT_PASS)
_params = pika.ConnectionParameters(
    host=RABBIT_HOST, port=RABBIT_PORT, credentials=_creds)


def publish(queue_name: str, payload: dict):
    """Publica mensagem JSON persistente na fila."""
    conn = pika.BlockingConnection(_params)
    ch = conn.channel()
    ch.queue_declare(queue=queue_name, durable=True)
    ch.basic_publish(
        exchange="",
        routing_key=queue_name,
        body=json.dumps(payload, default=str),
        # torna a mensagem persistente
        properties=pika.BasicProperties(delivery_mode=2)
    )
    conn.close()
