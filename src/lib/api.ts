import { supabase } from "./supabaseClient";

// Address of the FastAPI backend. Set NEXT_PUBLIC_API_URL when you deploy it.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request(path: string, init: RequestInit = {}, signedIn = false): Promise<Response> {
  const headers = new Headers(init.headers);
  if (signedIn) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new ApiError(401, "You are signed out. Please sign in again.");
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(0, "Could not reach the Bewachen server. Check your connection and that the backend is running.");
  }

  if (!res.ok) {
    let detail: unknown = "";
    try { detail = (await res.json()).detail; } catch { /* no JSON body */ }
    throw new ApiError(res.status, typeof detail === "string" && detail ? detail : `Request failed (${res.status}).`);
  }
  return res;
}

/** Creates a new QR access hash (older ones are switched off by the server). */
export async function createToken(): Promise<string> {
  const res = await request("/api/tokens", { method: "POST" }, true);
  return (await res.json()).access_hash as string;
}

/** The Killswitch: switches off every active QR code. */
export async function revokeTokens(): Promise<void> {
  await request("/api/tokens", { method: "DELETE" }, true);
}

export type HelperContact = { name: string; phone_number: string; relationship: string | null };

export type HelperData = {
  full_name: string | null;
  country_of_origin: string | null;
  country_of_residence: string | null;
  medical_info: string | null;
  custom_notes: string | null;
  contacts: HelperContact[];
};

/** Reads what a scanned QR code shows. Returns null when the code is not active (revoked, unknown or invalid). */
export async function readToken(hash: string): Promise<HelperData | null> {
  try {
    const res = await request(`/api/read/${encodeURIComponent(hash)}`);
    return (await res.json()) as HelperData;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
