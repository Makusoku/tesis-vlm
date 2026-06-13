from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://agrocafellm:agrocafellm@localhost:5432/agrocafellm"
    upload_dir: str = "backend/uploads"
    processed_dir: str = "backend/processed"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
