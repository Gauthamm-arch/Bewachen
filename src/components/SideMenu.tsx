"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import SlideToConfirm from "./SlideToConfirm";
import { LogOutIcon, UserIcon, XIcon } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
  onReset: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export default function SideMenu({ open, onClose, onReset, onSignOut }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setResetError(null);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const reset = async () => {
    setResetError(null);
    try {
      await onReset();
    } catch (e: any) {
      setResetError(e?.message ?? "Could not reset your profile. Please try again.");
      throw e;
    }
  };

  const row = "flex min-h-[64px] w-full items-center gap-4 rounded-2xl px-4 text-left text-xl font-semibold text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-500";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed right-0 top-0 z-40 flex h-full w-[88%] max-w-sm flex-col gap-2 overflow-y-auto border-l border-slate-700 bg-bewachen-surface p-5 text-slate-100"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold">Menu</h2>
              <button ref={closeRef} onClick={onClose} aria-label="Close menu" className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-600 focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-500">
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <Link href="/profile/edit" className={row}>
              <UserIcon className="h-7 w-7 text-blue-400" />
              Edit Profile
            </Link>

            <button onClick={() => void onSignOut()} className={row}>
              <LogOutIcon className="h-7 w-7 text-slate-300" />
              Sign out
            </button>

            <div className="mt-4 rounded-3xl border-2 border-red-500/40 bg-red-950/30 p-4">
              <h3 className="text-xl font-bold text-red-200">Complete Reset Profile</h3>
              <p className="mb-4 mt-1 text-base leading-snug text-slate-300">
                Deletes your profile and contacts, and turns off every QR code. You will set everything up again.
              </p>
              <SlideToConfirm label="Slide to Reset Profile" busyLabel="Resetting…" variant="danger" size="md" onComplete={reset} />
              {resetError && <p role="alert" className="mt-3 font-semibold text-red-300">{resetError}</p>}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
