"""
应用配置
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """应用配置类"""

    # 数据库配置
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/lingxian_haowu"

    # Redis配置
    REDIS_URL: str = "redis://localhost:6379/0"

    # 微信小程序配置
    WECHAT_APP_ID: str = ""
    WECHAT_APP_SECRET: str = ""

    # 微信支付配置
    WECHAT_MCH_ID: str = ""
    WECHAT_API_KEY: str = ""
    WECHAT_CERT_PATH: Optional[str] = None
    WECHAT_KEY_PATH: Optional[str] = None
    WECHAT_NOTIFY_URL: Optional[str] = None

    # JWT配置
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7天

    # MinIO对象存储配置
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET: str = "lingxian-haowu"
    MINIO_SECURE: bool = False
    MINIO_INTERNAL_ENDPOINT: str = "http://minio:9000"  # Docker内部访问

    # 服务配置
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True

    # 日志配置
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True


# 创建配置实例
settings = Settings()
