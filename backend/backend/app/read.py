import re

from fastapi import APIRouter, HTTPException, Request

from .config import settings
from .ratelimit import RateLimiter, client_ip
from .schemas import ContactOut, HelperProfile
from .supabase_client import rest

router = APIRouter(prefix="/api/read", tags=["helper"])
_limiter = RateLimiter(settings.read_rate_limit)

_HASH = re.compile(r"^[A-Za-z0-9_-]{20,128}$")
# One message for "never existed", "revoked" and "malformed", so nobody can probe which codes exist.


def _not_active() -> HTTPException:
    return HTTPException(404, "This QR code is not active.")


@router.get("/{access_hash}", response_model=HelperProfile)
async def read_token(access_hash: str, request: Request) -> HelperProfile:
    """Public, read-only. Turns an active QR access hash into the owner's emergency information."""
    _limiter.check(client_ip(request))

    if not _HASH.fullmatch(access_hash):
        raise _not_active()

    tokens = await rest(
        "GET",
        "qr_tokens",
        params={"select": "user_id", "access_hash": f"eq.{access_hash}", "is_active": "eq.true", "limit": "1"},
    )
    if not tokens:
        raise _not_active()

    profiles = await rest(
        "GET",
        "profiles",
        params={
            "select": "profile_id,full_name,country_of_origin,country_of_residence,medical_info,custom_notes",
            "user_id": f"eq.{tokens[0]['user_id']}",
            "limit": "1",
        },
    )
    if not profiles:
        raise _not_active()
    profile = profiles[0]

    contacts = await rest(
        "GET",
        "contacts",
        params={"select": "name,phone_number,relationship", "profile_id": f"eq.{profile['profile_id']}", "order": "name.asc"},
    )

    return HelperProfile(
        full_name=profile.get("full_name"),
        country_of_origin=profile.get("country_of_origin"),
        country_of_residence=profile.get("country_of_residence"),
        medical_info=profile.get("medical_info"),
        custom_notes=profile.get("custom_notes"),
        contacts=[ContactOut(**c) for c in (contacts or [])],
    )
