"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { withTimeout } from "@/lib/withTimeout";
import { COUNTRIES } from "@/lib/countries";

type Contact = { name: string; phone_number: string; relationship: string };
const emptyContact = (): Contact => ({ name: "", phone_number: "", relationship: "" });
const T = 15000;

const field =
  "w-full rounded-xl border-2 border-slate-600 bg-bewachen-surface px-4 py-3.5 text-lg text-slate-100 placeholder:text-slate-500 [color-scheme:dark] focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30";
const label = "mb-1.5 block text-base font-semibold text-slate-200";

// Used for first-time setup (mode="onboarding") and for changes later (mode="edit").
export default function ProfileForm({ mode }: { mode: "onboarding" | "edit" }) {
  const router = useRouter();
  const editing = mode === "edit";

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [origin, setOrigin] = useState("");
  const [residence, setResidence] = useState("");
  const [medical, setMedical] = useState("");
  const [notes, setNotes] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([emptyContact()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), T, "Checking login");
        if (!session) return router.replace("/login");

        const { data: row, error: uErr } = await withTimeout(
          supabase.from("users").select("is_onboarded").eq("user_id", session.user.id).maybeSingle(),
          T,
          "Loading your account"
        );
        if (uErr) throw uErr;
        const onboarded = !!row?.is_onboarded;
        if (!editing && onboarded) return router.replace("/");
        if (editing && !onboarded) return router.replace("/onboarding");

        if (editing) {
          const { data: p, error: pErr } = await withTimeout(
            supabase
              .from("profiles")
              .select("profile_id, full_name, country_of_origin, country_of_residence, medical_info, custom_notes")
              .eq("user_id", session.user.id)
              .maybeSingle(),
            T,
            "Loading your profile"
          );
          if (pErr) throw pErr;
          if (p && !cancelled) {
            setFullName(p.full_name ?? "");
            setOrigin(p.country_of_origin ?? "");
            setResidence(p.country_of_residence ?? "");
            setMedical(p.medical_info ?? "");
            setNotes(p.custom_notes ?? "");
            const { data: cs, error: cErr } = await withTimeout(
              supabase.from("contacts").select("name, phone_number, relationship").eq("profile_id", p.profile_id),
              T,
              "Loading your contacts"
            );
            if (cErr) throw cErr;
            if (cs && cs.length)
              setContacts(cs.map((c) => ({ name: c.name ?? "", phone_number: c.phone_number ?? "", relationship: c.relationship ?? "" })));
          }
        }

        if (cancelled) return;
        setEmail(session.user.email ?? "");
        setUserId(session.user.id);
        setReady(true);
      } catch (err: any) {
        console.error("Profile form failed to load:", err);
        if (!cancelled) setLoadError(err?.message ?? "Could not load. Refresh the page.");
      }
    })();
    return () => { cancelled = true; };
  }, [router, editing]);

  function updateContact(i: number, patch: Partial<Contact>) {
    setContacts((c) => c.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const valid = contacts
      .map((c) => ({ name: c.name.trim(), phone_number: c.phone_number.trim(), relationship: c.relationship.trim() }))
      .filter((c) => c.name && c.phone_number);
    if (valid.length === 0) {
      setError("Please add at least one emergency contact with a name and phone number.");
      return;
    }

    setSaving(true);
    try {
      const { data: profile, error: pErr } = await withTimeout(
        supabase
          .from("profiles")
          .upsert(
            { user_id: userId, full_name: fullName.trim(), country_of_origin: origin, country_of_residence: residence, medical_info: medical, custom_notes: notes },
            { onConflict: "user_id" }
          )
          .select("profile_id")
          .single(),
        T,
        "Saving profile"
      );
      if (pErr) throw pErr;

      // Add the new contacts first, then remove the old ones, so a failure never leaves you with none.
      const { data: oldRows, error: oErr } = await withTimeout(
        supabase.from("contacts").select("contact_id").eq("profile_id", profile.profile_id),
        T,
        "Reading contacts"
      );
      if (oErr) throw oErr;

      const { error: cErr } = await withTimeout(
        supabase.from("contacts").insert(valid.map((c) => ({ ...c, profile_id: profile.profile_id }))),
        T,
        "Saving contacts"
      );
      if (cErr) throw cErr;

      const oldIds = (oldRows ?? []).map((r) => r.contact_id);
      if (oldIds.length) {
        const { error: dErr } = await withTimeout(supabase.from("contacts").delete().in("contact_id", oldIds), T, "Removing old contacts");
        if (dErr) throw dErr;
      }

      const { error: uErr } = await withTimeout(
        supabase.from("users").upsert({ user_id: userId, email, is_onboarded: true }, { onConflict: "user_id" }),
        T,
        "Finishing setup"
      );
      if (uErr) throw uErr;

      window.location.assign("/");
    } catch (err: any) {
      console.error("Saving profile failed:", err);
      setError(err?.message ?? "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  if (loadError)
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p role="alert" className="max-w-md text-center font-semibold text-red-400">{loadError}</p>
      </main>
    );
  if (!ready) return <main className="flex min-h-screen items-center justify-center text-lg text-slate-400">Loading…</main>;

  return (
    <main className="min-h-screen px-5 py-8 text-slate-100">
      <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-8 pb-12">
        <header>
          {editing && (
            <Link href="/" className="mb-4 inline-block text-base font-semibold text-slate-300 underline underline-offset-4">
              ← Back
            </Link>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight">{editing ? "Edit your profile" : "Set up your emergency profile"}</h1>
          <p className="mt-2 text-lg text-slate-400">
            {editing ? "Changes apply to your QR code straight away." : "You only do this once. Responders see this when you share your QR code."}
          </p>
        </header>

        <section className="space-y-5">
          <h2 className="text-xl font-bold">About you</h2>
          <label className="block">
            <span className={label}>Full name</span>
            <input required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} />
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
            <span className="mt-1.5 block text-base text-slate-400">We use this to show the right local emergency numbers.</span>
          </label>
          <label className="block">
            <span className={label}>Medical information</span>
            <textarea rows={3} value={medical} onChange={(e) => setMedical(e.target.value)} placeholder="Blood type, allergies, conditions, medications" className={field} />
          </label>
          <label className="block">
            <span className={label}>Notes for responders</span>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Languages you speak, anything else they should know" className={field} />
          </label>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Emergency contacts</h2>
          {contacts.map((c, i) => (
            <fieldset key={i} className="space-y-3 rounded-2xl border-2 border-slate-700 p-4">
              <legend className="px-2 text-base font-semibold text-slate-200">Contact {i + 1}</legend>
              <input required={i === 0} aria-label={`Contact ${i + 1} name`} placeholder="Name" value={c.name} onChange={(e) => updateContact(i, { name: e.target.value })} className={field} />
              <input required={i === 0} type="tel" aria-label={`Contact ${i + 1} phone`} placeholder="Phone, with country code (+971…)" value={c.phone_number} onChange={(e) => updateContact(i, { phone_number: e.target.value })} className={field} />
              <input aria-label={`Contact ${i + 1} relationship`} placeholder="Relationship (spouse, friend, colleague)" value={c.relationship} onChange={(e) => updateContact(i, { relationship: e.target.value })} className={field} />
              {i > 0 && (
                <button type="button" onClick={() => setContacts(contacts.filter((_, x) => x !== i))} className="text-base font-semibold text-red-400 underline underline-offset-4">
                  Remove contact
                </button>
              )}
            </fieldset>
          ))}
          {contacts.length < 5 && (
            <button type="button" onClick={() => setContacts([...contacts, emptyContact()])} className="text-lg font-semibold text-blue-400 underline underline-offset-4">
              + Add another contact
            </button>
          )}
        </section>

        {error && <p role="alert" className="text-lg font-semibold text-red-400">{error}</p>}

        <button type="submit" disabled={saving} className="w-full rounded-2xl bg-blue-600 py-4 text-xl font-bold text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50">
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
