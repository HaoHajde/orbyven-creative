"use client";

import BrandLogo from "@/components/BrandLogo";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type {
  ControlCenterPayload,
  OrbyvenMemberAccessStatus,
  OrbyvenOrganizationLifecycleStatus,
  OrbyvenPlatformRole,
  OrbyvenStaffRole,
} from "@/lib/orbyven-control-center-contracts";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

const CLIENT_ROLES: OrbyvenPlatformRole[] = ["owner","admin","manager","member","viewer"];
const LIFECYCLE_OPTIONS: OrbyvenOrganizationLifecycleStatus[] = ["provisioning","active","suspended","archived"];
const STAFF_ROLES: OrbyvenStaffRole[] = ["platform_owner","platform_admin","support"];
type View = "tenants" | "access" | "staff" | "audit";

const CONTROL = "h-10 w-full rounded-[12px] border border-white/[0.08] bg-black/35 px-3 text-xs text-[#e8e8eb] outline-none transition placeholder:text-[#55555c] focus:border-indigo-400/50 disabled:opacity-45";
const BUTTON = "h-10 rounded-[12px] border border-white/[0.1] px-4 text-[11px] font-semibold text-[#bdbdc3] transition hover:border-white/20 hover:text-white disabled:opacity-40";
const PRIMARY = "h-10 rounded-[12px] bg-white px-4 text-[11px] font-semibold text-black transition hover:bg-[#ececef] disabled:opacity-40";

function fmt(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("ro-RO", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }).format(parsed);
}

