"use client";

import BrandLogo from "@/components/BrandLogo";
import type {
  IntegrityAction,
  IntegrityCategory,
  IntegrityFinding,
  IntegrityPayload,
  IntegrityRun,
} from "@/lib/orbyven-integrity-contracts";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Filter = "all" | IntegrityCategory;
type QueueFilter = "all" | "manual" | "guardian";

type IconName = "shield" | "code" | "search" | "scale" | "spark" | "user" | "clock" | "download" | "chevron" | "refresh";

const CATEGORY_META: Record<IntegrityCategory, { label: string; icon: IconName }> = {
  code: { label: "Cod", icon: "code" },
  security: { label: "Security", icon: "shield" },
  seo: { label: "SEO", icon: "search" },
  legal: { label: "Legal", icon: "scale" },
};

const CATEGORY_ORDER: IntegrityCategory[] = ["code", "security", "seo", "legal"];

function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "shield") return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path {...common} d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z"/><path {...common} d="m9.5 12 1.7 1.7 3.6-4"/></svg>;
  if (name === "code") return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path {...common} d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"/></svg>;
  if (name === "search") return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><circle {...common} cx="11" cy="11" r="6"/><path {...common} d="m16 16 4 4"/></svg>;
  if (name === "scale") return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path {...common} d="M12 3v17M7 20h10M5 7h14M7 7l-3 5h6L7 7Zm10 0-3 5h6l-3-5Z"/></svg>;
  if (name === "spark") return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path {...common} d="m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3ZM18.5 15l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"/></svg>;
  if (name === "user") return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><circle {...common} cx="12" cy="8" r="3"/><path {...common} d="M6 20c.7-4 2.7-6 6-6s5.3 2 6 6"/></svg>;
  if (name === "clock") return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><circle {...common} cx="12" cy="12" r="8"/><path {...common} d="M12 7v5l3 2"/></svg>;
  if (name === "download") return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path {...common} d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14"/></svg>;
  if (name === "chevron") return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path {...common} d="m8 10 4 4 4-4"/></svg>;
  if (name === "refresh") return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path {...common} d="M20 7v5h-5M4 17v-5h5M6.1 8.2A7 7 0 0 1 18.5 7M5.5 17A7 7 0 0 0 17.9 15.8"/></svg>;
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path {...common} d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>;
}

function formatDate(value: string | null | undefined, compact = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ro-RO", compact ? {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest",
  } : {
    dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest",
  }).format(date);
}

function scoreTone(score: number | null | undefined) {
  if (score == null) return "text-[#77777d]";
  if (score >= 90) return "text-emerald-300";
  if (score >= 70) return "text-amber-300";
  return "text-rose-300";
}

function severityDot(severity: IntegrityFinding["severity"]) {
  if (severity === "critical" || severity === "high") return "bg-rose-400 shadow-[0_0_14px_rgba(251,113,133,.38)]";
  if (severity === "medium") return "bg-amber-300";
  return "bg-sky-300";
}

function runStatus(status: IntegrityRun["status"] | undefined) {
  if (status === "passed") return "OK";
  if (status === "warning") return "CHECK";
  if (status === "failed") return "FAIL";
  if (status === "running") return "LIVE";
  if (status === "queued") return "QUEUE";
  return "—";
}

