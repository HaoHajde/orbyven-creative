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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const CLIENT_ROLES: OrbyvenPlatformRole[] = [
  "owner",
  "admin",
  "manager",
  "member",
  "viewer",
];
const LIFECYCLE_OPTIONS: OrbyvenOrganizationLifecycleStatus[] = [
  "provisioning",
  "active",
  "suspended",
  "archived",
];
const STAFF_ROLES: OrbyvenStaffRole[] = [
  "platform_owner",
  "platform_admin",
  "support",
];

export default function PlatformCoreOperations() {
  const router = useRouter();
  const [payload, setPayload] = useState<ControlCenterPayload | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [lifecycleDrafts, setLifecycleDrafts] = useState<
    Record<string, OrbyvenOrganizationLifecycleStatus>
  >({});
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
      const data = (await response.json()) as ControlCenterPayload & {
        message?: string;
      };
      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/control-center/login");
          return;
        }
        throw new Error(data.message ?? "Platform Core nu a putut fi încărcat.");
      }

      setPayload(data);
      setSelectedOrganizationId((current) =>
        current && data.organizations.some((organization) => organization.id === current)
          ? current
          : data.organizations[0]?.id ?? ""
      );
    } catch (error) {
      if (error instanceof Error && error.message === "missing_session") return;
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Platform Core nu a putut fi încărcat."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selectedOrganization = useMemo(
    () =>
      payload?.organizations.find(
        (organization) => organization.id === selectedOrganizationId
      ) ?? null,
    [payload, selectedOrganizationId]
  );

  const lifecycle = selectedOrganization
    ? lifecycleDrafts[selectedOrganization.id] ?? selectedOrganization.lifecycle_status
    : "active";

  const canAdmin =
    payload?.current_staff.role === "platform_owner" ||
    payload?.current_staff.role === "platform_admin";
  const canManageStaff = payload?.current_staff.role === "platform_owner";

  const action = async (body: Record<string, unknown>, success: string) => {
    setBusy(String(body.action ?? "action"));
    setMessage("");
    setErrorMessage("");
    try {
      const token = await getToken();
      const response = await fetch("/api/control-center", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok) throw new Error(result.message ?? "Operația a eșuat.");
      setMessage(success);
      await load();
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Operația a eșuat.");
      return false;
    } finally {
      setBusy("");
    }
  };

  const invite = async () => {
    if (!selectedOrganization || !inviteEmail.trim()) return;
    const ok = await action(
      {
        action: "invite_member",
        organization_id: selectedOrganization.id,
        email: inviteEmail,
        role: inviteRole,
      },
      "Accesul clientului a fost pregătit. Pentru un cont nou, invitația a fost trimisă automat."
    );
    if (ok) setInviteEmail("");
  };

  const updateLifecycle = async () => {
    if (!selectedOrganization) return;
    const ok = await action(
      {
        action: "set_organization_lifecycle",
        organization_id: selectedOrganization.id,
        lifecycle_status: lifecycle,
      },
      "Starea tehnică a organizației a fost actualizată."
    );
    if (ok) {
      setLifecycleDrafts((current) => {
        const next = { ...current };
        delete next[selectedOrganization.id];
        return next;
      });
    }
  };

  const setMemberAccess = async (
    userId: string,
    accessStatus: OrbyvenMemberAccessStatus
  ) => {
    if (!selectedOrganization) return;
    await action(
      {
        action: "set_member_access",
        organization_id: selectedOrganization.id,
        user_id: userId,
        access_status: accessStatus,
      },
      accessStatus === "active"
        ? "Accesul utilizatorului a fost reactivat."
        : "Accesul utilizatorului a fost suspendat."
    );
  };

  const sendAccessEmail = async (email: string | null) => {
    if (!selectedOrganization || !email) return;
    await action(
      {
        action: "send_access_email",
        organization_id: selectedOrganization.id,
        email,
      },
      "Emailul securizat pentru setarea/resetarea parolei a fost trimis."
    );
  };

  const saveStaff = async () => {
    if (!staffUserId.trim()) return;
    const ok = await action(
      {
        action: "upsert_platform_staff",
        user_id: staffUserId.trim(),
        role: staffRole,
      },
      "Rolul intern ORBYVEN a fost salvat."
    );
    if (ok) setStaffUserId("");
  };

  const removeStaff = async (userId: string) => {
    if (!window.confirm("Elimini acest utilizator din ORBYVEN Platform Staff?")) return;
    await action(
      { action: "remove_platform_staff", user_id: userId },
      "Accesul intern ORBYVEN a fost eliminat."
    );
  };

  const auditEvents = useMemo(() => {
    if (!payload) return [];
    if (!selectedOrganizationId) return payload.audit_events.slice(0, 30);
    return payload.audit_events
      .filter(
        (event) =>
          event.organization_id === selectedOrganizationId ||
          event.organization_id === null
      )
      .slice(0, 30);
  }, [payload, selectedOrganizationId]);

  if (loading && !payload) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090a] text-sm text-[#a1a1a6]">
        Se deschide Platform Core v2...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090a] text-[#f5f5f7] antialiased">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#09090a]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1560px] items-center justify-between gap-4 px-5 py-3 md:px-8">
          <div className="flex items-center gap-4">
            <BrandLogo compact theme="dark" />
            <div className="h-6 w-px bg-white/[0.1]" />
            <div>
              <p className="text-xs font-semibold">Platform Core v2</p>
              <p className="text-[10px] text-[#86868b]">
                Auth · Provisioning · Lifecycle · Audit
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/control-center"
              className="h-10 rounded-full border border-white/[0.12] px-4 text-xs font-medium leading-10 text-[#d2d2d7]"
            >
              ← Control Center
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              className="h-10 rounded-full bg-white px-4 text-xs font-semibold text-black"
            >
              Reîncarcă
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1560px] px-5 py-8 md:px-8 md:py-10">
        <section className="flex flex-col justify-between gap-5 border-b border-white/[0.08] pb-8 lg:flex-row lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
              ORBYVEN INTERNAL
            </p>
            <h1 className="mt-3 text-[42px] font-semibold tracking-[-0.055em] sm:text-[58px]">
              Client operations.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a1a1a6]">
              Creezi accesul clientului, controlezi starea tehnică și vezi cine a schimbat ce, fără să intri în business logic-ul modulelor sau în billing.
            </p>
          </div>
          {payload?.current_staff ? (
            <div className="rounded-[18px] border border-white/[0.1] bg-[#111113] px-4 py-3 text-xs">
              <p className="font-semibold">{payload.current_staff.role}</p>
              <p className="mt-1 text-[#86868b]">
                {payload.current_staff.email ?? payload.current_staff.user_id} · {payload.current_staff.source}
              </p>
            </div>
          ) : null}
        </section>

        {errorMessage ? (
          <Notice tone="error">{errorMessage}</Notice>
        ) : null}
        {message ? <Notice tone="success">{message}</Notice> : null}

        <div className="mt-7 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-[24px] border border-white/[0.08] bg-[#0f0f11] p-4 xl:self-start">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
              Organizație
            </p>
            <div className="mt-3 space-y-2">
              {payload?.organizations.map((organization) => (
                <button
                  type="button"
                  key={organization.id}
                  onClick={() => setSelectedOrganizationId(organization.id)}
                  className={`w-full rounded-[16px] border px-4 py-3 text-left ${
                    organization.id === selectedOrganizationId
                      ? "border-[#6d68ff]/45 bg-[#4b46ee]/15"
                      : "border-white/[0.07] bg-black/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold">
                      {organization.profile?.display_name ?? organization.name}
                    </p>
                    <StatusDot state={organization.technical_status.state} />
                  </div>
                  <p className="mt-1 text-[10px] text-[#86868b]">
                    {organization.lifecycle_status} · {organization.members.length} useri
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            {!selectedOrganization ? (
              <CoreCard title="Nicio organizație selectată" eyebrow="PLATFORM CORE">
                <p className="text-sm text-[#86868b]">
                  Creează sau selectează firma din Control Center.
                </p>
              </CoreCard>
            ) : (
              <>
                <CoreCard title="Lifecycle organizație" eyebrow="TENANT STATE">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                    <label>
                      <FieldLabel>Stare tehnică</FieldLabel>
                      <select
                        value={lifecycle}
                        onChange={(event) =>
                          setLifecycleDrafts((current) => ({
                            ...current,
                            [selectedOrganization.id]: event.target
                              .value as OrbyvenOrganizationLifecycleStatus,
                          }))
                        }
                        disabled={!canAdmin}
                        className="h-11 w-full rounded-[14px] border border-white/[0.1] bg-black px-3 text-sm outline-none disabled:opacity-50"
                      >
                        {LIFECYCLE_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => void updateLifecycle()}
                      disabled={!canAdmin || busy === "set_organization_lifecycle"}
                      className="h-11 rounded-full bg-white px-5 text-xs font-semibold text-black disabled:opacity-40"
                    >
                      Salvează starea
                    </button>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#86868b]">
                    Starea tehnică oprește sau permite accesul la tenant. Este separată de subscription status-ul furnizat de Chat 3.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Health label="Lifecycle activ" ok={selectedOrganization.technical_status.checks.lifecycle_active} />
                    <Health label="Owner activ" ok={selectedOrganization.technical_status.checks.owner} />
                    <Health label="Membri activi" ok={selectedOrganization.technical_status.checks.active_members} />
                    <Health label="Profil" ok={selectedOrganization.technical_status.checks.profile} />
                    <Health label="Module cunoscute" ok={selectedOrganization.technical_status.checks.known_modules} />
                    <Health
                      label="Invitații confirmate"
                      ok={selectedOrganization.technical_status.pending_invite_count === 0}
                      note={`${selectedOrganization.technical_status.pending_invite_count} pending`}
                    />
                  </div>
                </CoreCard>

                <CoreCard title="Invită client" eyebrow="SEAMLESS PROVISIONING">
                  <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="client@firma.ro"
                      disabled={!canAdmin}
                      className="h-11 rounded-[14px] border border-white/[0.1] bg-black px-3 text-sm outline-none disabled:opacity-50"
                    />
                    <select
                      value={inviteRole}
                      onChange={(event) =>
                        setInviteRole(event.target.value as OrbyvenPlatformRole)
                      }
                      disabled={!canAdmin}
                      className="h-11 rounded-[14px] border border-white/[0.1] bg-black px-3 text-sm outline-none disabled:opacity-50"
                    >
                      {CLIENT_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void invite()}
                      disabled={!canAdmin || !inviteEmail.trim() || busy === "invite_member"}
                      className="h-11 rounded-full bg-white px-5 text-xs font-semibold text-black disabled:opacity-40"
                    >
                      Invită
                    </button>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#86868b]">
                    Pentru un cont nou, Supabase trimite invitația și clientul își setează parola. Un cont existent este atașat tenantului fără duplicat.
                  </p>
                </CoreCard>

                <CoreCard title="Acces utilizatori" eyebrow="USER LIFECYCLE">
                  <div className="overflow-hidden rounded-[18px] border border-white/[0.08]">
                    {selectedOrganization.members.length === 0 ? (
                      <div className="p-5 text-sm text-[#86868b]">
                        Niciun utilizator atribuit.
                      </div>
                    ) : (
                      selectedOrganization.members.map((member, index) => (
                        <div
                          key={member.user_id}
                          className={`grid gap-4 p-4 lg:grid-cols-[1fr_140px_170px_auto] lg:items-center ${
                            index ? "border-t border-white/[0.08]" : ""
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {member.email ?? member.user_id}
                            </p>
                            <p className="mt-1 text-[10px] text-[#86868b]">
                              {member.role} · {member.email_confirmed_at ? "email confirmat" : "invitație pending"}
                            </p>
                          </div>
                          <span
                            className={`w-fit rounded-full px-3 py-1 text-[10px] font-semibold ${
                              member.access_status === "active"
                                ? "bg-emerald-400/10 text-emerald-200"
                                : "bg-red-400/10 text-red-200"
                            }`}
                          >
                            {member.access_status}
                          </span>
                          <button
                            type="button"
                            onClick={() => void sendAccessEmail(member.email)}
                            disabled={!member.email || busy === "send_access_email"}
                            className="h-9 rounded-full border border-white/[0.12] px-4 text-xs disabled:opacity-40"
                          >
                            Trimite acces
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void setMemberAccess(
                                member.user_id,
                                member.access_status === "active"
                                  ? "suspended"
                                  : "active"
                              )
                            }
                            disabled={!canAdmin || busy === "set_member_access"}
                            className={`h-9 rounded-full border px-4 text-xs disabled:opacity-40 ${
                              member.access_status === "active"
                                ? "border-red-400/20 text-red-300"
                                : "border-emerald-400/20 text-emerald-200"
                            }`}
                          >
                            {member.access_status === "active" ? "Suspendă" : "Reactivează"}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </CoreCard>
              </>
            )}

            <CoreCard title="ORBYVEN Platform Staff" eyebrow="INTERNAL RBAC">
              <p className="text-xs leading-5 text-[#86868b]">
                Rolurile interne sunt separate de membership-urile clienților. Support poate vedea starea platformei și retrimite accesul, dar nu poate modifica tenantul.
              </p>
              {canManageStaff ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_190px_auto]">
                  <input
                    value={staffUserId}
                    onChange={(event) => setStaffUserId(event.target.value)}
                    placeholder="Supabase Auth user UUID"
                    className="h-11 rounded-[14px] border border-white/[0.1] bg-black px-3 text-sm outline-none"
                  />
                  <select
                    value={staffRole}
                    onChange={(event) =>
                      setStaffRole(event.target.value as OrbyvenStaffRole)
                    }
                    className="h-11 rounded-[14px] border border-white/[0.1] bg-black px-3 text-sm outline-none"
                  >
                    {STAFF_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void saveStaff()}
                    disabled={!staffUserId.trim() || busy === "upsert_platform_staff"}
                    className="h-11 rounded-full bg-white px-5 text-xs font-semibold text-black disabled:opacity-40"
                  >
                    Salvează staff
                  </button>
                </div>
              ) : null}
              <div className="mt-5 space-y-2">
                {payload?.platform_staff.length ? (
                  payload.platform_staff.map((staff) => (
                    <div
                      key={staff.user_id}
                      className="flex flex-col justify-between gap-3 rounded-[16px] border border-white/[0.08] bg-black/30 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {staff.email ?? staff.user_id}
                        </p>
                        <p className="mt-1 text-[10px] text-[#86868b]">
                          {staff.role} · {staff.enabled ? "enabled" : "disabled"}
                        </p>
                      </div>
                      {canManageStaff ? (
                        <button
                          type="button"
                          onClick={() => void removeStaff(staff.user_id)}
                          className="h-9 rounded-full border border-red-400/20 px-4 text-xs text-red-300"
                        >
                          Elimină
                        </button>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[16px] border border-dashed border-white/[0.1] p-4 text-xs leading-5 text-[#86868b]">
                    Nu există încă rânduri în platform_staff. Allowlist-ul din environment rămâne bootstrap/fallback până configurezi primul platform_owner.
                  </div>
                )}
              </div>
            </CoreCard>

            <CoreCard title="Audit log" eyebrow="PLATFORM HISTORY">
              <div className="space-y-2">
                {auditEvents.length ? (
                  auditEvents.map((event) => (
                    <article
                      key={event.id}
                      className="rounded-[16px] border border-white/[0.08] bg-black/30 p-4"
                    >
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <p className="text-sm font-semibold">{event.action}</p>
                          <p className="mt-1 text-[10px] text-[#86868b]">
                            {event.actor_email ?? event.actor_user_id ?? "system"} · {event.actor_role ?? "—"}
                          </p>
                        </div>
                        <time className="text-[10px] text-[#86868b]">
                          {new Intl.DateTimeFormat("ro-RO", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(event.created_at))}
                        </time>
                      </div>
                      {Object.keys(event.metadata).length ? (
                        <pre className="mt-3 overflow-x-auto rounded-[12px] bg-black p-3 text-[10px] leading-5 text-[#a1a1a6]">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-[#86868b]">
                    Audit log-ul se va popula odată cu operațiunile Platform Core v2.
                  </p>
                )}
              </div>
            </CoreCard>
          </div>
        </div>
      </div>
    </main>
  );
}

function CoreCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-white/[0.08] bg-[#0f0f11] p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">
      {children}
    </span>
  );
}

function Health({
  label,
  ok,
  note,
}: {
  label: string;
  ok: boolean;
  note?: string;
}) {
  return (
    <div className="rounded-[16px] bg-black/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[#d2d2d7]">{label}</p>
        <span
          className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`}
        />
      </div>
      <p className="mt-2 text-[10px] text-[#86868b]">
        {note ?? (ok ? "OK" : "Atenție")}
      </p>
    </div>
  );
}

function StatusDot({ state }: { state: "healthy" | "attention" | "suspended" }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${
        state === "healthy"
          ? "bg-emerald-400"
          : state === "suspended"
            ? "bg-red-400"
            : "bg-amber-400"
      }`}
    />
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mt-5 rounded-[18px] border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-red-400/20 bg-red-400/[0.08] text-red-300"
          : "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
      }`}
    >
      {children}
    </div>
  );
}
