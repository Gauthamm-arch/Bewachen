"""Tiny wrapper around Supabase's REST API (PostgREST) and Auth, using the service-role key.

The service-role key bypasses row-level security, so it must only ever live on this server.
"""
import logging

import httpx

from .config import settings

log = logging.getLogger("bewachen")


class UpstreamError(Exception):
    """Supabase could not be reached or returned an unexpected error."""


_client: httpx.AsyncClient | None = None


def _http() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(base_url=settings.supabase_url, timeout=10.0)
    return _client


async def close_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def _service_headers(extra: dict[str, str] | None = None) -> dict[str, str]:
    headers = {"apikey": settings.service_key}
    # Legacy "service_role" keys are JWTs and also go in Authorization. New "secret" keys must not.
    if settings.service_key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {settings.service_key}"
    if extra:
        headers.update(extra)
    return headers


async def rest(
    method: str,
    table: str,
    *,
    params: dict[str, str] | None = None,
    json: dict | None = None,
    prefer: str | None = None,
) -> list[dict] | None:
    """Call /rest/v1/<table>. Returns the rows for GET, otherwise None."""
    headers = _service_headers({"Prefer": prefer} if prefer else None)
    try:
        resp = await _http().request(method, f"/rest/v1/{table}", params=params, json=json, headers=headers)
    except httpx.HTTPError as exc:
        log.error("Supabase unreachable (%s %s): %s", method, table, exc)
        raise UpstreamError(str(exc)) from exc
    if resp.status_code >= 400:
        log.error("Supabase error %s on %s %s: %s", resp.status_code, method, table, resp.text[:300])
        raise UpstreamError(f"{method} {table} -> {resp.status_code}")
    return resp.json() if method == "GET" and resp.content else None


async def get_user(access_token: str) -> dict | None:
    """Ask Supabase Auth who owns this access token. Returns None if the token is invalid or expired."""
    headers = {"apikey": settings.service_key, "Authorization": f"Bearer {access_token}"}
    try:
        resp = await _http().get("/auth/v1/user", headers=headers)
    except httpx.HTTPError as exc:
        log.error("Supabase Auth unreachable: %s", exc)
        raise UpstreamError(str(exc)) from exc
    if resp.status_code == 200:
        return resp.json()
    if resp.status_code in (400, 401, 403):
        return None
    log.error("Supabase Auth error %s: %s", resp.status_code, resp.text[:300])
    raise UpstreamError(f"auth -> {resp.status_code}")
