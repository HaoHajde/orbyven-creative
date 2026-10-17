"use client";

import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Organization = { id: string; name: string; legal_name: string | null };
type PrivacyCase = {
  id: string;
  organization_id: string | null;
  subject_reference: string;
  request_type: string;
  processing_role: string;
  status: string;
  received_at: string;
  due_at: string;
  last_action: string | null;
};
type Contract = { id: string; evidence_status: string; recorded_at: string };
type ExitCase = { id: string; status: string; requested_at: string };
type Payload = {
  organizations: Organization[];
  privacyCases: PrivacyCase[];
  contracts: Contract[];
  checkouts: unknown[];
  subscriptions: unknown[];
  orderEvidence: unknown[];
  exitCases: ExitCase[];
  offboardingConfigured: boolean;
};

const EMPTY: Payload = {
  organizations: [],
  privacyCases: [],
  contracts: [],
  checkouts: [],
  subscriptions: [],
  orderEvidence: [],
  exitCases: [],
  offboardingConfigured: false,
};

const REQUEST_TYPES = ["access", "rectification", "erasure", "portability", "restriction", "objection", "other"];

function Dot({ tone = "good" }: { tone?: "good" | "warn" | "bad" }) {
  return <span className={`h-2 w-2 rounded-full ${tone === "good" ? "bg-emerald-400" : tone === "warn" ? "bg-amber-300" : "bg-rose-400"}`} />;
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-[20px] border border-white/[0.07] bg-[#0d0e12] p-4"><div className="text-[9px] font-bold tracking-[0.14em] text-[#66666f]">{label}</div><div className="mt-5 text-3xl font-semibold tracking-[-0.06em]">{value}</div></div>;
}

function caseTone(item: PrivacyCase): "good" | "warn" | "bad" {
  if (item.status === "closed") return "good";
  const due = new Date(item.due_at).getTime();
  const days = Math.ceil((due - Date.now()) / 86400000);
  if (days <= 3) return "bad";
  if (days <= 10) return "warn";
  return "good";
}

export default function ControlCenterLegalCompact() {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState("");
  const [payload, setPayload] = useState<Payload>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newCase, setNewCase] = useState(false);
  const [subjectReference, setSubjectReference] = useState("");
  const [requestType, setRequestType] = useState("access");

  const authHeaders = useCallback(async () => {
    const { data } = await orbyvenSupabase.auth.getSession();
    if (!data.session) {
      router.replace("/control-center/login");
      throw new Error("missing_session");
    }
    return { Authorization: `Bearer ${data.session.access_token}` };
  }, [router]);

  const load = useCallback(async (id: string) => {
    setError("");
    try {
      const response = await fetch(`/api/control-center/compliance${id ? `?organizationId=${encodeURIComponent(id)}` : ""}`, {
        headers: await authHeaders(),
        cache: "no-store",
      });
      if (response.status === 401) {
        router.replace("/control-center/login");
        return;
      }
      const data = (await response.json().catch(() => ({}))) as Payload & { error?: string; message?: string };
      if (!response.ok) throw new Error(data.message ?? data.error ?? "Legal unavailable");
      setPayload(data);
    } catch (reason) {
      if (reason instanceof Error && reason.message === "missing_session") return;
      setError(reason instanceof Error ? reason.message : "Legal unavailable");
    }
  }, [authHeaders, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(organizationId), 0);
    return () => window.clearTimeout(timer);
  }, [load, organizationId]);

  const createCase = async () => {
    if (!subjectReference.trim()) return;
    setBusy(true);
    setError("");
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/control-center/compliance", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_privacy_case",
          organizationId: organizationId || null,
          subjectReference: subjectReference.trim(),
          requestType,
          processingRole: "undetermined",
          channel: "email",
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.message ?? result.error ?? "Action failed");
      setSubjectReference("");
      setNewCase(false);
      setNotice("Created");
      await load(organizationId);
      window.setTimeout(() => setNotice(""), 1800);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const openCases = payload.privacyCases.filter((item) => item.status !== "closed");
  const urgent = openCases.filter((item) => caseTone(item) === "bad").length;
  const verifiedContracts = payload.contracts.filter((item) => item.evidence_status === "verified").length;
  const selectedName = useMemo(
    () => payload.organizations.find((item) => item.id === organizationId)?.name ?? "ALL",
    [organizationId, payload.organizations]
  );

  return (
    <main className="min-h-screen bg-[#07080b] text-white antialiased">
      <div className="mx-auto max-w-[1380px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
          <Link href="/control-center" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-indigo-400/25 bg-indigo-400/[0.08] text-indigo-200">§</span><span><strong className="block text-[12px] tracking-[0.22em]">LEGAL</strong><span className="mt-1 block text-[8px] font-bold tracking-[0.28em] text-indigo-300">CONTROL</span></span></Link>
          <div className="flex items-center gap-2"><Link href="/control-center/legal/advanced" className="rounded-full border border-white/[0.08] px-3 py-2 text-[9px] font-bold tracking-[0.1em] text-[#8a8a92]">ADVANCED</Link><button type="button" onClick={() => void load(organizationId)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-black" aria-label="Refresh">↻</button></div>
        </header>

        {error ? <div className="mt-4 rounded-[16px] border border-rose-400/20 bg-rose-400/[0.05] px-4 py-3 text-xs text-rose-200">{error}</div> : null}
        {notice ? <div className="fixed right-5 top-5 z-50 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black shadow-2xl">{notice}</div> : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className="h-10 rounded-full border border-white/[0.08] bg-[#0d0e12] px-4 text-[10px] font-bold outline-none"><option value="">ALL</option>{payload.organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <button type="button" onClick={() => setNewCase((value) => !value)} className="h-10 rounded-full bg-white px-4 text-[9px] font-bold text-black">{newCase ? "CLOSE" : "+ CASE"}</button>
        </div>

        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metric label="OPEN" value={openCases.length} />
          <Metric label="URGENT" value={urgent} />
          <Metric label="CONTRACTS" value={payload.contracts.length} />
          <Metric label="VERIFIED" value={verifiedContracts} />
          <Metric label="EXIT" value={payload.exitCases.length} />
        </section>

        {newCase ? <section className="mt-4 rounded-[24px] border border-indigo-300/15 bg-indigo-400/[0.04] p-4"><div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]"><input value={subjectReference} onChange={(event) => setSubjectReference(event.target.value)} placeholder="SUBJECT REF" className="h-10 rounded-full border border-white/[0.08] bg-black px-4 text-xs outline-none"/><select value={requestType} onChange={(event) => setRequestType(event.target.value)} className="h-10 rounded-full border border-white/[0.08] bg-black px-4 text-[10px] outline-none">{REQUEST_TYPES.map((item) => <option key={item}>{item}</option>)}</select><button type="button" disabled={busy || !subjectReference.trim()} onClick={() => void createCase()} className="h-10 rounded-full bg-indigo-200 px-5 text-[9px] font-bold text-[#111118] disabled:opacity-30">CREATE</button></div></section> : null}

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_310px]">
          <div className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5"><div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[0.14em] text-[#66666f]">PRIVACY · {selectedName}</span><span className="text-[9px] text-[#55555d]">{payload.privacyCases.length}</span></div><div className="mt-4 divide-y divide-white/[0.06] overflow-hidden rounded-[18px] border border-white/[0.06]">{payload.privacyCases.slice(0, 12).map((item) => <Link key={item.id} href="/control-center/legal/advanced" className="flex items-center gap-3 px-4 py-3"><Dot tone={caseTone(item)}/><div className="min-w-0 flex-1"><div className="truncate text-xs font-medium">{item.subject_reference}</div><div className="mt-1 text-[8px] font-bold tracking-[0.1em] text-[#5d5d65]">{item.request_type.toUpperCase()} · {item.status.toUpperCase()}</div></div><span className="text-[9px] text-[#55555d]">›</span></Link>)}{!payload.privacyCases.length ? <div className="p-8 text-center text-[9px] font-bold tracking-[0.12em] text-[#55555d]">NO CASES</div> : null}</div></div>
          <aside className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5"><div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[0.14em] text-[#66666f]">EVIDENCE</span><Dot tone={payload.offboardingConfigured ? "good" : "warn"}/></div><div className="mt-6 space-y-3"><div className="flex items-center justify-between text-xs"><span className="text-[#777780]">CHECKOUT</span><strong>{payload.checkouts.length}</strong></div><div className="flex items-center justify-between text-xs"><span className="text-[#777780]">ORDERS</span><strong>{payload.orderEvidence.length}</strong></div><div className="flex items-center justify-between text-xs"><span className="text-[#777780]">SUBSCRIPTIONS</span><strong>{payload.subscriptions.length}</strong></div><div className="flex items-center justify-between text-xs"><span className="text-[#777780]">OFFBOARDING</span><strong>{payload.offboardingConfigured ? "ON" : "—"}</strong></div></div><Link href="/control-center/legal/advanced" className="mt-6 block rounded-full border border-white/[0.08] px-4 py-2.5 text-center text-[9px] font-bold tracking-[0.1em] text-[#8a8a92]">OPEN DOSSIER</Link></aside>
        </section>
      </div>
    </main>
  );
}
