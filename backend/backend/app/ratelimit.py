import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class RateLimiter:
    """Simple in-memory sliding window. Fine for one server; use Redis if you scale to several."""

    def __init__(self, limit: int, window_seconds: float = 60.0):
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > self.window:
            hits.popleft()
        if len(hits) >= self.limit:
            retry = max(1, int(self.window - (now - hits[0])))
            raise HTTPException(429, "Too many requests. Please wait a moment and try again.", headers={"Retry-After": str(retry)})
        hits.append(now)
        if len(self._hits) > 10_000:  # keep memory bounded
            for k in [k for k, v in self._hits.items() if not v or now - v[-1] > self.window]:
                del self._hits[k]


def client_ip(request: Request) -> str:
    """Best-effort client address. Behind a proxy (Render, Railway) the last X-Forwarded-For entry is the proxy-seen client."""
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"
