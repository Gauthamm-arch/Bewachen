"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else if (!data.session)
        setInfo("Check your inbox and confirm your email, then sign in.");
      else router.replace("/");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.replace("/");
    }
    setLoading(false);
  }

  const field =
    "w-full rounded-lg border-2 bg-white px-4 py-3 text-lg focus:outline-none focus:ring-4";
  const validField = "border-[#22c55e] focus:ring-[#22c55e]/40";
  const invalidField = "border-[#101820] focus:ring-[#E5252A]/40";
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validPassword = password.length >= 6;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAF7] p-6 text-[#101820]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <header>
          <h1 className="text-4xl font-semibold tracking-wide">Bewachen</h1>
          <p className="mt-2 text-[#5B6770]">
            Always there when you need us.
          </p>
        </header>

        <label className="block">
          <span className="mb-1 block font-semibold">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${field} ${validEmail ? validField : invalidField}`}
          />
        </label>

        <label className="block">
          <span className="mb-1 block font-semibold">Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${field} ${validPassword ? validField : invalidField}`}
          />
        </label>

        {error && <p role="alert" className="font-semibold text-[#E5252A]">{error}</p>}
        {info && <p role="status" className="font-semibold">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#101820] py-3 text-lg font-bold text-white disabled:opacity-50"
        >
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-center font-semibold underline underline-offset-4"
        >
          {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
