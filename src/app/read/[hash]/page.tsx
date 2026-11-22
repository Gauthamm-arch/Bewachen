"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SlideToConfirm from "@/components/SlideToConfirm";
import EmergencySlider from "@/components/EmergencySlider";
import { HelperData, readToken } from "@/lib/api";
import { withTimeout } from "@/lib/withTimeout";
import { EmergencyService, getCountryName, getEmergencyNumber } from "@/lib/emergencyNumbers";
import { isDialable, toTelHref } from "@/lib/phone";

type View =
  | { kind: "loading" }
  | { kind: "ready"; data: HelperData }
  | { kind: "inactive" }
  | { kind: "error"; message: string };

const callNumber = (raw: string) => { window.location.href = toTelHref(raw); };

function firstName(full: string): string {
  const first = full.trim().split(/\s+/)[0] ?? "";
  return first.length > 14 ? `${first.slice(0, 13)}…` : first;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border-2 border-slate-600 bg-bewachen-surface p-5">
      <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-300">{title}</h2>
      <div className="mt-3 break-words text-2xl leading-snug text-white">{children}</div>
    </section>
  );
}

const none = <span className="text-slate-400">None provided</span>;

// Read-only page that opens when someone scans a Bewachen QR code.
export default function HelperPage() {
  const params = useParams<{ hash: string }>();
  const hash = Array.isArray(params?.hash) ? params.hash[0] : params?.hash;

  const [view, setView] = useState<View>({ kind: "loading" });
  const [callingEmergency, setCallingEmergency] = useState<EmergencyService | null>(null);

  const load = useCallback(async () => {
    if (!hash) return;
    setView({ kind: "loading" });
    try {
      const data = await withTimeout(readToken(hash), 15000, "Loading");
      setView(data ? { kind: "ready", data } : { kind: "inactive" });
    } catch (e: any) {
      setView({ kind: "error", message: e?.message ?? "Something went wrong." });
    }
  }, [hash]);

  useEffect(() => { void load(); }, [load]);

  if (view.kind === "loading")
    return <main className="flex min-h-[100dvh] items-center justify-center text-2xl font-semibold text-slate-300">Loading…</main>;

  if (view.kind === "inactive")
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-6 px-6 text-white">
        <h1 className="text-4xl font-extrabold leading-tight">This QR code is not active</h1>
        <p className="text-2xl leading-snug text-slate-300">The owner may have switched it off, or the code is not valid.</p>
        <p className="rounded-3xl border-2 border-red-500/60 bg-red-950/40 p-5 text-2xl font-semibold leading-snug">
          If someone needs help right now, call your local emergency number. 112, 911 or 999 work in many countries.
        </p>
      </main>
    );

  if (view.kind === "error")
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-6 px-6 text-white">
        <h1 className="text-4xl font-extrabold leading-tight">Could not load</h1>
        <p role="alert" className="text-2xl leading-snug text-red-400">{view.message}</p>
        <button onClick={() => void load()} className="rounded-2xl bg-blue-600 py-4 text-2xl font-bold text-white">Try again</button>
        <p className="text-xl leading-snug text-slate-300">If someone needs help right now, call your local emergency number.</p>
      </main>
    );

  const { data } = view;
  const residence = data.country_of_residence;
  const numbers = {
    ambulance: getEmergencyNumber(residence, "ambulance"),
    police: getEmergencyNumber(residence, "police"),
    fire: getEmergencyNumber(residence, "fire"),
  };
  const lives = residence ? getCountryName(residence) : null;
  const from = data.country_of_origin ? getCountryName(data.country_of_origin) : null;

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md px-4 pb-12 text-white">
      <div className="-mx-4 bg-red-600 px-4 py-3 text-center text-sm font-extrabold uppercase tracking-[0.2em]">Emergency information</div>

      <header className="mt-6">
        <p className="text-xl text-slate-300">This person may need help</p>
        <h1 className="mt-1 break-words text-5xl font-extrabold leading-tight">{data.full_name?.trim() || "Name not provided"}</h1>
        {(lives || from) && (
          <p className="mt-3 text-xl text-slate-300">
            {lives && <>Lives in {lives}</>}
            {lives && from && " · "}
            {from && <>From {from}</>}
          </p>
        )}
      </header>

      <div className="mt-6 space-y-4">
        <Section title="Medical information">
          <span className="whitespace-pre-wrap">{data.medical_info?.trim() || none}</span>
        </Section>
        <Section title="Notes for responders">
          <span className="whitespace-pre-wrap">{data.custom_notes?.trim() || none}</span>
        </Section>
      </div>

      <h2 className="mb-3 mt-10 text-3xl font-extrabold">Call a contact</h2>
      <div className="space-y-4">
        {data.contacts.length === 0 && <p className="text-xl text-slate-300">No contacts were added.</p>}
        {data.contacts.map((c, i) => (
          <section key={i} className="rounded-3xl border-2 border-slate-600 bg-bewachen-surface p-5">
            <h3 className="break-words text-3xl font-extrabold">{c.name}</h3>
            {c.relationship && <p className="mt-1 text-xl text-slate-300">{c.relationship}</p>}
            <p className="mb-4 mt-2 text-2xl font-semibold tabular-nums text-slate-100">{c.phone_number}</p>
            <SlideToConfirm
              label={`Slide to Call ${firstName(c.name)}`}
              busyLabel="Calling…"
              disabled={!isDialable(c.phone_number)}
              onComplete={() => callNumber(c.phone_number)}
            />
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-3xl border border-slate-700 bg-bewachen-surface p-4">
        <h2 className="text-2xl font-extrabold">Call emergency services</h2>
        <p className="mb-4 mt-1 text-lg text-slate-300">{lives ? `Numbers for ${lives}` : "Slide to a service to call"}</p>
        <EmergencySlider
          numbers={numbers}
          active={callingEmergency}
          onSelect={(service) => {
            setCallingEmergency(service);
            callNumber(numbers[service]);
            setTimeout(() => setCallingEmergency(null), 1500);
          }}
        />
      </section>

      <p className="mt-10 text-center text-base text-slate-400">Read-only information shared through Bewachen.</p>
    </main>
  );
}
