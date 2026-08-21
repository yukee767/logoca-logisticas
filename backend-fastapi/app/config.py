"""
app/config.py — Settings via pydantic-settings
Lê variáveis de ambiente com defaults compatíveis com docker-compose.yml e .env.example
"""
from functools import lru_cache
from typing import List, Optional
from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──
    env: str = Field(default="development", alias="ENV")
    port: int = Field(default=8000, alias="PORT")
    log_level: str = Field(default="info")
    app_name: str = "LogoCá Logísticas — FastAPI"
    app_version: str = "1.0.0"
    enable_swagger: bool = Field(default=True, alias="ENABLE_SWAGGER")

    # ── Database ──
    database_url: str = Field(
        default="postgresql+asyncpg://logoca:logoca123@localhost:5432/logoca_db",
        alias="DATABASE_URL",
    )
    # Converte postgres:// ou postgresql:// para asyncpg
    @field_validator("database_url", mode="before")
    @classmethod
    def _fix_db_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and "+asyncpg" not in v:
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        # remove ?schema=public se vier do Nest
        if "?schema=" in v:
            v = v.split("?")[0]
        return v

    # ── Redis ──
    redis_url: str = Field(default="redis://:redis123@localhost:6379/0", alias="REDIS_URL")
    redis_password: Optional[str] = Field(default="redis123", alias="REDIS_PASSWORD")

    # ── Apache Ignite ──
    ignite_host: str = Field(default="localhost", alias="IGNITE_HOST")
    ignite_port: int = Field(default=10800, alias="IGNITE_PORT")
    ignite_cache_user: str = Field(default="user-cache", alias="IGNITE_CACHE_USER")
    ignite_cache_admin: str = Field(default="admin-cache", alias="IGNITE_CACHE_ADMIN")

    @property
    def ignite_url(self) -> str:
        return f"{self.ignite_host}:{self.ignite_port}"

    # ── RabbitMQ ──
    rabbitmq_url: str = Field(default="amqp://logoca:logoca123@localhost:5672/", alias="RABBITMQ_URL")
    rabbitmq_user: str = Field(default="logoca", alias="RABBITMQ_USER")
    rabbitmq_password: str = Field(default="logoca123", alias="RABBITMQ_PASSWORD")

    # ── Kafka ──
    kafka_brokers: str = Field(default="localhost:9092", alias="KAFKA_BROKERS")
    kafka_zookeeper_connect: str = Field(default="localhost:2181", alias="KAFKA_ZOOKEEPER_CONNECT")

    @property
    def kafka_brokers_list(self) -> List[str]:
        return [b.strip() for b in self.kafka_brokers.split(",") if b.strip()]

    # ── JWT / Security ──
    jwt_secret: str = Field(default="super-secret-jwt-logoca-2024-troque-em-producao", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expires_in: str = Field(default="7d", alias="JWT_EXPIRES_IN")
    jwt_refresh_secret: str = Field(default="super-secret-refresh-logoca-2024", alias="JWT_REFRESH_SECRET")
    bcrypt_rounds: int = Field(default=10, alias="BCRYPT_ROUNDS")

    # ── CORS ──
    cors_origin: str = Field(default="http://localhost:4200,http://localhost:3001", alias="CORS_ORIGIN")

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.cors_origin.split(",") if o.strip()]

    # ── Finance ──
    storage_markup: float = 0.20  # 20% armazenamento

    # ── Gps / Tracking ──
    tracking_ws_heartbeat: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
