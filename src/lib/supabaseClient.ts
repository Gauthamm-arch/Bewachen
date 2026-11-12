import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Keep ONE client across hot reloads. Several clients in dev can fight over
// the browser's auth lock and make requests hang forever.
const g = globalThis as unknown as { __bewachenSupabase?: SupabaseClient };

export const supabase: SupabaseClient =
  g.__bewachenSupabase ??
  (g.__bewachenSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));