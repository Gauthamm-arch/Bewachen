"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { withTimeout } from "@/lib/withTimeout";

// Reads country_of_residence from the signed-in user's profile.
export function useUserCountry() {
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 15000, "Checking login");
        if (!session) throw new Error("You are not signed in.");

        const { data, error: qErr } = await withTimeout(
          supabase.from("profiles").select("country_of_residence").eq("user_id", session.user.id).maybeSingle(),
          15000,
          "Loading your profile"
        );
        if (qErr) throw qErr;
        if (!cancelled) setCountryCode(data?.country_of_residence ?? null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Could not load your country.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { countryCode, loading, error };
}
