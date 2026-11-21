import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgroVerse AI"
    API_V1_PREFIX: str = "/api"
    SECRET_KEY: str = "agroverse_super_secret_jwt_key_development_2026_xyz"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./agroverse.db")

    # Hardware Device Security
    AGRO_DEVICE_TOKEN: str = os.getenv("AGRO_DEVICE_TOKEN", "agro_esp8266_secure_key_2026")
    DEFAULT_DEVICE_ID: str = os.getenv("DEFAULT_DEVICE_ID", "AGRO_001")
    DEVICE_OFFLINE_TIMEOUT_SECONDS: int = 60

    # Irrigation Safety
    DEFAULT_MOISTURE_THRESHOLD_LOW: float = 30.0
    DEFAULT_MOISTURE_THRESHOLD_HIGH: float = 75.0
    MAX_PUMP_CONTINUOUS_RUNTIME_SECONDS: int = 600 # 10 mins auto-shutoff

    # AI Integration
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "local")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-3-flash-preview")

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://agroverse-ai-frontend.onrender.com"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
