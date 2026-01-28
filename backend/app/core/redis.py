"""
Redis客户端
"""
import redis
from redis import asyncio as aioredis

from app.core.config import settings


# 创建同步Redis客户端（用于某些同步场景）
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


async def get_redis():
    """
    获取异步Redis客户端
    依赖注入使用
    """
    redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        yield redis
    finally:
        await redis.close()