function demoPayload(): IntegrityPayload {
  const now = new Date().toISOString();
  const day = (offset: number) => new Date(Date.now() - offset * 86400000).toISOString();
  const runs: IntegrityRun[] = [
    { id: "demo-run-1", run_key: "2026-10-17", source: "scheduled", status: "warning", branch: "main", commit_sha: "8967f39", started_at: now, finished_at: now, overall_score: 95, category_scores: { code: 100, security: 94, seo: 100, legal: 88 }, summary: "Demo", report_sha256: "demo", created_at: now },
    { id: "demo-run-2", run_key: "2026-10-16", source: "scheduled", status: "passed", branch: "main", commit_sha: "e451cee", started_at: day(1), finished_at: day(1), overall_score: 100, category_scores: { code: 100, security: 100, seo: 100, legal: 100 }, summary: "Demo", report_sha256: "demo", created_at: day(1) },
    { id: "demo-run-3", run_key: "2026-10-15", source: "scheduled", status: "passed", branch: "main", commit_sha: "06dd04e", started_at: day(2), finished_at: day(2), overall_score: 98, category_scores: { code: 100, security: 98, seo: 100, legal: 94 }, summary: "Demo", report_sha256: "demo", created_at: day(2) },
  ];
  const findings: IntegrityFinding[] = [
    { id: "demo-legal", run_id: runs[0].id, category: "legal", severity: "medium", title: "Retenție date", summary: "Politica necesită confirmare umană înainte de publicare.", evidence: "Schimbare detectată în politica de retenție.", manual_action: "Confirmă politica sau marchează riscul acceptat.", ai_action: null, can_ai_execute: false, requires_human: true, status: "open", created_at: now, updated_at: now },
    { id: "demo-security", run_id: runs[0].id, category: "security", severity: "high", title: "Security regression", summary: "Un contract de securitate necesită remediere.", evidence: "Test demonstrativ eșuat.", manual_action: null, ai_action: "Pregătește remedierea minimă și draft PR.", can_ai_execute: true, requires_human: false, status: "open", created_at: now, updated_at: now },
  ];
  return {
    latest_run: runs[0], recent_runs: runs, findings,
    manual_actions: [findings[0]], ai_actions: [findings[1]], actions: [],
    guardian: { mode: "pr_only", automatic_merge: false, direct_production_writes: false },
  };
}

