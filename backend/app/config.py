from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

# Get the directory where this config.py file lives (backend/app)
# Then go up one level to backend/ where .env.local should be
ENV_FILE_PATH = Path(__file__).resolve().parent.parent / ".env.local"

class Settings(BaseSettings):
    MONGODB_URI: str
    DB_NAME: str = "test"  # Default to 'test' or whatever your DB name is
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_GENERATIVE_AI_API_KEY: str | None = None

    class Config:
        env_file = str(ENV_FILE_PATH)
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
