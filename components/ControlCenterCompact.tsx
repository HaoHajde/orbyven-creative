"use client";

import BrandLogo from "@/components/BrandLogo";
import type {
  ControlCenterOrganization,
  ControlCenterPayload,
  OrbyvenPlatformRole,
} from "@/lib/orbyven-control-center-contracts";
import {
  ORBYVEN_MODULES,
  type OrbyvenModuleId,
} from "@/lib/orbyven-modules";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

type View = "overview" | "access" | "modules" | "profile";

type ProfileDraft = {
  name: string;
  slug: string;
  legal_name: string;
  display_name: string;
  greeting_name: string;
  logo_url: string;
  timezone: string;
  locale: string;
  settings_text: string;
};

type ModuleDraft = Record<string, { enabled: boolean; settings_text: string }>;

type CreateDraft = {
  name: string;
  slug: string;
  legal_name: string;
  module_ids: OrbyvenModuleId[];
};

const OPTIONAL_MODULES = ORBYVEN_MODULES.filter((module) => module.id !== "overview");
const ROLES: OrbyvenPlatformRole[] = ["owner", "admin", "manager", "member", "viewer"];
const EMPTY_CREATE: CreateDraft = { name: "", slug: "", legal_name: "", module_ids: ["leads", "tasks"] };

const VIEWS: { id: View; label: string; glyph: string }[] = [
  { id: "overview", label: "Overview", glyph: "◫" },
  { id: "access", label: "Access", glyph: "◎" },
  { id: "modules", label: "Modules", glyph: "⌘" },
  { id: "profile", label: "Profile", glyph: "◇" },
];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function parseObject(value: string) {
  const parsed = JSON.parse(value || "{}");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid JSON");
  return parsed as Record<string, unknown>;
}

function date(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(parsed);
}

