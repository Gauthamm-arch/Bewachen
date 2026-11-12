"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { COUNTRIES } from "@/lib/countries";
import { withTimeout } from "@/lib/withTimeout";

type Contact = { name: string; phone_number: string; relationship: string };
const emptyContact = (): Contact => ({ name: "", phone_number: "", relationship: "" });

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [origin, setOrigin] = useState("");
  const [residence, setResidence] = useState("");
  const [medical, setMedical] = useState("");
  const [notes, setNotes] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([emptyContact()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Guard: must be signed in; skip if already onboarded.
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 15000, "Checking login");
        if (!session) return router.replace("/login");
        const { data: row } = await withTimeout(
          supabase.from("users").select("is_onboarded").eq("user_id", session.user.id).maybeSingle(),
          15000,
          "Loading your account"
        );
        if (row?.is_onboarded) return router.replace("/");
        setEmail(session.user.email ?? "");
        setUserId(session.user.id);
      } catch (err: any) {
        console.error("Onboarding guard failed:", err);
        setError(err?.message ?? "Could not load. Refresh the page.");
        setUserId("");
      }
    })();
  }, [router]);

  function updateContact(i: number, patch: Partial<Contact>) {
    setContacts((c) => c.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError(null);
    setSaving(true);

    try {
      // 1. Profile (upsert so a retry after a partial failure is safe)
      const { data: profile, error: pErr } = await withTimeout(
        supabase
          .from("profiles")
          .upsert(
            {
              user_id: userId,
              full_name: fullName,
              country_of_origin: origin,
              country_of_residence: residence,
              medical_info: medical,
              custom_notes: notes,
            },
            { onConflict: "user_id" }
          )
          .select("profile_id")
          .single(),
        15000,
        "Saving profile"
      );
      if (pErr) throw pErr;

      // 2. Contacts (clear then insert, so retries don't duplicate)
      const { error: dErr } = await withTimeout(
        supabase.from("contacts").delete().eq("profile_id", profile.profile_id),
        15000,
        "Clearing old contacts"
      );
      if (dErr) throw dErr;

      const valid = contacts.filter((c) => c.name.trim() && c.phone_number.trim());
      const { error: cErr } = await withTimeout(
        supabase.from("contacts").insert(valid.map((c) => ({ ...c, profile_id: profile.profile_id }))),
        15000,
        "Saving contacts"
      );
      if (cErr) throw cErr;

      // 3. Flip the flag last (upsert also repairs a missing users row)
      const { error: uErr } = await withTimeout(
        supabase.from("users").upsert({ user_id: userId, email, is_onboarded: true }, { onConflict: "user_id" }),
        15000,
        "Finishing setup"
      );
      if (uErr) throw uErr;

      // Full page load: avoids a stalled client-side navigation.
      window.location.assign("/");
    } catch (err: any) {
      console.error("Onboarding save failed:", err);
      setError(err?.message ?? "Something went wrong. Try again.");
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-lg border-2 border-[#101820] bg-white px-4 py-3 text-lg focus:outline-none focus:ring-4 focus:ring-[#E5252A]/40";
  const label = "mb-1 block font-semibold";

  if (userId === null)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAF7] p-6 text-[#5B6770]">
        <p role="status">Preparing your emergency profile…</p>
      </main>
    );
  if (userId === "")
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAF7] p-6">
        <p role="alert" className="max-w-md text-center font-semibold text-[#E5252A]">{error}</p>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#FAFAF7] p-6 text-[#101820]">
      <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-8 pb-16">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight">Set up your emergency profile</h1>
          <p className="mt-2 text-[#5B6770]">
            You only do this once. Responders see this when you share your QR code.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">About you</h2>
          <label className="block">
            <span className={label}>Full name</span>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className={label}>Country of origin</span>
            <select required value={origin} onChange={(e) => setOrigin(e.target.value)} className={field}>
              <option value="" disabled>Choose a country</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={label}>Country you live in now</span>
            <select required value={residence} onChange={(e) => setResidence(e.target.value)} className={field}>
              <option value="" disabled>Choose a country</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <span className="mt-1 block text-sm text-[#5B6770]">
              We use this to dial the right local emergency numbers.
            </span>
          </label>
          <label className="block">
            <span className={label}>Medical information</span>
            <textarea rows={3} value={medical} onChange={(e) => setMedical(e.target.value)}
              placeholder="Blood type, allergies, conditions, medications" className={field} />
          </label>
          <label className="block">
            <span className={label}>Notes for responders</span>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Languages you speak, anything else they should know" className={field} />
          </label>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Emergency contacts</h2>
          {contacts.map((c, i) => (
            <fieldset key={i} className="space-y-3 rounded-lg border-2 border-[#D9DCDD] p-4">
              <legend className="px-1 font-semibold">Contact {i + 1}</legend>
              <input required={i === 0} placeholder="Name" value={c.name}
                onChange={(e) => updateContact(i, { name: e.target.value })} className={field} />
              <input required={i === 0} type="tel" placeholder="Phone, with country code (+971…)"
                value={c.phone_number} onChange={(e) => updateContact(i, { phone_number: e.target.value })} className={field} />
              <input placeholder="Relationship (spouse, friend, colleague)" value={c.relationship}
                onChange={(e) => updateContact(i, { relationship: e.target.value })} className={field} />
              {i > 0 && (
                <button type="button" onClick={() => setContacts(contacts.filter((_, x) => x !== i))}
                  className="font-semibold text-[#E5252A] underline underline-offset-4">
                  Remove contact
                </button>
              )}
            </fieldset>
          ))}
          {contacts.length < 5 && (
            <button type="button" onClick={() => setContacts([...contacts, emptyContact()])}
              className="font-semibold underline underline-offset-4">
              Add another contact
            </button>
          )}
        </section>

        {error && <p role="alert" className="font-semibold text-[#E5252A]">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full rounded-lg bg-[#E5252A] py-4 text-lg font-bold text-white disabled:opacity-50">
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
