"""Application configuration and environment settings."""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Emergent Nations environment configuration."""
    
    app_name: str = "Emergent Nations API"
    version: str = "0.1.0"
    environment: str = "development"
    debug: bool = True
    
    host: str = "127.0.0.1"
    port: int = 8000
    
    # CORS Configuration
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Database
    database_url: str = "sqlite:///./simulations.db"
    
    # AI / Ollama Settings
    use_mock_agents: bool = True
    ollama_base_url: str = "http://localhost:11434"
    default_ai_model: str = "qwen3:8b"
    alternative_ai_model: str = "qwen3:4b"
    
    # Simulation Defaults
    simulation_seed: int = 42
    total_territories: int = 36
    total_nations: int = 6
    max_turns: int = 200
    
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