export default function PlatformCoreOperations() {
  const router = useRouter();
  const [payload, setPayload] = useState<ControlCenterPayload | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [view, setView] = useState<View>("tenants");
  const [lifecycleDrafts, setLifecycleDrafts] = useState<Record<string, OrbyvenOrganizationLifecycleStatus>>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrbyvenPlatformRole>("owner");
  const [staffUserId, setStaffUserId] = useState("");
  const [staffRole, setStaffRole] = useState<OrbyvenStaffRole>("support");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const getToken = useCallback(async () => {
    const { data } = await orbyvenSupabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.replace("/control-center/login");
      throw new Error("missing_session");
    }
    return token;
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const token = await getToken();
      const response = await fetch("/api/control-center", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as ControlCenterPayload & { message?: string };
      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/control-center/login");
          return;
        }
        throw new Error(data.message ?? "Platform Core unavailable");
      }
      setPayload(data);
      setSelectedOrganizationId((current) =>
        current && data.organizations.some((organization) => organization.id === current)
          ? current
          : data.organizations[0]?.id ?? ""
      );
    } catch (error) {
      if (error instanceof Error && error.message === "missing_session") return;
      setErrorMessage(error instanceof Error ? error.message : "Platform Core unavailable");
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selectedOrganization = useMemo(
    () => payload?.organizations.find((organization) => organization.id === selectedOrganizationId) ?? null,
    [payload, selectedOrganizationId]
  );

  const lifecycle = selectedOrganization
    ? lifecycleDrafts[selectedOrganization.id] ?? selectedOrganization.lifecycle_status
    : "active";

  // Exact-owner middleware promotes the authenticated owner to platform_owner.
  const canAdmin = payload?.current_staff.role === "platform_owner" || payload?.current_staff.role === "platform_admin";
  const canManageStaff = payload?.current_staff.role === "platform_owner";

  const action = async (body: Record<string, unknown>, success: string) => {
    setBusy(String(body.action ?? "action"));
    setMessage("");
    setErrorMessage("");
    try {
      const token = await getToken();
      const response = await fetch("/api/control-center", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Action failed");
      setMessage(success);
      await load();
      window.setTimeout(() => setMessage(""), 1600);
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Action failed");
      return false;
    } finally {
      setBusy("");
    }
  };

  const invite = async () => {
    if (!selectedOrganization || !inviteEmail.trim()) return;
    const ok = await action({
      action: "invite_member",
      organization_id: selectedOrganization.id,
      email: inviteEmail,
      role: inviteRole,
    }, "Access prepared");
    if (ok) setInviteEmail("");
  };

  const updateLifecycle = async () => {
    if (!selectedOrganization) return;
    const ok = await action({
      action: "set_organization_lifecycle",
      organization_id: selectedOrganization.id,
      lifecycle_status: lifecycle,
    }, "Lifecycle saved");
    if (ok) {
      setLifecycleDrafts((current) => {
        const next = { ...current };
        delete next[selectedOrganization.id];
        return next;
      });
    }
  };

  const setMemberAccess = async (userId: string, accessStatus: OrbyvenMemberAccessStatus) => {
    if (!selectedOrganization) return;
    await action({
      action: "set_member_access",
      organization_id: selectedOrganization.id,
      user_id: userId,
      access_status: accessStatus,
    }, accessStatus === "active" ? "Access active" : "Access suspended");
  };

  const sendAccessEmail = async (email: string | null) => {
    if (!selectedOrganization || !email) return;
    await action({
      action: "send_access_email",
      organization_id: selectedOrganization.id,
      email,
    }, "Access email sent");
  };

  const saveStaff = async () => {
    if (!staffUserId.trim()) return;
    const ok = await action({
      action: "upsert_platform_staff",
      user_id: staffUserId.trim(),
      role: staffRole,
    }, "Staff registry saved");
    if (ok) setStaffUserId("");
  };

  const removeStaff = async (userId: string) => {
    if (!window.confirm("Remove this internal staff record?")) return;
    await action({ action: "remove_platform_staff", user_id: userId }, "Staff record removed");
  };

  const auditEvents = useMemo(() => {
    if (!payload) return [];
    if (!selectedOrganizationId) return payload.audit_events.slice(0, 30);
    return payload.audit_events
      .filter((event) => event.organization_id === selectedOrganizationId || event.organization_id === null)
      .slice(0, 30);
  }, [payload, selectedOrganizationId]);

  const platformMetrics = useMemo(() => {
    const organizations = payload?.organizations ?? [];
    return {
      tenants: organizations.length,
      attention: organizations.filter((item) => item.technical_status.state !== "healthy").length,
      users: organizations.reduce((sum, item) => sum + item.members.length, 0),
      pending: organizations.reduce((sum, item) => sum + item.technical_status.pending_invite_count, 0),
    };
  }, [payload]);

  if (loading && !payload) {
    return <main className="grid min-h-screen place-items-center bg-[#08080a] text-[#77777d]"><span className="h-5 w-5 animate-spin rounded-full border border-white/15 border-t-white" /></main>;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_55%_-15%,rgba(79,70,229,.12),transparent_32%),#08080a] pb-24 text-[#f5f5f7] antialiased">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#09090b]/86 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[68px] max-w-[1560px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo compact theme="dark" />
            <span className="hidden h-5 w-px bg-white/[0.08] sm:block" />
            <div className="hidden sm:block">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#606067]">CONTROL CENTER</p>
              <p className="mt-0.5 text-[11px] font-semibold">Platform Core</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-white/[0.07] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6f6f76] sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-400"/>Owner</span>
            <button type="button" onClick={() => void load()} className="grid h-9 w-9 place-items-center rounded-[12px] border border-white/[0.08] text-[#77777d] hover:text-white" aria-label="Refresh">↻</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        {errorMessage && <Toast tone="error">{errorMessage}</Toast>}
        {message && <Toast tone="success">{message}</Toast>}

        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Tenants" value={platformMetrics.tenants} />
          <Metric label="Attention" value={platformMetrics.attention} tone={platformMetrics.attention ? "warn" : "ok"} />
          <Metric label="Users" value={platformMetrics.users} />
          <Metric label="Pending" value={platformMetrics.pending} tone={platformMetrics.pending ? "warn" : "ok"} />
        </section>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-[15px] border border-white/[0.07] bg-white/[0.025] p-1">
            {([
              ["tenants","Tenants"],
              ["access","Access"],
              ["staff","Staff"],
              ["audit","Audit"],
            ] as const).map(([id,label]) => (
              <button key={id} type="button" onClick={() => setView(id)} className={`h-9 whitespace-nowrap rounded-[11px] px-3 text-[10px] font-semibold transition ${view===id?"bg-white text-black":"text-[#77777d] hover:text-white"}`}>{label}</button>
            ))}
          </div>

          <select value={selectedOrganizationId} onChange={(event) => setSelectedOrganizationId(event.target.value)} className="h-10 min-w-[220px] max-w-full rounded-[12px] border border-white/[0.08] bg-black/30 px-3 text-[10px] text-[#b4b4ba] outline-none">
            {payload?.organizations.length ? null : <option value="">No tenants</option>}
            {payload?.organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.profile?.display_name ?? organization.name}</option>)}
          </select>
        </div>

        {view === "tenants" && (
          <section className="mt-4 grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-2">
              {payload?.organizations.map((organization) => (
                <button key={organization.id} type="button" onClick={() => setSelectedOrganizationId(organization.id)} className={`w-full rounded-[18px] border p-4 text-left transition ${organization.id===selectedOrganizationId?"border-white/[0.14] bg-white/[0.055]":"border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"}`}>
                  <div className="flex items-center gap-2.5"><StateDot state={organization.technical_status.state}/><span className="min-w-0 flex-1 truncate text-xs font-semibold">{organization.profile?.display_name ?? organization.name}</span><span className="text-[9px] text-[#55555b]">{organization.members.length}</span></div>
                  <p className="mt-2 pl-4 text-[9px] text-[#5d5d63]">{organization.lifecycle_status} · {organization.technical_status.enabled_module_count} modules</p>
                </button>
              ))}
              {!payload?.organizations.length && <Empty>No tenants</Empty>}
            </div>

            {selectedOrganization ? (
              <Panel title={selectedOrganization.profile?.display_name ?? selectedOrganization.name} badge={selectedOrganization.lifecycle_status}>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-end">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Health label="Lifecycle" ok={selectedOrganization.technical_status.checks.lifecycle_active}/>
                    <Health label="Owner" ok={selectedOrganization.technical_status.checks.owner}/>
                    <Health label="Members" ok={selectedOrganization.technical_status.checks.active_members}/>
                    <Health label="Profile" ok={selectedOrganization.technical_status.checks.profile}/>
                    <Health label="Modules" ok={selectedOrganization.technical_status.checks.known_modules}/>
                    <Health label="Invites" ok={selectedOrganization.technical_status.pending_invite_count===0}/>
                  </div>
                  <select value={lifecycle} onChange={(event) => setLifecycleDrafts((current) => ({...current,[selectedOrganization.id]:event.target.value as OrbyvenOrganizationLifecycleStatus}))} disabled={!canAdmin} className={CONTROL}>
                    {LIFECYCLE_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <button type="button" onClick={() => void updateLifecycle()} disabled={!canAdmin||busy==="set_organization_lifecycle"} className={PRIMARY}>Save</button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
                  <Mini label="Plan" value={selectedOrganization.subscription.plan ?? "—"}/>
                  <Mini label="Subscription" value={selectedOrganization.subscription.subscription_status ?? "—"}/>
                  <Mini label="Active users" value={String(selectedOrganization.technical_status.active_member_count)}/>
                  <Mini label="Updated" value={fmt(selectedOrganization.technical_status.last_config_update)}/>
                </div>
              </Panel>
            ) : <Empty>Select tenant</Empty>}
          </section>
        )}

        {view === "access" && (
          <section className="mt-4 space-y-3">
            {!selectedOrganization ? <Empty>Select tenant</Empty> : <>
              <Panel title="Invite" badge={selectedOrganization.slug}>
                <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_auto]">
                  <input type="email" value={inviteEmail} onChange={(event)=>setInviteEmail(event.target.value)} placeholder="client@company.com" disabled={!canAdmin} className={CONTROL}/>
                  <select value={inviteRole} onChange={(event)=>setInviteRole(event.target.value as OrbyvenPlatformRole)} disabled={!canAdmin} className={CONTROL}>{CLIENT_ROLES.map((role)=><option key={role}>{role}</option>)}</select>
                  <button type="button" onClick={()=>void invite()} disabled={!canAdmin||!inviteEmail.trim()||busy==="invite_member"} className={PRIMARY}>Invite</button>
                </div>
              </Panel>

              <Panel title="Users" badge={String(selectedOrganization.members.length)}>
                <div className="overflow-hidden rounded-[16px] border border-white/[0.06]">
                  {selectedOrganization.members.map((member,index)=><div key={member.user_id} className={`grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_110px_auto_auto] lg:items-center ${index?"border-t border-white/[0.06]":""}`}>
                    <div className="min-w-0"><p className="truncate text-[11px] font-medium">{member.email ?? member.user_id}</p><p className="mt-1 text-[9px] text-[#55555b]">{member.role} · {member.email_confirmed_at?"confirmed":"pending"}</p></div>
                    <span className={`w-fit rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase ${member.access_status==="active"?"bg-emerald-400/[0.08] text-emerald-200":"bg-rose-400/[0.08] text-rose-200"}`}>{member.access_status}</span>
                    <button type="button" onClick={()=>void sendAccessEmail(member.email)} disabled={!member.email||busy==="send_access_email"} className={BUTTON}>Email</button>
                    <button type="button" onClick={()=>void setMemberAccess(member.user_id,member.access_status==="active"?"suspended":"active")} disabled={!canAdmin||busy==="set_member_access"} className={member.access_status==="active"?"h-10 rounded-[12px] border border-rose-400/15 px-4 text-[10px] font-semibold text-rose-300 disabled:opacity-40":"h-10 rounded-[12px] border border-emerald-400/15 px-4 text-[10px] font-semibold text-emerald-200 disabled:opacity-40"}>{member.access_status==="active"?"Suspend":"Activate"}</button>
                  </div>)}
                  {!selectedOrganization.members.length&&<div className="px-4 py-8 text-center text-[10px] text-[#55555b]">No users</div>}
                </div>
              </Panel>
            </>}
          </section>
        )}

        {view === "staff" && (
          <section className="mt-4 grid gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Panel title="Registry" badge="NO LOGIN PATH">
              <p className="text-[9px] leading-4 text-[#55555b]">Records here do not bypass the exact-owner gate. Only the configured owner can enter Control Center.</p>
              {canManageStaff&&<div className="mt-4 grid gap-2">
                <input value={staffUserId} onChange={(event)=>setStaffUserId(event.target.value)} placeholder="Auth user UUID" className={CONTROL}/>
                <select value={staffRole} onChange={(event)=>setStaffRole(event.target.value as OrbyvenStaffRole)} className={CONTROL}>{STAFF_ROLES.map((role)=><option key={role}>{role}</option>)}</select>
                <button type="button" onClick={()=>void saveStaff()} disabled={!staffUserId.trim()||busy==="upsert_platform_staff"} className={PRIMARY}>Save record</button>
              </div>}
            </Panel>

            <Panel title="Staff records" badge={String(payload?.platform_staff.length ?? 0)}>
              <div className="space-y-2">
                {payload?.platform_staff.map((staff)=><div key={staff.user_id} className="flex flex-col gap-3 rounded-[15px] border border-white/[0.06] bg-black/20 p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium">{staff.email ?? staff.user_id}</p><p className="mt-1 text-[9px] text-[#55555b]">{staff.role} · {staff.enabled?"enabled":"disabled"}</p></div>
                  {canManageStaff&&<button type="button" onClick={()=>void removeStaff(staff.user_id)} className="h-9 rounded-[11px] border border-rose-400/15 px-3 text-[10px] font-semibold text-rose-300">Remove</button>}
                </div>)}
                {!payload?.platform_staff.length&&<div className="py-8 text-center text-[10px] text-[#55555b]">No records</div>}
              </div>
            </Panel>
          </section>
        )}

        {view === "audit" && (
          <section className="mt-4">
            <Panel title="Audit" badge={String(auditEvents.length)}>
              <div className="space-y-2">
                {auditEvents.map((event)=><article key={event.id} className="rounded-[15px] border border-white/[0.06] bg-black/20 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-semibold">{event.action}</p><p className="mt-1 text-[9px] text-[#55555b]">{event.actor_email ?? event.actor_user_id ?? "system"} · {event.actor_role ?? "—"}</p></div><time className="text-[9px] text-[#55555b]">{fmt(event.created_at)}</time></div>
                  {Object.keys(event.metadata).length>0&&<details className="mt-2 text-[9px] text-[#606066]"><summary className="cursor-pointer">Metadata</summary><pre className="mt-2 overflow-x-auto rounded-[10px] bg-black/40 p-2 text-[9px] leading-4">{JSON.stringify(event.metadata,null,2)}</pre></details>}
                </article>)}
                {!auditEvents.length&&<div className="py-8 text-center text-[10px] text-[#55555b]">No events</div>}
              </div>
            </Panel>
          </section>
        )}
      </div>
    </main>
  );
}

