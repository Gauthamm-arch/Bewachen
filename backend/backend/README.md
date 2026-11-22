# Bewachen API (FastAPI)

Creates and revokes QR access codes, and resolves a scanned code into the owner's emergency information.

| Method | Path | Who | What |
|---|---|---|---|
| POST | `/api/tokens` | signed-in user | create a new QR code (older ones are switched off) |
| DELETE | `/api/tokens` | signed-in user | the Killswitch: switch off all active QR codes |
| GET | `/api/read/{access_hash}` | anyone with the code | read-only emergency info for the Helper View |
| GET | `/health` | anyone | is the server up? |

## Run it on your computer (Windows)

Open a terminal in the `backend` folder, then:

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Open `.env` and fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then start the server:

```
uvicorn app.main:app --reload --port 8000
```

Check http://localhost:8000/health shows `{"status":"ok"}`. Keep this terminal open while you use the app.
(Interactive API docs are at http://localhost:8000/docs.)

## Deploy (Render or Railway)

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers`
- Environment variables: the same ones as `.env`, with `ALLOWED_ORIGINS` set to your Vercel URL.
