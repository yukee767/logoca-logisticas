"""
app/cache.py — Redis + Apache Ignite client wrapper
Redis: dados sensíveis/financeiros, cache, sessões
Ignite: cache distribuído (user-cache / admin-cache)
"""
import json
import logging
from typing import Any, Optional

import redis.asyncio as aioredis

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ──────────────────────────────────────────────────────────────
# Redis
# ──────────────────────────────────────────────────────────────
_redis: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
        )
        logger.info(f"Redis conectado: {settings.redis_url.split('@')[-1]}")
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.close()
        _redis = None


class RedisCache:
    """Wrapper tipado para operações Redis"""

    @staticmethod
    async def get(key: str) -> Optional[str]:
        r = await get_redis()
        return await r.get(key)

    @staticmethod
    async def get_json(key: str) -> Optional[Any]:
        r = await get_redis()
        val = await r.get(key)
        if val is None:
            return None
        try:
            return json.loads(val)
        except json.JSONDecodeError:
            return val

    @staticmethod
    async def set(key: str, value: Any, ttl: int = 3600) -> None:
        r = await get_redis()
        data = json.dumps(value, default=str) if not isinstance(value, str) else value
        await r.set(key, data, ex=ttl)

    @staticmethod
    async def set_json(key: str, value: Any, ttl: int = 3600) -> None:
        await RedisCache.set(key, json.dumps(value, default=str), ttl)

    @staticmethod
    async def delete(key: str) -> None:
        r = await get_redis()
        await r.delete(key)

    @staticmethod
    async def exists(key: str) -> bool:
        r = await get_redis()
        return bool(await r.exists(key))

    @staticmethod
    async def incr(key: str) -> int:
        r = await get_redis()
        return await r.incr(key)

    # ── Helpers financeiros (dados sensíveis com TTL curto e prefixo) ──
    @staticmethod
    def finance_key(entity: str, entity_id: str) -> str:
        return f"finance:{entity}:{entity_id}"

    @staticmethod
    async def cache_finance(entity: str, entity_id: str, data: Any, ttl: int = 600) -> None:
        await RedisCache.set(RedisCache.finance_key(entity, entity_id), data, ttl=ttl)

    @staticmethod
    async def get_finance(entity: str, entity_id: str) -> Optional[Any]:
        return await RedisCache.get_json(RedisCache.finance_key(entity, entity_id))

    # ── Tracking realtime cache ──
    @staticmethod
    def tracking_key(truck_id: str) -> str:
        return f"tracking:truck:{truck_id}"

    @staticmethod
    async def set_tracking(truck_id: str, payload: dict, ttl: int = 300) -> None:
        await RedisCache.set(RedisCache.tracking_key(truck_id), json.dumps(payload, default=str), ttl=ttl)

    @staticmethod
    async def get_tracking(truck_id: str) -> Optional[dict]:
        return await RedisCache.get_json(RedisCache.tracking_key(truck_id))


# ──────────────────────────────────────────────────────────────
# Apache Ignite (thin client via pyignite)
# ──────────────────────────────────────────────────────────────
_ignite_client = None


def get_ignite_client():
    global _ignite_client
    if _ignite_client is not None:
        return _ignite_client
    try:
        from pyignite import Client

        client = Client()
        client.connect(settings.ignite_host, settings.ignite_port)
        _ignite_client = client
        logger.info(f"Ignite conectado: {settings.ignite_url}")
        return client
    except Exception as e:
        logger.warning(f"Ignite não disponível ({e}); usando fallback Redis para cache distribuído")
        return None


def close_ignite() -> None:
    global _ignite_client
    if _ignite_client is not None:
        try:
            _ignite_client.close()
        except Exception:
            pass
        _ignite_client = None


class IgniteCache:
    """
    Wrapper Ignite com fallback para Redis.
    Caches separados: user-cache vs admin-cache
    """

    @staticmethod
    def _cache_name(is_admin: bool = False) -> str:
        return settings.ignite_cache_admin if is_admin else settings.ignite_cache_user

    @staticmethod
    async def get(key: str, is_admin: bool = False) -> Optional[Any]:
        client = get_ignite_client()
        cache_name = IgniteCache._cache_name(is_admin)
        if client is not None:
            try:
                cache = client.get_or_create_cache(cache_name)
                val = cache.get(key)
                if val is not None:
                    try:
                        return json.loads(val) if isinstance(val, str) else val
                    except Exception:
                        return val
                return None
            except Exception as e:
                logger.warning(f"Ignite get falhou {e}, fallback Redis")
        # fallback
        return await RedisCache.get_json(f"ignite:{cache_name}:{key}")

    @staticmethod
    async def put(key: str, value: Any, is_admin: bool = False) -> None:
        client = get_ignite_client()
        cache_name = IgniteCache._cache_name(is_admin)
        payload = json.dumps(value, default=str) if not isinstance(value, str) else value
        if client is not None:
            try:
                cache = client.get_or_create_cache(cache_name)
                cache.put(key, payload)
                return
            except Exception as e:
                logger.warning(f"Ignite put falhou {e}, fallback Redis")
        r = await get_redis()
        await r.set(f"ignite:{cache_name}:{key}", payload, ex=3600)

    @staticmethod
    async def delete(key: str, is_admin: bool = False) -> None:
        client = get_ignite_client()
        cache_name = IgniteCache._cache_name(is_admin)
        if client is not None:
            try:
                cache = client.get_or_create_cache(cache_name)
                cache.remove_key(key)
                return
            except Exception:
                pass
        r = await get_redis()
        await r.delete(f"ignite:{cache_name}:{key}")
