"use client";

import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type {
  ControlCenterOrganization,
  ControlCenterPayload,
  OrbyvenMemberAccessStatus,
  OrbyvenOrganizationLifecycleStatus,
} from "@/lib/orbyven-control-center-contracts";
import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const lifecycleOptions: OrbyvenOrganizationLifecycleStatus[] = [
  "provisioning",
  "active",
  "suspended",
  "archived",
];

const configurableModules = ORBYVEN_MODULES.filter((item) => item.id !== "overview");

function Dot({ state = "healthy" }: { state?: "healthy" | "attention" | "suspended" }) {
  const tone = state === "healthy" ? "bg-emerald-400" : state === "attention" ? "bg-amber-300" : "bg-rose-400";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${tone}`} />;
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#0d0e12] p-4">
      <div className="text-[9px] font-bold tracking-[0.14em] text-[#66666f]">{label}</div>
      <div className="mt-5 text-3xl font-semibold tracking-[-0.06em]">{value}</div>
    </div>
  );
}

export default function ControlCenterCompactLive() {
  const router = useRouter();
  const [payload, setPayload] = useState<ControlCenterPayload | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [lifecycleDrafts, setLifecycleDrafts] = useState<
    Record<string, OrbyvenOrganizationLifecycleStatus>
  >({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = useCallback(async () => {
    const { data } = await orbyvenSupabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      router.replace("/control-center/login");
      throw new Error("missing_session");
    }
    return accessToken;
  }, [router]);

  const load = useCallback(async () => {
    setError("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/control-center", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as ControlCenterPayload & { message?: string };
      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/control-center/login");
          return;
        }
        throw new Error(data.message ?? "Control Center unavailable");
      }
      setPayload(data);
      setSelectedId((current) =>
        current && data.organizations.some((item) => item.id === current)
          ? current
          : data.organizations[0]?.id ?? ""
      );
    } catch (reason) {
      if (reason instanceof Error && reason.message === "missing_session") return;
      setError(reason instanceof Error ? reason.message : "Control Center unavailable");
    }
  }, [router, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selected = useMemo(
    () => payload?.organizations.find((item) => item.id === selectedId) ?? null,
    [payload, selectedId]
  );

  const lifecycle = selected
    ? lifecycleDrafts[selected.id] ?? selected.lifecycle_status
    : "active";

  const run = async (body: Record<string, unknown>, message: string) => {
    setBusy(String(body.action ?? "action"));
    setError("");
    setNotice("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/control-center", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Action failed");
      setNotice(message);
      await load();
      window.setTimeout(() => setNotice(""), 1800);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed");
      return false;
    } finally {
      setBusy("");
    }
  };

  const updateLifecycle = async () => {
    if (!selected) return;
    const ok = await run(
      {
        action: "set_organization_lifecycle",
        organization_id: selected.id,
        lifecycle_status: lifecycle,
      },
      "Saved"
    );
    if (ok) {
      setLifecycleDrafts((current) => {
        const next = { ...current };
        delete next[selected.id];
        return next;
      });
    }
  };

  const invite = async () => {
    if (!selected || !inviteEmail.trim()) return;
    const ok = await run(
      {
        action: "invite_member",
        organization_id: selected.id,
        email: inviteEmail.trim(),
        role: "member",
      },
      "Invite sent"
    );
    if (ok) setInviteEmail("");
  };

  const setAccess = async (organization: ControlCenterOrganization, userId: string, access: OrbyvenMemberAccessStatus) => {
    await run(
      {
        action: "set_member_access",
        organization_id: organization.id,
        user_id: userId,
        access_status: access,
      },
      access === "active" ? "Access restored" : "Access suspended"
    );
  };

  const toggleModule = async (moduleId: OrbyvenModuleId) => {
    if (!selected || moduleId === "overview") return;
    const current = selected.modules.find((item) => item.module_id === moduleId);
    await run(
      {
        action: "set_modules",
        organization_id: selected.id,
        modules: [
          {
            module_id: moduleId,
            enabled: !(current?.enabled ?? false),
            settings: current?.settings ?? {},
          },
        ],
      },
      current?.enabled ? "Module disabled" : "Module enabled"
    );
  };

  const organizations = payload?.organizations ?? [];
  const healthy = organizations.filter((item) => item.technical_status.state === "healthy").length;
  const attention = organizations.filter((item) => item.technical_status.state !== "healthy").length;
  const members = organizations.reduce((total, item) => total + item.technical_status.member_count, 0);
  const modules = organizations.reduce((total, item) => total + item.technical_status.enabled_module_count, 0);
  const pending = organizations.reduce((total, item) => total + item.technical_status.pending_invite_count, 0);

  return (
    <main className="min-h-screen bg-[#07080b] text-white antialiased">
      <div className="mx-auto max-w-[1380px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
          <Link href="/control-center/compact" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-indigo-400/25 bg-indigo-400/[0.08] text-indigo-200">◎</span>
            <span><strong className="block text-[12px] tracking-[0.22em]">ORBYVEN</strong><span className="mt-1 block text-[8px] font-bold tracking-[0.28em] text-indigo-300">CONTROL</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/control-center/legal" className="rounded-full border border-white/[0.08] px-3 py-2 text-[9px] font-bold tracking-[0.1em] text-[#8a8a92]">LEGAL</Link>
            <Link href="/control-center/platform" className="rounded-full border border-white/[0.08] px-3 py-2 text-[9px] font-bold tracking-[0.1em] text-[#8a8a92]">ADVANCED</Link>
            <button type="button" onClick={() => void load()} className="grid h-8 w-8 place-items-center rounded-full bg-white text-black" aria-label="Refresh">↻</button>
          </div>
        </header>

        {error ? <div className="mt-4 rounded-[16px] border border-rose-400/20 bg-rose-400/[0.05] px-4 py-3 text-xs text-rose-200">{error}</div> : null}
        {notice ? <div className="fixed right-5 top-5 z-50 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black shadow-2xl">{notice}</div> : null}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metric label="TENANTS" value={organizations.length} />
          <Metric label="HEALTHY" value={healthy} />
          <Metric label="ATTENTION" value={attention} />
          <Metric label="USERS" value={members} />
          <Metric label="MODULES" value={modules} />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-4 lg:self-start">
            <div className="flex items-center justify-between px-1"><span className="text-[9px] font-bold tracking-[0.14em] text-[#66666f]">TENANTS</span><span className="text-[9px] text-[#55555d]">{pending} PENDING</span></div>
            <div className="mt-3 space-y-2">
              {organizations.map((organization) => (
                <button key={organization.id} type="button" onClick={() => setSelectedId(organization.id)} className={`flex w-full items-center gap-3 rounded-[16px] border px-3 py-3 text-left ${selectedId === organization.id ? "border-indigo-300/25 bg-indigo-400/[0.07]" : "border-white/[0.06]"}`}>
                  <Dot state={organization.technical_status.state} />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">{organization.profile?.display_name ?? organization.name}</span>
                  <span className="text-[9px] text-[#55555d]">›</span>
                </button>
              ))}
              {!organizations.length ? <div className="grid min-h-28 place-items-center text-[9px] font-bold tracking-[0.12em] text-[#55555d]">NO TENANTS</div> : null}
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            {selected ? (
              <>
                <section className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3"><Dot state={selected.technical_status.state}/><div className="min-w-0"><div className="truncate text-sm font-semibold">{selected.profile?.display_name ?? selected.name}</div><div className="mt-1 text-[9px] text-[#606068]">{selected.slug}</div></div></div>
                    <div className="flex items-center gap-2"><select value={lifecycle} onChange={(event) => {
                      if (!selected) return;
                      setLifecycleDrafts((current) => ({
                        ...current,
                        [selected.id]: event.target.value as OrbyvenOrganizationLifecycleStatus,
                      }));
                    }} className="h-9 rounded-full border border-white/[0.08] bg-black px-3 text-[10px] outline-none">{lifecycleOptions.map((item) => <option key={item}>{item}</option>)}</select><button type="button" onClick={() => void updateLifecycle()} disabled={busy === "set_organization_lifecycle" || lifecycle === selected.lifecycle_status} className="h-9 rounded-full bg-white px-4 text-[9px] font-bold text-black disabled:opacity-30">SAVE</button></div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="USERS" value={selected.technical_status.member_count}/><Metric label="ACTIVE" value={selected.technical_status.active_member_count}/><Metric label="MODULES" value={selected.technical_status.enabled_module_count}/><Metric label="PENDING" value={selected.technical_status.pending_invite_count}/></div>
                </section>

                <section className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5">
                  <div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[0.14em] text-[#66666f]">MODULES</span><span className="text-[9px] text-[#55555d]">{selected.technical_status.enabled_module_count} ON</span></div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {configurableModules.map((module) => {
                      const assignment = selected.modules.find((item) => item.module_id === module.id);
                      const enabled = assignment?.enabled ?? false;
                      const moduleBusy = busy === "set_modules";
                      return (
                        <button key={module.id} type="button" onClick={() => void toggleModule(module.id)} disabled={moduleBusy} className={`flex items-center justify-between gap-3 rounded-[16px] border px-3 py-3 text-left transition ${enabled ? "border-emerald-400/18 bg-emerald-400/[0.045]" : "border-white/[0.06] bg-black/10"} disabled:opacity-40`}>
                          <span className="min-w-0 truncate text-[10px] font-semibold">{module.shortName}</span>
                          <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${enabled ? "bg-emerald-300" : "bg-[#2a2b31]"}`}><span className={`absolute top-1 h-3 w-3 rounded-full bg-black transition ${enabled ? "left-5" : "left-1"}`} /></span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5">
                  <div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[0.14em] text-[#66666f]">ACCESS</span><span className="text-[9px] text-[#55555d]">{selected.members.length}</span></div>
                  <div className="mt-4 flex gap-2"><input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="email@client.ro" className="h-10 min-w-0 flex-1 rounded-full border border-white/[0.08] bg-black px-4 text-xs outline-none"/><button type="button" onClick={() => void invite()} disabled={!inviteEmail.trim() || busy === "invite_member"} className="h-10 rounded-full bg-indigo-200 px-4 text-[9px] font-bold text-[#111118] disabled:opacity-30">INVITE</button></div>
                  <div className="mt-4 divide-y divide-white/[0.06] overflow-hidden rounded-[18px] border border-white/[0.06]">
                    {selected.members.map((member) => (
                      <div key={member.user_id} className="flex items-center gap-3 px-4 py-3"><Dot state={member.access_status === "active" ? "healthy" : "suspended"}/><div className="min-w-0 flex-1"><div className="truncate text-xs">{member.email ?? member.user_id}</div><div className="mt-1 text-[8px] font-bold tracking-[0.1em] text-[#5d5d65]">{member.role.toUpperCase()}</div></div><button type="button" onClick={() => void setAccess(selected, member.user_id, member.access_status === "active" ? "suspended" : "active")} disabled={busy === "set_member_access"} className={`rounded-full border px-3 py-1.5 text-[8px] font-bold ${member.access_status === "active" ? "border-rose-400/15 text-rose-300" : "border-emerald-400/15 text-emerald-300"}`}>{member.access_status === "active" ? "SUSPEND" : "RESTORE"}</button></div>
                    ))}
                    {!selected.members.length ? <div className="p-5 text-center text-[9px] text-[#55555d]">NO USERS</div> : null}
                  </div>
                </section>
              </>
            ) : (
              <div className="grid min-h-[320px] place-items-center rounded-[26px] border border-dashed border-white/[0.08] text-[9px] font-bold tracking-[0.12em] text-[#55555d]">SELECT TENANT</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
