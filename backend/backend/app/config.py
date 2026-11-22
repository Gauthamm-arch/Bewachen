import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# Always read backend/.env, no matter which folder you start the server from.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    service_key: str
    allowed_origins: list[str]
    read_rate_limit: int
    token_rate_limit: int


def load_settings() -> Settings:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        raise RuntimeError(
            "Missing settings. Copy backend/.env.example to backend/.env and fill in "
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        )
    origins = [o.strip().rstrip("/") for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
    return Settings(
        supabase_url=url,
        service_key=key,
        allowed_origins=origins,
        read_rate_limit=int(os.getenv("READ_RATE_LIMIT", "60")),
        token_rate_limit=int(os.getenv("TOKEN_RATE_LIMIT", "20")),
    )


settings = load_settings()
