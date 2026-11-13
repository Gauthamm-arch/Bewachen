"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  EmergencyService,
  SERVICE_LABELS,
  getCountryName,
  getEmergencyNumber,
} from "@/lib/emergencyNumbers";

type Props = {
  service: EmergencyService;
  countryCode: string | null | undefined;
  onClose: () => void;
};

// Full-screen mock phone dialer. No real call is placed.
// Parent: render with key={service} so it restarts when the service changes.
export default function MockDialer({ service, countryCode, onClose }: Props) {
  const number = getEmergencyNumber(countryCode, service);
  const country = getCountryName(countryCode);
  const label = SERVICE_LABELS[service];

  const [typed, setTyped] = useState(0);
  const calling = typed >= number.length;

  // "Dial" one digit at a time.
  useEffect(() => {
    if (typed >= number.length) return;
    const id = setTimeout(() => setTyped((t) => t + 1), 220);
    return () => clearTimeout(id);
  }, [typed, number]);

  // Escape ends the call.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Calling ${label} on ${number}`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-bewachen-dark px-6 py-12 text-bewachen-text"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.25 }}
    >
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-bewachen-muted">
          Demo call · no real call is placed
        </p>
        <h1 className="mt-6 text-3xl font-extrabold">{label}</h1>
        <p className="mt-1 text-bewachen-muted">{country}</p>
      </div>

      <div className="flex flex-col items-center">
        <div aria-live="polite" className="flex text-7xl font-extrabold tabular-nums tracking-wide sm:text-8xl">
          {number.split("").map((digit, i) => (
            <motion.span
              key={i}
              initial={false}
              animate={i < typed ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ duration: 0.15 }}
            >
              {digit}
            </motion.span>
          ))}
        </div>

        <div className="relative mt-14 flex h-24 w-24 items-center justify-center">
          {calling && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full bg-bewachen-success/30"
                animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.span
                className="absolute inset-0 rounded-full bg-bewachen-success/30"
                animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
              />
            </>
          )}
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-bewachen-success">
            <PhoneIcon className="h-9 w-9 text-white" />
          </span>
        </div>
        <p className="mt-6 text-xl font-semibold" aria-live="polite">
          {calling ? "Calling…" : "Dialing…"}
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onClose}
          aria-label="End call"
          className="glow-red flex h-20 w-20 items-center justify-center rounded-full bg-bewachen-danger"
        >
          <PhoneIcon className="h-9 w-9 rotate-[135deg] text-white" />
        </button>
        <span className="font-semibold text-bewachen-muted">End call</span>
      </div>
    </motion.div>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
