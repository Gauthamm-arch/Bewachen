"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabaseClient";
import { withTimeout } from "@/lib/withTimeout";
import { buildReadUrl } from "@/lib/token";
import { createToken, revokeTokens } from "@/lib/api";
import { EmergencyService, getEmergencyNumber } from "@/lib/emergencyNumbers";
import SlideToConfirm from "./SlideToConfirm";
import EmergencySlider from "./EmergencySlider";
import SideMenu from "./SideMenu";
import MockDialer from "./MockDialer";
import { MenuIcon, QrIcon } from "./icons";

type Notice = { text: string; tone: "ok" | "error" } | null;

// True on short screens (small phones, or browsers with big toolbars) so everything still fits without scrolling.
function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-height: 720px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return compact;
}
const T = 15000;

function friendly(e: unknown, fallback: string): string {
  const msg = (e as { message?: string })?.message;
  return msg ? `${fallback} (${msg})` : fallback;
}

export default function Dashboard({ userId, countryCode }: { userId: string; countryCode: string | null }) {
  const [token, setToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [service, setService] = useState<EmergencyService | null>(null);
  const compact = useCompact();

  const numbers = useMemo(
    () => ({
      ambulance: getEmergencyNumber(countryCode, "ambulance"),
      police: getEmergencyNumber(countryCode, "police"),
      fire: getEmergencyNumber(countryCode, "fire"),
    }),
    [countryCode]
  );

  // Show the QR code again if one is already active.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("qr_tokens")
            .select("access_hash")
            .eq("user_id", userId)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          T,
          "Loading your QR code"
        );
        if (error) throw error;
        if (!cancelled) setToken(data?.access_hash ?? null);
      } catch (e) {
        if (!cancelled) setNotice({ text: friendly(e, "Could not load your QR code."), tone: "error" });
      } finally {
        if (!cancelled) setLoadingToken(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Messages fade away on their own.
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(id);
  }, [notice]);

  const generate = useCallback(async () => {
    setNotice(null);
    try {
      // The server creates the secure access code and switches off any older QR code.
      const hash = await withTimeout(createToken(), T, "Creating your QR code");
      setToken(hash);
      setNotice({ text: "Your QR code is ready.", tone: "ok" });
    } catch (e) {
      setNotice({ text: friendly(e, "Could not create a QR code. Please try again."), tone: "error" });
      throw e;
    }
  }, []);

  const revoke = useCallback(async () => {
    setNotice(null);
    try {
      await withTimeout(revokeTokens(), T, "Revoking access");
      setToken(null);
      setNotice({ text: "Access revoked. Old QR codes no longer work.", tone: "ok" });
    } catch (e) {
      setNotice({ text: friendly(e, "Could not revoke access. Please try again."), tone: "error" });
      throw e;
    }
  }, []);

  const resetProfile = useCallback(async () => {
    // 1. turn off and delete every QR code, 2. delete the profile (contacts go with it), 3. mark as not onboarded
    const steps = [
      supabase.from("qr_tokens").update({ is_active: false }).eq("user_id", userId),
      supabase.from("qr_tokens").delete().eq("user_id", userId),
      supabase.from("profiles").delete().eq("user_id", userId),
      supabase.from("users").update({ is_onboarded: false }).eq("user_id", userId),
    ];
    for (const step of steps) {
      const { error } = await withTimeout(step, T, "Resetting your profile");
      if (error) throw error;
    }
    window.location.assign("/onboarding");
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }, []);

  const closeDialer = useCallback(() => setService(null), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const qrUrl = token ? buildReadUrl(token) : null;
  const qrSize = compact ? "min(62vw, 25dvh)" : "min(62vw, 30dvh, 280px)";

  return (
    <main className={`mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 text-slate-100 ${compact ? "pb-3 pt-2" : "pb-6 pt-4"}`}>
      <header className="flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-[0.3em] text-slate-300">Bewachen</span>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-haspopup="dialog"
          className="flex h-12 items-center gap-2 rounded-full border-2 border-slate-600 px-4 text-base font-semibold focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-500"
        >
          <MenuIcon className="h-6 w-6" />
          Menu
        </button>
      </header>

      {/* TOP HALF: QR code */}
      <section aria-label="Emergency QR code" className={`flex flex-1 flex-col justify-center ${compact ? "gap-2 py-2" : "gap-3 py-4"}`}>
        <div className="mx-auto" style={{ width: qrSize, height: qrSize }}>
          {qrUrl ? (
            <div className="h-full w-full rounded-3xl bg-white p-3">
              <QRCodeSVG value={qrUrl} size={256} level="M" bgColor="#ffffff" fgColor="#000000" style={{ width: "100%", height: "100%" }} />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-600 px-4 text-center text-slate-400">
              <QrIcon className="h-12 w-12" />
              <p className="text-base">{loadingToken ? "Loading…" : "Your QR code will appear here"}</p>
            </div>
          )}
        </div>

        <p aria-live="polite" className={`min-h-[24px] text-center text-base font-semibold ${notice?.tone === "error" ? "text-red-400" : notice ? "text-green-400" : token ? "text-green-400" : "text-slate-400"}`}>
          {notice ? notice.text : token ? "QR code is active" : loadingToken ? "" : "No active QR code"}
        </p>

        <SlideToConfirm label="Slide to Generate QR" busyLabel="Creating…" size={compact ? "md" : "lg"} onComplete={generate} />
        <SlideToConfirm label="Slide to Revoke Access" busyLabel="Revoking…" variant="danger" size={compact ? "sm" : "md"} disabled={!token} onComplete={revoke} />
      </section>

      {/* BOTTOM HALF: emergency services */}
      <section aria-label="Emergency services" className={`rounded-3xl border border-slate-700 bg-bewachen-surface ${compact ? "p-3" : "p-4"}`}>
        <h2 className={`font-extrabold ${compact ? "mb-2 text-lg" : "text-xl"}`}>Emergency{compact && <span className="ml-2 text-base font-normal text-slate-400">· slide to call</span>}</h2>
        {!compact && <p className="mb-4 text-base text-slate-400">Slide to a service to call</p>}
        <EmergencySlider numbers={numbers} active={service} onSelect={setService} />
      </section>

      <SideMenu open={menuOpen} onClose={closeMenu} onReset={resetProfile} onSignOut={signOut} />

      <AnimatePresence>
        {service && <MockDialer key={service} service={service} countryCode={countryCode} onClose={closeDialer} />}
      </AnimatePresence>
    </main>
  );
}
