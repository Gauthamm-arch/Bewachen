import secrets

from fastapi import APIRouter, Depends, Response

from .auth import current_user_id
from .config import settings
from .ratelimit import RateLimiter
from .schemas import TokenCreated
from .supabase_client import rest

router = APIRouter(prefix="/api/tokens", tags=["tokens"])
_limiter = RateLimiter(settings.token_rate_limit)


def signed_in_user(user_id: str = Depends(current_user_id)) -> str:
    _limiter.check(user_id)
    return user_id


@router.post("", response_model=TokenCreated, status_code=201)
async def create_token(user_id: str = Depends(signed_in_user)) -> TokenCreated:
    """Create a new QR access hash for the signed-in user and switch off their older ones."""
    access_hash = secrets.token_urlsafe(32)  # 256 bits of randomness, URL-safe
    await rest("POST", "qr_tokens", json={"user_id": user_id, "access_hash": access_hash, "is_active": True}, prefer="return=minimal")
    await rest(
        "PATCH",
        "qr_tokens",
        params={"user_id": f"eq.{user_id}", "is_active": "eq.true", "access_hash": f"neq.{access_hash}"},
        json={"is_active": False},
        prefer="return=minimal",
    )
    return TokenCreated(access_hash=access_hash)


@router.delete("", status_code=204)
async def revoke_tokens(user_id: str = Depends(signed_in_user)) -> Response:
    """The Killswitch: switch off every active QR code for the signed-in user."""
    await rest(
        "PATCH",
        "qr_tokens",
        params={"user_id": f"eq.{user_id}", "is_active": "eq.true"},
        json={"is_active": False},
        prefer="return=minimal",
    )
    return Response(status_code=204)
