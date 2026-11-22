"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabaseClient";
import { withTimeout } from "@/lib/withTimeout";
import { buildReadUrl } from "@/lib/token";
import { createToken, revokeTokens } from "@/lib/api";
import { EmergencyService, getEmergencyNumber } from "@/lib/emergencyNumbers";
import { toTelHref } from "@/lib/phone";
import SlideToConfirm from "./SlideToConfirm";
import EmergencySlider from "./EmergencySlider";
import SideMenu from "./SideMenu";
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
        if (!cancelled) setNotice({ text: "Something went wrong. Please try again.", tone: "error" });
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
      setNotice({ text: "Something went wrong. Please try again.", tone: "error" });
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
      setNotice({ text: "Something went wrong. Please try again.", tone: "error" });
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

  // Hands the number to the phone's dialer. `service` stays set for a moment so the slider can't be triggered twice.
  const callService = useCallback(
    (s: EmergencyService) => {
      setService(s);
      window.location.href = toTelHref(numbers[s]);
      setTimeout(() => setService(null), 1500);
    },
    [numbers]
  );
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const qrUrl = token ? buildReadUrl(token) : null;
  const qrSize = compact ? "min(50vw, 22dvh, 200px)" : "min(58vw, 42dvh, 340px)";

  return (
    <div className="flex min-h-[100dvh] w-full flex-col text-slate-100">
      {/* HEADER: Full width with Bewachen on leftmost and Menu on rightmost */}
      <header className="flex w-full items-center justify-between px-4 py-2 sm:px-6 md:px-8">
        <span className="text-xl font-extrabold uppercase tracking-normal text-white">Bewachen</span>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-haspopup="dialog"
          className="flex h-11 items-center gap-2 rounded-full border-2 border-slate-600 px-4 text-sm font-semibold transition-colors hover:border-slate-500 hover:text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-500"
        >
          <MenuIcon className="h-5 w-5 text-slate-300" />
          Menu
        </button>
      </header>

      {/* MAIN CONTENT CONTAINER: column on portrait, row on landscape */}
      <main
        className={`flex w-full flex-1 flex-col landscape:flex-row landscape:items-stretch landscape:justify-between px-4 sm:px-6 md:px-8 landscape:px-12 ${
          compact ? "gap-2 pb-2 pt-0" : "gap-3 pb-3 pt-1"
        } landscape:gap-12 lg:landscape:gap-20 landscape:pt-2 landscape:pb-6`}
      >
        {/* EMERGENCY QR CODE (Left on landscape, Bottom on portrait) */}
        <section
          aria-label="Emergency QR code"
          className={`flex flex-1 flex-col justify-between order-3 landscape:order-1 landscape:w-[48%] landscape:max-w-xl ${
            compact ? "gap-2" : "gap-3"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <QrIcon className="h-6 w-6 text-slate-300" />
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Emergency QR Code</h2>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                token ? "text-emerald-400" : "text-slate-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  token ? "bg-emerald-400" : "bg-slate-500"
                }`}
              />
              {token ? "Active" : "Inactive"}
            </span>
          </div>

          {/* QR Code Container centered vertically in the available space */}
          <div className="flex flex-1 flex-col items-center justify-center my-auto py-2">
            <div style={{ width: qrSize, height: qrSize }}>
              {qrUrl ? (
                <div className="h-full w-full rounded-2xl bg-white p-3 shadow-md">
                  <QRCodeSVG
                    value={qrUrl}
                    size={340}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-600/80 bg-slate-900/30 px-3 text-center text-slate-400">
                  <QrIcon className="h-10 w-10 text-slate-500" />
                  <p className="text-xs font-medium">
                    {loadingToken ? "Loading…" : "Your QR code will appear here"}
                  </p>
                </div>
              )}
            </div>

            {/* Error / Notice Text */}
            {notice && (
              <p
                aria-live="polite"
                className={`mt-3 min-h-[20px] text-center text-xs sm:text-sm font-semibold transition-colors ${
                  notice.tone === "error" ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {notice.text}
              </p>
            )}
          </div>

          {/* Action Sliders docked at the very bottom */}
          <div className="mt-auto pt-2 flex flex-col gap-3">
            <SlideToConfirm
              label={token ? "Slide to Regenerate QR" : "Slide to Generate QR"}
              busyLabel="Creating…"
              size={compact ? "md" : "lg"}
              onComplete={generate}
            />
            <SlideToConfirm
              label="Slide to Revoke Access"
              busyLabel="Revoking…"
              variant="danger"
              size={compact ? "md" : "lg"}
              disabled={!token}
              onComplete={revoke}
            />
          </div>
        </section>

        {/* Divider line between QR Code and Emergency Slider */}
        <div
          className="order-2 landscape:order-2 hidden landscape:block w-[1.5px] self-stretch bg-slate-700/80 my-2"
          aria-hidden="true"
        />
        <div
          className="order-2 landscape:order-2 block landscape:hidden h-[1.5px] w-full bg-slate-700/80 my-4"
          aria-hidden="true"
        />

        {/* EMERGENCY SERVICES SLIDER (Right on landscape, Top on portrait) */}
        <section
          aria-label="Emergency services"
          className="order-1 landscape:order-3 landscape:w-[48%] landscape:max-w-xl flex flex-col justify-between"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Emergency</h2>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Slide to call
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center my-auto w-full py-2">
            <EmergencySlider numbers={numbers} active={service} onSelect={callService} />
          </div>
        </section>
      </main>

      <SideMenu open={menuOpen} onClose={closeMenu} onReset={resetProfile} onSignOut={signOut} />

    </div>
  );
}
