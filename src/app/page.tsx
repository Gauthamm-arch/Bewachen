"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { withTimeout } from "@/lib/withTimeout";
import Dashboard from "@/components/Dashboard";

// Gate: not signed in -> /login, not onboarded -> /onboarding, otherwise the dashboard.
export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<{ userId: string; countryCode: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 15000, "Checking login");
        if (!session) return router.replace("/login");

        const { data: row, error: uErr } = await withTimeout(
          supabase.from("users").select("is_onboarded").eq("user_id", session.user.id).maybeSingle(),
          15000,
          "Loading your account"
        );
        if (uErr) throw uErr;
        if (!row?.is_onboarded) return router.replace("/onboarding");

        const { data: profile, error: pErr } = await withTimeout(
          supabase.from("profiles").select("country_of_residence").eq("user_id", session.user.id).maybeSingle(),
          15000,
          "Loading your profile"
        );
        if (pErr) throw pErr;

        if (!cancelled) setState({ userId: session.user.id, countryCode: profile?.country_of_residence ?? null });
      } catch (err: any) {
        console.error("Gate failed:", err);
        if (!cancelled) setError(err?.message ?? "Something went wrong.");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (error)
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-slate-100">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-extrabold">Something went wrong</h1>
          <p role="alert" className="mt-3 font-semibold text-red-400">{error}</p>
          <div className="mt-6 flex justify-center gap-8 text-lg">
            <button onClick={() => window.location.reload()} className="underline underline-offset-4">Try again</button>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.assign("/login"); }} className="underline underline-offset-4">Sign out</button>
          </div>
        </div>
      </main>
    );

  if (!state)
    return <main className="flex min-h-screen items-center justify-center text-lg text-slate-400">Loading…</main>;

  return <Dashboard userId={state.userId} countryCode={state.countryCode} />;
}
