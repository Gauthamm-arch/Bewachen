"use client";

// TEMPORARY test page for Step 3. Delete this whole folder in Step 4,
// when the slider dashboard starts opening MockDialer.

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import MockDialer from "@/components/MockDialer";
import { useUserCountry } from "@/lib/useUserCountry";
import {
  EmergencyService,
  SERVICE_LABELS,
  getCountryName,
  getEmergencyNumber,
} from "@/lib/emergencyNumbers";

const SERVICES: EmergencyService[] = ["ambulance", "police", "fire"];

export default function DialerTestPage() {
  const { countryCode, loading, error } = useUserCountry();
  const [active, setActive] = useState<EmergencyService | null>(null);

  if (loading) return <main className="flex min-h-screen items-center justify-center text-bewachen-muted">Loading…</main>;

  if (error)
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p role="alert" className="font-semibold text-bewachen-danger">{error}</p>
        <a href="/login" className="underline underline-offset-4">Go to login</a>
      </main>
    );

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <header>
        <h1 className="text-2xl font-extrabold">Dialer test</h1>
        <p className="mt-1 text-bewachen-muted">
          Country of residence: {getCountryName(countryCode)} ({countryCode ?? "not set"})
        </p>
      </header>

      <div className="space-y-3">
        {SERVICES.map((s) => (
          <button
            key={s}
            onClick={() => setActive(s)}
            className="flex w-full items-center justify-between rounded-2xl border border-bewachen-border bg-bewachen-surface px-5 py-5 text-left"
          >
            <span className="text-xl font-bold">{SERVICE_LABELS[s]}</span>
            <span className="text-xl font-bold tabular-nums text-bewachen-accent">
              {getEmergencyNumber(countryCode, s)}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <MockDialer key={active} service={active} countryCode={countryCode} onClose={() => setActive(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}