function Panel({title,badge,children}:{title:string;badge?:string;children:ReactNode}) {
  return <section className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-xs font-semibold">{title}</h2>{badge&&<span className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#66666d]">{badge}</span>}</div><div className="mt-4">{children}</div></section>;
}

function Metric({label,value,tone="neutral"}:{label:string;value:number;tone?:"neutral"|"ok"|"warn"}) {
  return <article className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-center justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#5f5f66]">{label}</p><p className="mt-1 text-2xl font-semibold tracking-[-0.05em]">{value}</p></div><span className={`h-2 w-2 rounded-full ${tone==="ok"?"bg-emerald-400":tone==="warn"?"bg-amber-300":"bg-[#55555b]"}`}/></div></article>;
}

function Health({label,ok}:{label:string;ok:boolean}) {
  return <div className="flex items-center justify-between rounded-[12px] bg-black/25 px-3 py-2.5"><span className="text-[9px] text-[#74747a]">{label}</span><span className={`h-2 w-2 rounded-full ${ok?"bg-emerald-400":"bg-amber-300"}`}/></div>;
}

function Mini({label,value}:{label:string;value:string}) {
  return <div className="min-w-0"><p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#4f4f55]">{label}</p><p className="mt-1 truncate text-[9px] text-[#9999a0]">{value}</p></div>;
}

function StateDot({state}:{state:"healthy"|"attention"|"suspended"}) {
  return <span className={`h-2 w-2 shrink-0 rounded-full ${state==="healthy"?"bg-emerald-400":state==="attention"?"bg-amber-300":"bg-rose-400"}`}/>;
}

function Empty({children}:{children:ReactNode}) {
  return <div className="grid min-h-[160px] place-items-center rounded-[20px] border border-dashed border-white/[0.07] text-[10px] text-[#55555b]">{children}</div>;
}

function Toast({tone,children}:{tone:"error"|"success";children:ReactNode}) {
  return <div className={`fixed right-4 top-20 z-[80] max-w-sm rounded-[14px] border px-4 py-3 text-[11px] shadow-2xl ${tone==="success"?"border-emerald-400/20 bg-emerald-950/85 text-emerald-200":"border-rose-400/20 bg-rose-950/85 text-rose-200"}`}>{children}</div>;
}
