from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path
import os

# Get the directory where this config.py file lives (backend/app)
# Then go up one level to backend/ where .env.local should be
ENV_FILE_PATH = Path(__file__).resolve().parent.parent / ".env.local"

class Settings(BaseSettings):
    DATABASE_URL: str
    
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL: str | None = None
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str | None = None
    
    # Google (Optional, if used directly)
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_GENERATIVE_AI_API_KEY: str | None = None

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH),
        extra="ignore"
    )

@lru_cache()
def get_settings():
    return Settings()
