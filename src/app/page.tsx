"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { withTimeout } from "@/lib/withTimeout";

// Auth gate: not signed in -> /login, not onboarded -> /onboarding, else dashboard.
export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 15000, "Checking login");
        if (!session) return router.replace("/login");

        const { data: row, error: qErr } = await withTimeout(
          supabase.from("users").select("is_onboarded").eq("user_id", session.user.id).maybeSingle(),
          15000,
          "Loading your account"
        );
        if (qErr) throw qErr;

        if (!row?.is_onboarded) return router.replace("/onboarding");
        setReady(true);
      } catch (err: any) {
        console.error("Gate failed:", err);
        setError(err?.message ?? "Something went wrong.");
      }
    })();
  }, [router]);

  if (error)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAF7] p-6 text-[#101820]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-extrabold">Something went wrong</h1>
          <p role="alert" className="mt-3 font-semibold text-[#E5252A]">{error}</p>
          <div className="mt-6 space-x-6">
            <button onClick={() => window.location.reload()} className="underline underline-offset-4">Try again</button>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.assign("/login"); }}
              className="underline underline-offset-4"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );

  if (!ready)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAF7] text-[#5B6770]">
        Loading…
      </main>
    );

  // Step 4 replaces this placeholder with the slider dashboard.
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAF7] p-6 text-[#101820]">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">You&apos;re set up.</h1>
        <p className="mt-2 text-[#5B6770]">The slider dashboard arrives in Step 4.</p>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); }}
          className="mt-6 underline underline-offset-4"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}