import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import read, tokens
from .config import settings
from .supabase_client import UpstreamError, close_client

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("bewachen")


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await close_client()


app = FastAPI(title="Bewachen API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)


@app.middleware("http")
async def privacy_headers(request: Request, call_next):
    """Emergency data must never be cached, indexed by search engines, or leaked through the Referer header."""
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Robots-Tag"] = "noindex, nofollow"
        response.headers["Referrer-Policy"] = "no-referrer"
    return response


@app.exception_handler(UpstreamError)
async def upstream_error(_: Request, exc: UpstreamError):
    log.error("Upstream failure: %s", exc)
    return JSONResponse(status_code=502, content={"detail": "The service is temporarily unavailable. Please try again."})


app.include_router(tokens.router)
app.include_router(read.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
