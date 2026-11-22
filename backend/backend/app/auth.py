from fastapi import Header, HTTPException

from .supabase_client import UpstreamError, get_user


async def current_user_id(authorization: str | None = Header(default=None)) -> str:
    """Reads 'Authorization: Bearer <Supabase access token>' and returns the signed-in user's id."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Please sign in again.")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(401, "Please sign in again.")
    try:
        user = await get_user(token)
    except UpstreamError:
        raise HTTPException(502, "The sign-in service is temporarily unavailable. Please try again.")
    if not user or not user.get("id"):
        raise HTTPException(401, "Your session has expired. Please sign in again.")
    return str(user["id"])
