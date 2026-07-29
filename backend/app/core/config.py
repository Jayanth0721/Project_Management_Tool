from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str | None = None

    # ── PostgreSQL (preferred — read from env when set) ──
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "tolab"
    postgres_password: str = "tolab"
    postgres_db: str = "tolab"

    # ── Logging ──
    log_level: str = "INFO"

    # ── JWT ──
    secret_key: str = "change-me-to-a-random-string-at-least-32-chars"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # ── CORS ──
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # ── Redis ──
    redis_host: str = "localhost"
    redis_port: int = 6379

    # ── Storage ──
    storage_dir: str = "./storage"

    # ── SMTP ──
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "noreply@tolab.dev"

    @property
    def resolved_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        # If POSTGRES_HOST was explicitly set (not default), assume PostgreSQL
        import os
        if os.environ.get("POSTGRES_HOST"):
            return (
                f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
                f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
            )
        # Fall back to SQLite for local dev without Docker
        return "sqlite+aiosqlite:///./tolab.db"

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_user is not None)


settings = Settings()