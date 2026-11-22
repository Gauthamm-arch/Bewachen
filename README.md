# 🏼 BEWACHEN

> "Our moto - When you can't explain, let your information speak."

A user-controlled safety PWA that is slider centric. Users complete a one-time onboarding to store their emergency info and contacts. The core interaction on the dashboard uses sliders powered by framer motion to generate secure QR codes and trigger dynamic emergency dialing routed to local authorities.

## Tech Stack Implemented

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Framer Motion
- **Backend:** Python FastAPI
- **Database & Auth:** Supabase (PostgreSQL)
- **Hosting:**

## How it works

1. **Sign up** and fill in your profile once (name, countries, medical info, notes for responders, emergency contacts).
2. **Generate a QR code** from the dashboard. The QR contains only a long random link, never your personal data.
3. **Print it or keep it on your phone.** Anyone who scans it opens a read-only page with your details.
4. **Revoke it any time** with the Killswitch slider. Old QR codes stop working immediately.

## How to use
### As the owner
| Action | How |
|---|---|
| Create an account | Open the app, choose *Create an account*, then complete the one-time onboarding. |
| Generate / regenerate a QR code | Slide **Slide to Generate QR** to the end. Regenerating switches off the previous code. |
| Switch the QR code off | Slide **Slide to Revoke Access**. |
| Practice the emergency slider | Drag the red phone knob towards **Ambulance**, **Police** or **Fire**. A **demo** dialer opens; tap *End call* (or press `Esc`) to close it and the knob returns home. |
| Edit your profile / sign out / reset | Open **Menu** (top right). |

### As someone who scans a QR code
1. Scan the QR code with any phone camera.
2. Read the person's name, medical information and notes for responders.
3. Under **Call a contact**, slide the knob to the end to call that contact.
4. Under **Call emergency services**, slide the red knob to Ambulance, Police or Fire. The numbers shown are for the country the person lives in.

## Getting Started

**To access the deployed version, type [https://bewachen-1.onrender.com/](https://bewachen-1.onrender.com/) into a browser**
> "Wait 30 seconds to 1 minute for the render to wake up"

**To run it locally**

Go to project directory and 

**1. Frontend** (first terminal)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase URL and Anon Key

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

**2. Backend** (in a second terminal)

```bash
cd backend/backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # Windows: copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Check http://localhost:8000/health shows `{"status":"ok"}`.


## Environment Variables

**Frontend** 

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
| `NEXT_PUBLIC_API_URL` | FastAPI backend URL (for QR token resolution) |


**Backend** 

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service role** key. **Keep it secret. Backend only.** |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs allowed to call the API |
| `READ_RATE_LIMIT` | Scans allowed per minute per IP (default 60) |
| `TOKEN_RATE_LIMIT` | QR create/revoke requests per minute per user (default 20) |

> Never commit `.env` files or put the service role key in the frontend.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx       # Root layout with global styles
│   ├── page.tsx         # Landing / entry point
│   └── globals.css      # Tailwind + custom styles
├── lib/                 # Shared utilities
│   ├── supabase.ts      # Supabase client
│   ├── emergency-numbers.ts  # Country → emergency number mappings
│   └── types.ts         # TypeScript interfaces
└── components/          # Reusable UI components (coming soon)
```

## Current limitations

- **Emergency numbers are a small table.** Only about two dozen countries are listed; everywhere else falls back to `112`. Numbers change over time, so verify them against each government's official source before real use.
- **No location sharing, SMS or alerts.** The app does not send your location or notify your contacts.
- **Needs an internet connection.** There is no offline mode. Scanned pages load their data from the server.
- **Phone-only calling.** The helper page uses `tel:` links, so calling works on phones but not on most desktops.
- **Email and password sign-in only.** No social login, and no password-reset flow is documented here.
- **Single QR code per person**, and a single profile language (English).
- **Database schema is not included in this repo.** You need Supabase tables named `users`, `profiles`, `contacts` and `qr_tokens` set up yourself.
- **Free-tier hosting is slow to wake up.** On Render's free plan the backend sleeps after 15 minutes idle, so the first scan afterwards can take about a minute. Supabase free projects also pause after a week of inactivity.
- **Not a certified medical or emergency product.** It is a personal / demo project with no guarantee of availability.
- **PWA icons are missing.** `manifest.json` references `icon-192.png` and `icon-512.png`, which still need to be added to `public/`.

## Roadmap

- Add the Supabase schema (SQL) to the repo
- More countries in the emergency numbers table, with sources
- Location sharing and contact alerts
- Offline-friendly helper page and PWA icons
- Password reset and more sign-in options

##Design Philosophy
**Thoughtful Simplicity**