export default function ControlCenterCompact() {
  const router = useRouter();
  const [payload, setPayload] = useState<ControlCenterPayload | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [view, setView] = useState<View>("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateDraft>(EMPTY_CREATE);
  const [profile, setProfile] = useState<ProfileDraft | null>(null);
  const [modules, setModules] = useState<ModuleDraft>({});
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<OrbyvenPlatformRole>("member");

  const token = useCallback(async () => {
    const { data } = await orbyvenSupabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      router.replace("/control-center/login");
      throw new Error("NO_SESSION");
    }
    return accessToken;
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
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
        current && data.organizations.some((organization) => organization.id === current)
          ? current
          : data.organizations[0]?.id ?? ""
      );
    } catch (reason) {
      if (reason instanceof Error && reason.message === "NO_SESSION") return;
      setError(reason instanceof Error ? reason.message : "Control Center unavailable");
    } finally {
      setLoading(false);
    }
  }, [router, token]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  const selected = useMemo(
    () => payload?.organizations.find((organization) => organization.id === selectedId) ?? null,
    [payload, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      setProfile(null);
      setModules({});
      return;
    }

    setProfile({
      name: selected.name,
      slug: selected.slug,
      legal_name: selected.legal_name ?? "",
      display_name: selected.profile?.display_name ?? selected.name,
      greeting_name: selected.profile?.greeting_name ?? "",
      logo_url: selected.profile?.logo_url ?? "",
      timezone: selected.profile?.timezone ?? "Europe/Bucharest",
      locale: selected.profile?.locale ?? "ro-RO",
      settings_text: JSON.stringify(selected.profile?.settings ?? {}, null, 2),
    });

    const next: ModuleDraft = {};
    for (const definition of OPTIONAL_MODULES) {
      const assignment = selected.modules.find((module) => module.module_id === definition.id);
      next[definition.id] = {
        enabled: assignment?.enabled ?? false,
        settings_text: JSON.stringify(assignment?.settings ?? {}, null, 2),
      };
    }
    setModules(next);
    setNewUserId("");
    setNewRole("member");
    setOpenModule(null);
  }, [selected]);

  const perform = async (action: Record<string, unknown>, success: string) => {
    setBusy(String(action.action ?? "action"));
    setError("");
    setNotice("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/control-center", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string; organization_id?: string };
      if (!response.ok) throw new Error(result.message ?? "Action failed");
      await load();
      if (result.organization_id) setSelectedId(result.organization_id);
      setNotice(success);
      window.setTimeout(() => setNotice(""), 1800);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed");
      return false;
    } finally {
      setBusy("");
    }
  };

  const createOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = await perform(
      {
        action: "create_organization",
        name: createDraft.name,
        slug: createDraft.slug,
        legal_name: createDraft.legal_name,
        display_name: createDraft.name,
        module_ids: createDraft.module_ids,
      },
      "Created"
    );
    if (ok) {
      setCreateDraft(EMPTY_CREATE);
      setCreateOpen(false);
    }
  };

  const saveProfile = async () => {
    if (!selected || !profile) return;
    try {
      await perform(
        {
          action: "update_organization",
          organization_id: selected.id,
          name: profile.name,
          slug: profile.slug,
          legal_name: profile.legal_name,
          display_name: profile.display_name,
          greeting_name: profile.greeting_name,
          logo_url: profile.logo_url,
          timezone: profile.timezone,
          locale: profile.locale,
          profile_settings: parseObject(profile.settings_text),
        },
        "Saved"
      );
    } catch {
      setError("Invalid profile JSON");
    }
  };

  const saveModules = async () => {
    if (!selected) return;
    try {
      await perform(
        {
          action: "set_modules",
          organization_id: selected.id,
          modules: OPTIONAL_MODULES.map((definition) => ({
            module_id: definition.id,
            enabled: modules[definition.id]?.enabled ?? false,
            settings: parseObject(modules[definition.id]?.settings_text ?? "{}"),
          })),
        },
        "Saved"
      );
    } catch {
      setError("Invalid module JSON");
    }
  };

  const availableUsers = useMemo(() => {
    if (!payload || !selected) return [];
    const assigned = new Set(selected.members.map((member) => member.user_id));
    return payload.auth_users.filter((user) => !assigned.has(user.id));
  }, [payload, selected]);

  const logout = async () => {
    await orbyvenSupabase.auth.signOut();
    router.replace("/control-center/login");
  };

  if (loading && !payload) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08080a] text-[#77777d]">
        <span className="h-5 w-5 animate-spin rounded-full border border-white/15 border-t-white" aria-label="Loading" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_60%_-20%,rgba(79,70,229,.13),transparent_34%),#08080a] pb-24 text-[#f5f5f7] antialiased">
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#09090b]/82 backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-[1720px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo compact theme="dark" />
            <span className="hidden h-5 w-px bg-white/[0.1] md:block" />
            <span className="hidden text-[11px] font-semibold tracking-[0.08em] text-[#797980] md:block">CONTROL</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void load()} className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.09] text-[#929299] transition hover:text-white" aria-label="Refresh" title="Refresh">↻</button>
            <button type="button" onClick={() => void logout()} className="h-9 rounded-full border border-white/[0.09] px-3 text-[11px] font-medium text-[#a5a5ab] transition hover:border-white/20 hover:text-white">Exit</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1720px] lg:grid-cols-[265px_minmax(0,1fr)]">
        <aside className="border-b border-white/[0.07] bg-black/10 px-4 py-5 lg:min-h-[calc(100vh-68px)] lg:border-b-0 lg:border-r lg:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f6f75]">
              <span>Tenants</span>
              <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[#9b9ba1]">{payload?.organizations.length ?? 0}</span>
            </div>
            <button type="button" onClick={() => setCreateOpen(true)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-lg text-black" aria-label="New tenant">+</button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-visible">
            {payload?.organizations.map((organization) => {
              const active = organization.id === selectedId;
              const healthy = organization.technical_status.state === "healthy";
              return (
                <button
                  key={organization.id}
                  type="button"
                  onClick={() => { setSelectedId(organization.id); setView("overview"); }}
                  className={`min-w-[190px] rounded-[16px] border px-3 py-3 text-left transition lg:w-full lg:min-w-0 ${active ? "border-white/[0.14] bg-white/[0.075]" : "border-transparent hover:bg-white/[0.04]"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${healthy ? "bg-emerald-400" : "bg-amber-300"}`} />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#dedee2]">{organization.profile?.display_name ?? organization.name}</span>
                    <span className="text-[9px] text-[#5f5f65]">{organization.technical_status.enabled_module_count}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 xl:px-10">
          {error && <Toast tone="error">{error}</Toast>}
          {notice && <Toast tone="ok">{notice}</Toast>}

          {!selected || !profile ? (
            <div className="grid min-h-[55vh] place-items-center text-sm text-[#6e6e74]">No tenant</div>
          ) : (
            <>
              <div className="flex flex-col gap-5 border-b border-white/[0.07] pb-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${selected.technical_status.state === "healthy" ? "bg-emerald-400" : "bg-amber-300"}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6f6f75]">{selected.slug}</span>
                  </div>
                  <h1 className="mt-2 truncate text-[34px] font-semibold leading-none tracking-[-0.055em] sm:text-[44px]">{selected.profile?.display_name ?? selected.name}</h1>
                </div>

                <div className="flex flex-wrap items-center gap-1 rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-1">
                  {VIEWS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setView(item.id)}
                      className={`flex h-9 items-center gap-2 rounded-[12px] px-3 text-[11px] font-medium transition ${view === item.id ? "bg-white text-black" : "text-[#88888f] hover:text-white"}`}
                    >
                      <span aria-hidden="true">{item.glyph}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {view === "overview" && <Overview organization={selected} onView={setView} />}

              {view === "access" && (
                <Panel title="Access" count={selected.members.length}>
                  <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_auto]">
                    <select value={newUserId} onChange={(event) => setNewUserId(event.target.value)} className={CONTROL}>
                      <option value="">User…</option>
                      {availableUsers.map((user) => <option key={user.id} value={user.id}>{user.email ?? user.id}</option>)}
                    </select>
                    <select value={newRole} onChange={(event) => setNewRole(event.target.value as OrbyvenPlatformRole)} className={CONTROL}>
                      {ROLES.map((role) => <option key={role}>{role}</option>)}
                    </select>
                    <button
                      type="button"
                      disabled={!newUserId || busy === "assign_member"}
                      onClick={() => void perform({ action: "assign_member", organization_id: selected.id, user_id: newUserId, role: newRole }, "Added").then((ok) => { if (ok) setNewUserId(""); })}
                      className={PRIMARY}
                    >
                      Add
                    </button>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[18px] border border-white/[0.07]">
                    {selected.members.map((member, index) => (
                      <div key={member.user_id} className={`grid items-center gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_150px_auto] ${index ? "border-t border-white/[0.06]" : ""}`}>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-[#dedee2]">{member.email ?? member.user_id}</p>
                          <p className="mt-0.5 truncate text-[9px] text-[#55555b]">{member.user_id}</p>
                        </div>
                        <select
                          value={member.role}
                          onChange={(event) => void perform({ action: "update_member_role", organization_id: selected.id, user_id: member.user_id, role: event.target.value as OrbyvenPlatformRole }, "Saved")}
                          className={CONTROL}
                        >
                          {ROLES.map((role) => <option key={role}>{role}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Remove user?")) void perform({ action: "remove_member", organization_id: selected.id, user_id: member.user_id }, "Removed");
                          }}
                          className="h-10 rounded-[12px] border border-rose-400/15 px-3 text-[10px] font-medium text-rose-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {selected.members.length === 0 && <div className="px-4 py-8 text-center text-xs text-[#64646a]">No users</div>}
                  </div>
                </Panel>
              )}

              {view === "modules" && (
                <Panel title="Modules" count={selected.technical_status.enabled_module_count}>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-[18px] border border-indigo-300/15 bg-indigo-400/[0.06] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold">Overview</span>
                        <span className="rounded-full bg-indigo-300/10 px-2 py-1 text-[9px] font-semibold text-indigo-200">CORE</span>
                      </div>
                    </div>
                    {OPTIONAL_MODULES.map((definition) => {
                      const draft = modules[definition.id] ?? { enabled: false, settings_text: "{}" };
                      const expanded = openModule === definition.id;
                      return (
                        <article key={definition.id} className={`rounded-[18px] border p-4 transition ${draft.enabled ? "border-white/[0.12] bg-white/[0.045]" : "border-white/[0.06] bg-white/[0.015]"}`}>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setModules((current) => ({ ...current, [definition.id]: { ...draft, enabled: !draft.enabled } }))}
                              className={`relative h-6 w-10 shrink-0 rounded-full transition ${draft.enabled ? "bg-indigo-500" : "bg-white/[0.1]"}`}
                              aria-label={`${definition.shortName} ${draft.enabled ? "on" : "off"}`}
                            >
                              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${draft.enabled ? "left-5" : "left-1"}`} />
                            </button>
                            <span className="min-w-0 flex-1 truncate text-xs font-semibold">{definition.shortName}</span>
                            <button type="button" onClick={() => setOpenModule(expanded ? null : definition.id)} className="grid h-7 w-7 place-items-center rounded-lg text-[#66666d] hover:bg-white/[0.05] hover:text-white" aria-label="Settings">•••</button>
                          </div>
                          {expanded && (
                            <textarea
                              rows={5}
                              value={draft.settings_text}
                              onChange={(event) => setModules((current) => ({ ...current, [definition.id]: { ...draft, settings_text: event.target.value } }))}
                              className="mt-3 w-full rounded-[12px] border border-white/[0.08] bg-black/40 p-3 font-mono text-[10px] leading-5 outline-none focus:border-indigo-400/50"
                              aria-label={`${definition.shortName} JSON`}
                            />
                          )}
                        </article>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => void saveModules()} disabled={busy === "set_modules"} className={`${PRIMARY} mt-4`}>Save</button>
                </Panel>
              )}

              {view === "profile" && (
                <Panel title="Profile">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Name" value={profile.name} onChange={(value) => setProfile({ ...profile, name: value })} />
                    <Field label="Slug" value={profile.slug} onChange={(value) => setProfile({ ...profile, slug: slugify(value) })} />
                    <Field label="Legal" value={profile.legal_name} onChange={(value) => setProfile({ ...profile, legal_name: value })} />
                    <Field label="Display" value={profile.display_name} onChange={(value) => setProfile({ ...profile, display_name: value })} />
                    <Field label="Greeting" value={profile.greeting_name} onChange={(value) => setProfile({ ...profile, greeting_name: value })} />
                    <Field label="Logo URL" value={profile.logo_url} onChange={(value) => setProfile({ ...profile, logo_url: value })} />
                    <Field label="Timezone" value={profile.timezone} onChange={(value) => setProfile({ ...profile, timezone: value })} />
                    <Field label="Locale" value={profile.locale} onChange={(value) => setProfile({ ...profile, locale: value })} />
                  </div>
                  <details className="mt-4 rounded-[16px] border border-white/[0.07] bg-black/20 p-4">
                    <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.12em] text-[#77777e]">Advanced JSON</summary>
                    <textarea value={profile.settings_text} onChange={(event) => setProfile({ ...profile, settings_text: event.target.value })} rows={7} className="mt-3 w-full rounded-[12px] border border-white/[0.08] bg-black/50 p-3 font-mono text-[10px] leading-5 outline-none focus:border-indigo-400/50" />
                  </details>
                  <button type="button" onClick={() => void saveProfile()} disabled={busy === "update_organization"} className={`${PRIMARY} mt-4`}>Save</button>
                </Panel>
              )}
            </>
          )}
        </section>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
          <form onSubmit={createOrganization} className="w-full max-w-md rounded-[26px] border border-white/[0.1] bg-[#111114] p-5 shadow-[0_30px_100px_rgba(0,0,0,.6)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-[-0.03em]">New tenant</h2>
              <button type="button" onClick={() => setCreateOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.05] text-[#88888f]">×</button>
            </div>
            <div className="mt-5 grid gap-3">
              <Field label="Name" value={createDraft.name} required onChange={(value) => setCreateDraft((current) => ({ ...current, name: value, slug: slugify(value) }))} />
              <Field label="Slug" value={createDraft.slug} required onChange={(value) => setCreateDraft((current) => ({ ...current, slug: slugify(value) }))} />
              <Field label="Legal" value={createDraft.legal_name} onChange={(value) => setCreateDraft((current) => ({ ...current, legal_name: value }))} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {OPTIONAL_MODULES.map((definition) => {
                const active = createDraft.module_ids.includes(definition.id);
                return (
                  <button key={definition.id} type="button" onClick={() => setCreateDraft((current) => ({ ...current, module_ids: active ? current.module_ids.filter((id) => id !== definition.id) : [...current.module_ids, definition.id] }))} className={`rounded-full border px-3 py-1.5 text-[10px] font-medium ${active ? "border-indigo-300/25 bg-indigo-400/[0.1] text-indigo-200" : "border-white/[0.08] text-[#77777d]"}`}>
                    {definition.shortName}
                  </button>
                );
              })}
            </div>
            <button type="submit" disabled={busy === "create_organization"} className={`${PRIMARY} mt-5 w-full`}>Create</button>
          </form>
        </div>
      )}
    </main>
  );
}

const CONTROL = "h-10 w-full rounded-[12px] border border-white/[0.08] bg-black/35 px-3 text-xs text-[#e5e5e8] outline-none focus:border-indigo-400/50";
const PRIMARY = "h-10 rounded-[12px] bg-white px-4 text-[11px] font-semibold text-black transition hover:bg-[#e8e8eb] disabled:opacity-45";

function Overview({ organization, onView }: { organization: ControlCenterOrganization; onView: (view: View) => void }) {
  const checks = organization.technical_status.checks;
  const score = [checks.profile, checks.owner, checks.members, true].filter(Boolean).length;
  const healthy = organization.technical_status.state === "healthy";

  return (
    <div className="mt-5 grid gap-4 2xl:grid-cols-[1.15fr_.85fr]">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-2">
        <Metric value={organization.technical_status.member_count} label="Users" onClick={() => onView("access")} />
        <Metric value={organization.technical_status.enabled_module_count} label="Modules" onClick={() => onView("modules")} />
        <Metric value={`${score}/4`} label="Health" tone={healthy ? "ok" : "warn"} />
        <Metric value={date(organization.technical_status.last_config_update)} label="Updated" small />
      </section>

      <section className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#6d6d74]">System</span>
          <a href="/workspace/login" target="_blank" rel="noreferrer" className="rounded-full border border-white/[0.09] px-3 py-1.5 text-[10px] font-medium text-[#a5a5ab] hover:text-white">Workspace ↗</a>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Check label="Profile" ok={checks.profile} />
          <Check label="Owner" ok={checks.owner} />
          <Check label="Members" ok={checks.members} />
          <Check label="RLS" ok />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4">
          <Mini label="Plan" value={organization.subscription.plan ?? "—"} />
          <Mini label="Sub" value={organization.subscription.subscription_status ?? "—"} />
          <Mini label="Rights" value={organization.subscription.entitlements ? "OK" : "—"} />
        </div>
      </section>
    </div>
  );
}

function Panel({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="mt-5 rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5 lg:p-6">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {typeof count === "number" && <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] text-[#77777d]">{count}</span>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Metric({ value, label, tone, small, onClick }: { value: string | number; label: string; tone?: "ok" | "warn"; small?: boolean; onClick?: () => void }) {
  const content = (
    <>
      <span className={`${small ? "text-lg" : "text-[30px]"} block truncate font-semibold tracking-[-0.05em] ${tone === "ok" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : "text-[#f1f1f3]"}`}>{value}</span>
      <span className="mt-2 block text-[9px] font-semibold uppercase tracking-[0.13em] text-[#66666d]">{label}</span>
    </>
  );
  if (onClick) return <button type="button" onClick={onClick} className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4 text-left transition hover:border-white/[0.14] hover:bg-white/[0.04]">{content}</button>;
  return <article className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4">{content}</article>;
}

function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-[13px] bg-black/25 px-3 py-2.5">
      <span className="text-[10px] text-[#8a8a90]">{label}</span>
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-300"}`} aria-label={ok ? "ok" : "attention"} />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#55555b]">{label}</p>
      <p className="mt-1 truncate text-[10px] font-medium text-[#aaaab0]">{value}</p>
    </div>
  );
}

function Field({ label, value, required, onChange }: { label: string; value: string; required?: boolean; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.11em] text-[#696970]">{label}</span>
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} className={CONTROL} />
    </label>
  );
}

function Toast({ tone, children }: { tone: "ok" | "error"; children: ReactNode }) {
  return (
    <div className={`fixed right-4 top-20 z-[110] rounded-[14px] border px-4 py-3 text-xs shadow-2xl backdrop-blur-xl ${tone === "ok" ? "border-emerald-400/20 bg-emerald-950/80 text-emerald-200" : "border-rose-400/20 bg-rose-950/80 text-rose-200"}`}>
      {children}
    </div>
  );
}
