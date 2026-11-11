# BEWACHEN

> "When you can't explain, let your information speak."

A user-controlled, slider-centric safety PWA. Users complete a one-time onboarding to store their emergency info and contacts. The dashboard uses physical-feeling sliders (powered by `framer-motion`) to generate secure QR codes and trigger dynamic emergency dialing routed to local authorities.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Framer Motion
- **Backend:** Python FastAPI
- **Database & Auth:** Supabase (PostgreSQL)

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase URL and Anon Key

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
| `NEXT_PUBLIC_API_URL` | FastAPI backend URL (for QR token resolution) |

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

## Design Philosophy

**"Thoughtful Simplicity"** — Zero traditional buttons, checkboxes, or drop-downs on the main dashboard. Every core interaction is executed via physical-feeling, swipeable sliders.
