"""
app/messaging.py — RabbitMQ publisher (user>empresa) + Kafka producer (admin)
RabbitMQ: aio-pika (async)
Kafka: aiokafka + kafka-python fallback
"""
import json
import logging
from typing import Any, Dict, Optional

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ──────────────────────────────────────────────────────────────
# RabbitMQ — aio-pika
# ──────────────────────────────────────────────────────────────
_rabbit_connection = None
_rabbit_channel = None


async def get_rabbit_channel():
    global _rabbit_connection, _rabbit_channel
    if _rabbit_channel is not None and not _rabbit_channel.is_closed:
        return _rabbit_channel
    try:
        import aio_pika

        _rabbit_connection = await aio_pika.connect_robust(settings.rabbitmq_url)
        _rabbit_channel = await _rabbit_connection.channel()
        # Exchanges padrão
        await _rabbit_channel.declare_exchange("logoca.events", aio_pika.ExchangeType.TOPIC, durable=True)
        await _rabbit_channel.declare_exchange("logoca.notifications", aio_pika.ExchangeType.FANOUT, durable=True)
        logger.info("RabbitMQ conectado")
        return _rabbit_channel
    except Exception as e:
        logger.warning(f"RabbitMQ não disponível: {e}")
        return None


async def close_rabbit() -> None:
    global _rabbit_connection, _rabbit_channel
    if _rabbit_channel is not None:
        try:
            await _rabbit_channel.close()
        except Exception:
            pass
        _rabbit_channel = None
    if _rabbit_connection is not None:
        try:
            await _rabbit_connection.close()
        except Exception:
            pass
        _rabbit_connection = None


class RabbitMQPublisher:
    """
    Publisher transacional user → empresa
    Ex.: pedidos, notificações, stock alerts
    """

    @staticmethod
    async def publish(
        routing_key: str,
        payload: Dict[str, Any],
        exchange: str = "logoca.events",
        persistent: bool = True,
    ) -> bool:
        """
        Publica mensagem no RabbitMQ.
        routing_key exemplos: order.created, order.updated, stock.alert, user.notification
        """
        channel = await get_rabbit_channel()
        if channel is None:
            logger.warning(f"[RabbitMQ FALLBACK] {routing_key}: {json.dumps(payload, default=str)[:500]}")
            return False
        try:
            import aio_pika

            ex = await channel.get_exchange(exchange)
            message = aio_pika.Message(
                body=json.dumps(payload, default=str).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT if persistent else aio_pika.DeliveryMode.NOT_PERSISTENT,
            )
            await ex.publish(message, routing_key=routing_key)
            logger.info(f"[RabbitMQ] published {routing_key} -> {exchange}")
            return True
        except Exception as e:
            logger.error(f"[RabbitMQ] publish error {routing_key}: {e}")
            return False

    # Helpers de domínio
    @staticmethod
    async def order_created(order_data: dict) -> bool:
        return await RabbitMQPublisher.publish("order.created", order_data)

    @staticmethod
    async def order_updated(order_data: dict) -> bool:
        return await RabbitMQPublisher.publish("order.updated", order_data)

    @staticmethod
    async def stock_alert(stock_data: dict) -> bool:
        return await RabbitMQPublisher.publish("stock.alert", stock_data)

    @staticmethod
    async def route_updated(route_data: dict) -> bool:
        return await RabbitMQPublisher.publish("route.updated", route_data)

    @staticmethod
    async def tracking_event(tracking_data: dict) -> bool:
        return await RabbitMQPublisher.publish("tracking.updated", tracking_data)


# ──────────────────────────────────────────────────────────────
# Kafka — aiokafka (async) com fallback sync kafka-python
# ──────────────────────────────────────────────────────────────
_kafka_producer = None  # aiokafka
_kafka_sync_producer = None


async def get_kafka_producer():
    global _kafka_producer
    if _kafka_producer is not None:
        return _kafka_producer
    try:
        from aiokafka import AIOKafkaProducer

        producer = AIOKafkaProducer(
            bootstrap_servers=settings.kafka_brokers_list,
            value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            acks="all",
            enable_idempotence=True,
        )
        await producer.start()
        _kafka_producer = producer
        logger.info(f"Kafka conectado: {settings.kafka_brokers}")
        return producer
    except Exception as e:
        logger.warning(f"Kafka (aiokafka) não disponível: {e}")
        return None


def get_kafka_sync_producer():
    global _kafka_sync_producer
    if _kafka_sync_producer is not None:
        return _kafka_sync_producer
    try:
        from kafka import KafkaProducer

        producer = KafkaProducer(
            bootstrap_servers=settings.kafka_brokers_list,
            value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            acks="all",
            retries=3,
        )
        _kafka_sync_producer = producer
        return producer
    except Exception as e:
        logger.warning(f"Kafka sync não disponível: {e}")
        return None


async def close_kafka() -> None:
    global _kafka_producer
    if _kafka_producer is not None:
        try:
            await _kafka_producer.stop()
        except Exception:
            pass
        _kafka_producer = None
    global _kafka_sync_producer
    if _kafka_sync_producer is not None:
        try:
            _kafka_sync_producer.flush()
            _kafka_sync_producer.close()
        except Exception:
            pass
        _kafka_sync_producer = None


class KafkaProducer:
    """
    Producer admin — eventos de domínio, auditoria, ETL
    Tópicos: admin.* / logoca.admin.*
    """

    @staticmethod
    async def publish(topic: str, payload: Dict[str, Any], key: Optional[str] = None) -> bool:
        producer = await get_kafka_producer()
        if producer is not None:
            try:
                await producer.send_and_wait(topic, value=payload, key=key)
                logger.info(f"[Kafka] published -> {topic} key={key}")
                return True
            except Exception as e:
                logger.error(f"[Kafka] async publish error {topic}: {e}")

        # fallback sync
        sync_prod = get_kafka_sync_producer()
        if sync_prod is not None:
            try:
                sync_prod.send(topic, value=payload, key=key)
                sync_prod.flush(timeout=5)
                logger.info(f"[Kafka.sync] published -> {topic}")
                return True
            except Exception as e:
                logger.error(f"[Kafka.sync] publish error {topic}: {e}")

        logger.warning(f"[Kafka FALLBACK LOG] topic={topic} key={key} payload={json.dumps(payload, default=str)[:500]}")
        return False

    # Helpers de domínio admin
    @staticmethod
    async def admin_event(event_type: str, payload: dict) -> bool:
        return await KafkaProducer.publish(f"admin.{event_type}", payload, key=payload.get("id"))

    @staticmethod
    async def order_admin_event(order_data: dict, action: str = "created") -> bool:
        return await KafkaProducer.publish(f"admin.order.{action}", order_data, key=str(order_data.get("id")))

    @staticmethod
    async def stock_admin_event(stock_data: dict) -> bool:
        return await KafkaProducer.publish("admin.stock.updated", stock_data)

    @staticmethod
    async def tracking_admin_event(tracking_data: dict) -> bool:
        return await KafkaProducer.publish("admin.tracking.events", tracking_data)