export default function ControlCenterIntegrityConsole({ demo = false }: { demo?: boolean }) {
  const router = useRouter();
  const [payload, setPayload] = useState<IntegrityPayload | null>(demo ? demoPayload() : null);
  const [loading, setLoading] = useState(!demo);
  const [busy, setBusy] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const getToken = useCallback(async () => {
    const { data } = await orbyvenSupabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.replace("/control-center/login");
      throw new Error("Missing session");
    }
    return token;
  }, [router]);

  const load = useCallback(async () => {
    if (demo) {
      setPayload(demoPayload());
      setNotice("Demo reîmprospătat");
      window.setTimeout(() => setNotice(""), 1600);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch("/api/control-center/integrity", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as IntegrityPayload & { message?: string };
      if (!response.ok) {
        if (response.status === 401) { router.replace("/control-center/login"); return; }
        throw new Error(data.message ?? "Integrity unavailable");
      }
      setPayload(data);
    } catch (reason) {
      if (reason instanceof Error && reason.message === "Missing session") return;
      setError(reason instanceof Error ? reason.message : "Integrity unavailable");
    } finally {
      setLoading(false);
    }
  }, [demo, getToken, router]);

  useEffect(() => {
    if (demo) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [demo, load]);

  const latest = payload?.latest_run ?? null;
  const latestFindings = useMemo(() => {
    if (!latest) return [];
    return (payload?.findings ?? []).filter((item) => item.run_id === latest.id && item.status !== "resolved" && item.status !== "accepted_risk");
  }, [latest, payload]);

  const actionByFinding = useMemo(() => {
    const map = new Map<string, IntegrityAction>();
    for (const action of payload?.actions ?? []) {
      const current = map.get(action.finding_id);
      if (!current || new Date(action.updated_at).getTime() > new Date(current.updated_at).getTime()) map.set(action.finding_id, action);
    }
    return map;
  }, [payload]);

  const visibleFindings = useMemo(() => latestFindings.filter((item) => {
    if (filter !== "all" && item.category !== filter) return false;
    if (queueFilter === "manual" && !item.requires_human) return false;
    if (queueFilter === "guardian" && !item.can_ai_execute) return false;
    return true;
  }), [filter, latestFindings, queueFilter]);

  const manualCount = latestFindings.filter((item) => item.requires_human).length;
  const guardianCount = latestFindings.filter((item) => item.can_ai_execute).length;

  const perform = async (action: "queue_guardian_fix" | "resolve_manual" | "accept_risk", finding: IntegrityFinding) => {
    if (demo) {
      setBusy(`${action}:${finding.id}`);
      window.setTimeout(() => {
        setBusy("");
        setNotice(action === "queue_guardian_fix" ? "Draft PR simulat" : "Acțiune simulată");
        window.setTimeout(() => setNotice(""), 1800);
      }, 550);
      return;
    }
    setBusy(`${action}:${finding.id}`);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch("/api/control-center/integrity", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, finding_id: finding.id }),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Action failed");
      setNotice(action === "queue_guardian_fix" ? "Guardian queued" : "Saved");
      await load();
      window.setTimeout(() => setNotice(""), 1800);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed");
    } finally {
      setBusy("");
    }
  };

  const download = async (run: IntegrityRun) => {
    if (demo) {
      setNotice("Raport demo");
      window.setTimeout(() => setNotice(""), 1600);
      return;
    }
    setBusy(`report:${run.id}`);
    try {
      const token = await getToken();
      const response = await fetch(`/api/control-center/integrity/report?run_id=${encodeURIComponent(run.id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!response.ok) throw new Error("Report unavailable");
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `orbyven-integrity-${run.run_key}.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Report unavailable");
    } finally {
      setBusy("");
    }
  };

  return (
    <main className="min-h-screen bg-[#070709] text-[#f5f5f7] antialiased selection:bg-violet-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_72%_-10%,rgba(104,89,214,.13),transparent_34%),radial-gradient(circle_at_8%_28%,rgba(255,255,255,.035),transparent_24%)]" />
      <div className="relative mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex min-h-14 items-center justify-between gap-3">
          <BrandLogo compact theme="dark" />
          <div className="flex items-center gap-2">
            {demo && <span className="hidden rounded-full border border-violet-300/15 bg-violet-400/[0.07] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-violet-200 sm:inline">Demo</span>}
            <span className="flex h-8 items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/[0.06] px-3 text-[10px] font-semibold text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300"/>MFA</span>
            {!demo && <Link href="/control-center" className="flex h-8 items-center rounded-full border border-white/[.09] px-3 text-[10px] text-[#a6a6ad] hover:bg-white/[.04]">Control Center</Link>}
          </div>
        </header>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_260px] lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#6f6f76]"><Icon name="shield" className="h-3.5 w-3.5"/>Integrity</div>
            <h1 className="mt-3 text-[40px] font-semibold tracking-[-.055em] sm:text-[58px]">Control.</h1>
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[#77777d]">
              <span className="rounded-full border border-white/[.07] px-3 py-1.5">07:30 · daily</span>
              <span className="rounded-full border border-white/[.07] px-3 py-1.5">PR only</span>
              <span className="rounded-full border border-white/[.07] px-3 py-1.5">No auto-merge</span>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-[24px] border border-white/[.08] bg-white/[.025] p-5 shadow-[0_18px_60px_rgba(0,0,0,.2)]">
            <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${(latest?.overall_score ?? 0) >= 90 ? "#6ee7b7" : "#fcd34d"} ${(latest?.overall_score ?? 0) * 3.6}deg, rgba(255,255,255,.06) 0)` }}>
              <div className="absolute inset-[5px] rounded-full bg-[#0d0d10]" />
              <span className={`relative text-2xl font-semibold tracking-[-.05em] ${scoreTone(latest?.overall_score)}`}>{latest?.overall_score ?? "—"}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[.15em] text-[#66666d]">Health</div>
              <div className="mt-1 text-sm font-semibold">{runStatus(latest?.status)}</div>
              <div className="mt-1 truncate text-[10px] text-[#66666d]">{formatDate(latest?.finished_at ?? latest?.started_at, true)}</div>
            </div>
          </div>
        </section>

        {(notice || error) && <div className={`mt-4 rounded-2xl border px-4 py-2.5 text-xs ${error ? "border-rose-400/20 bg-rose-400/[.07] text-rose-200" : "border-emerald-400/20 bg-emerald-400/[.06] text-emerald-200"}`}>{error || notice}</div>}

        <section className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {CATEGORY_ORDER.map((category) => {
            const score = Number(latest?.category_scores?.[category] ?? 0);
            const count = latestFindings.filter((item) => item.category === category).length;
            const active = filter === category;
            return <button key={category} type="button" onClick={() => setFilter(active ? "all" : category)} className={`group rounded-[20px] border p-4 text-left transition ${active ? "border-violet-300/25 bg-violet-400/[.08]" : "border-white/[.07] bg-white/[.02] hover:border-white/[.13]"}`}>
              <div className="flex items-center justify-between gap-3">
                <span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? "bg-violet-400/[.12] text-violet-200" : "bg-white/[.035] text-[#8b8b92]"}`}><Icon name={CATEGORY_META[category].icon}/></span>
                <span className={`text-xl font-semibold tracking-[-.04em] ${scoreTone(score)}`}>{score || "—"}</span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2"><span className="text-xs font-semibold">{CATEGORY_META[category].label}</span><span className="text-[10px] text-[#66666d]">{count || "✓"}</span></div>
            </button>;
          })}
        </section>

        <section className="mt-4 rounded-[26px] border border-white/[.08] bg-[#0c0c0f] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-full border border-white/[.07] bg-black/20 p-1">
              {(["all", "manual", "guardian"] as const).map((mode) => {
                const active = queueFilter === mode;
                const count = mode === "all" ? latestFindings.length : mode === "manual" ? manualCount : guardianCount;
                return <button key={mode} type="button" onClick={() => setQueueFilter(mode)} className={`flex h-8 items-center gap-2 rounded-full px-3 text-[10px] font-semibold transition ${active ? "bg-white text-black" : "text-[#7d7d84] hover:text-white"}`}>
                  <Icon name={mode === "guardian" ? "spark" : mode === "manual" ? "user" : "shield"} className="h-3.5 w-3.5"/>
                  {mode === "all" ? "Toate" : mode === "manual" ? "Eu" : "Guardian"}<span className={active ? "text-black/50" : "text-[#55555c]"}>{count}</span>
                </button>;
              })}
            </div>
            <button type="button" onClick={() => void load()} disabled={loading} className="grid h-9 w-9 place-items-center rounded-full border border-white/[.08] text-[#7d7d84] transition hover:bg-white/[.04] hover:text-white disabled:opacity-40" aria-label="Refresh"><Icon name="refresh" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/></button>
          </div>

          <div className="mt-4 space-y-2">
            {loading ? <div className="rounded-2xl border border-white/[.05] px-4 py-7 text-center text-xs text-[#66666d]">Loading…</div> : visibleFindings.length === 0 ? <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[.025] px-4 py-7 text-center text-xs text-emerald-200/70">✓ Clear</div> : visibleFindings.map((finding) => {
              const open = expanded === finding.id;
              const action = actionByFinding.get(finding.id);
              const isBusy = busy.endsWith(finding.id);
              return <article key={finding.id} className="overflow-hidden rounded-[18px] border border-white/[.07] bg-white/[.018]">
                <button type="button" onClick={() => setExpanded(open ? null : finding.id)} className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left sm:px-4">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${severityDot(finding.severity)}`} />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold sm:text-sm">{finding.title}</span>
                  <span className="hidden text-[9px] uppercase tracking-[.12em] text-[#616168] sm:inline">{CATEGORY_META[finding.category].label}</span>
                  <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${finding.can_ai_execute ? "border-violet-300/15 bg-violet-400/[.06] text-violet-200" : "border-white/[.08] text-[#85858c]"}`}>{finding.can_ai_execute ? "AI" : "YOU"}</span>
                  <Icon name="chevron" className={`h-4 w-4 text-[#55555b] transition ${open ? "rotate-180" : ""}`}/>
                </button>
                {open && <div className="border-t border-white/[.055] px-4 pb-4 pt-3">
                  <p className="max-w-3xl text-[11px] leading-5 text-[#898990]">{finding.summary}</p>
                  {finding.evidence && <div className="mt-3 rounded-xl bg-black/25 px-3 py-2 font-mono text-[10px] leading-4 text-[#66666d]">{finding.evidence}</div>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {finding.can_ai_execute ? <button type="button" disabled={Boolean(busy)} onClick={() => void perform("queue_guardian_fix", finding)} className="flex h-8 items-center gap-2 rounded-full bg-violet-500 px-3.5 text-[10px] font-semibold text-white transition hover:bg-violet-400 disabled:opacity-45"><Icon name="spark" className="h-3.5 w-3.5"/>{isBusy ? "…" : action?.status === "waiting_approval" ? "PR ready" : action?.status === "running" ? "Running" : action?.status === "queued" ? "Queued" : "Prepare PR"}</button> : <>
                      <button type="button" disabled={Boolean(busy)} onClick={() => void perform("resolve_manual", finding)} className="h-8 rounded-full bg-white px-3.5 text-[10px] font-semibold text-black disabled:opacity-45">✓ Done</button>
                      <button type="button" disabled={Boolean(busy)} onClick={() => void perform("accept_risk", finding)} className="h-8 rounded-full border border-white/[.09] px-3.5 text-[10px] font-semibold text-[#818188] disabled:opacity-45">Risk</button>
                    </>}
                    {action?.pr_url && <a href={action.pr_url} target="_blank" rel="noreferrer" className="h-8 rounded-full border border-violet-300/15 px-3.5 py-2 text-[10px] font-semibold text-violet-200">Open PR ↗</a>}
                  </div>
                </div>}
              </article>;
            })}
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <article className="rounded-[26px] border border-white/[.08] bg-[#0c0c0f] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-semibold"><Icon name="clock" className="h-4 w-4 text-[#77777d]"/>History</div><span className="text-[9px] uppercase tracking-[.13em] text-[#55555c]">last {payload?.recent_runs.length ?? 0}</span></div>
            <div className="mt-3 divide-y divide-white/[.055]">
              {(payload?.recent_runs ?? []).slice(0, 5).map((run) => <div key={run.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3">
                <div className="min-w-0"><div className="truncate text-[11px] font-medium">{formatDate(run.finished_at ?? run.started_at, true)}</div><div className="mt-1 truncate text-[9px] text-[#55555c]">{run.branch ?? "main"}{run.commit_sha ? ` · ${run.commit_sha.slice(0, 7)}` : ""}</div></div>
                <span className={`text-sm font-semibold ${scoreTone(run.overall_score)}`}>{run.overall_score ?? "—"}</span>
                <button type="button" onClick={() => void download(run)} disabled={busy === `report:${run.id}`} className="grid h-8 w-8 place-items-center rounded-full border border-white/[.07] text-[#74747b] hover:bg-white/[.04] hover:text-white disabled:opacity-40" aria-label="Download report"><Icon name="download" className="h-3.5 w-3.5"/></button>
              </div>)}
            </div>
          </article>

          <article className="rounded-[26px] border border-violet-300/10 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,.08),transparent_45%),#0c0c0f] p-5">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-semibold"><Icon name="spark" className="h-4 w-4 text-violet-300"/>Guardian</div><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.35)]"/></div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-white/[.055] bg-white/[.02] px-2 py-3"><div className="text-lg font-semibold">PR</div><div className="mt-1 text-[8px] uppercase tracking-[.12em] text-[#55555c]">only</div></div>
              <div className="rounded-2xl border border-white/[.055] bg-white/[.02] px-2 py-3"><div className="text-lg font-semibold">0</div><div className="mt-1 text-[8px] uppercase tracking-[.12em] text-[#55555c]">merge</div></div>
              <div className="rounded-2xl border border-white/[.055] bg-white/[.02] px-2 py-3"><div className="text-lg font-semibold">0</div><div className="mt-1 text-[8px] uppercase tracking-[.12em] text-[#55555c]">prod</div></div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/[.055] bg-black/20 px-3 py-3 text-[10px] text-[#6d6d74]"><Icon name="shield" className="h-4 w-4 shrink-0 text-emerald-300"/><span>MFA · owner · validated patch</span></div>
          </article>
        </section>

        {demo && <div className="mt-4 text-center text-[9px] uppercase tracking-[.14em] text-[#4f4f56]">Fictive data · isolated demo · no real actions</div>}
      </div>
    </main>
  );
}
