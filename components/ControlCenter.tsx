"use client";

import BrandLogo from "@/components/BrandLogo";
import {
  ORBYVEN_MODULES,
  type OrbyvenModuleId,
} from "@/lib/orbyven-modules";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type {
  ControlCenterOrganization,
  ControlCenterPayload,
  OrbyvenPlatformRole,
} from "@/lib/orbyven-control-center-contracts";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

const OPTIONAL_MODULES = ORBYVEN_MODULES.filter(
  (module) => module.id !== "overview"
);

const ROLE_OPTIONS: OrbyvenPlatformRole[] = [
  "owner",
  "admin",
  "manager",
  "member",
  "viewer",
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

function parseJsonObject(value: string, label: string) {
  try {
    const parsed = JSON.parse(value || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`${label} trebuie să fie un obiect JSON valid.`);
  }
}

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

type ModuleDraft = Record<
  string,
  { enabled: boolean; settings_text: string }
>;

type CreateDraft = {
  name: string;
  slug: string;
  legal_name: string;
  module_ids: OrbyvenModuleId[];
};

const EMPTY_CREATE: CreateDraft = {
  name: "",
  slug: "",
  legal_name: "",
  module_ids: ["leads", "tasks"],
};

export default function ControlCenter() {
  const router = useRouter();
  const [payload, setPayload] = useState<ControlCenterPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [createDraft, setCreateDraft] = useState<CreateDraft>(EMPTY_CREATE);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null);
  const [moduleDraft, setModuleDraft] = useState<ModuleDraft>({});
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState<OrbyvenPlatformRole>("member");

  const getAccessToken = useCallback(async () => {
    const { data } = await orbyvenSupabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.replace("/control-center/login");
      throw new Error("Missing session");
    }
    return token;
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const token = await getAccessToken();
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
        throw new Error(data.message ?? "Control Center nu a putut fi încărcat.");
      }

      setPayload(data);
      setSelectedOrganizationId((current) =>
        current && data.organizations.some((organization) => organization.id === current)
          ? current
          : data.organizations[0]?.id ?? ""
      );
    } catch (error) {
      if (error instanceof Error && error.message === "Missing session") return;
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Control Center nu a putut fi încărcat."
      );
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedOrganization = useMemo(
    () =>
      payload?.organizations.find(
        (organization) => organization.id === selectedOrganizationId
      ) ?? null,
    [payload, selectedOrganizationId]
  );

  useEffect(() => {
    if (!selectedOrganization) {
      setProfileDraft(null);
      setModuleDraft({});
      return;
    }

    setProfileDraft({
      name: selectedOrganization.name,
      slug: selectedOrganization.slug,
      legal_name: selectedOrganization.legal_name ?? "",
      display_name:
        selectedOrganization.profile?.display_name ?? selectedOrganization.name,
      greeting_name: selectedOrganization.profile?.greeting_name ?? "",
      logo_url: selectedOrganization.profile?.logo_url ?? "",
      timezone: selectedOrganization.profile?.timezone ?? "Europe/Bucharest",
      locale: selectedOrganization.profile?.locale ?? "ro-RO",
      settings_text: JSON.stringify(
        selectedOrganization.profile?.settings ?? {},
        null,
        2
      ),
    });

    const nextModules: ModuleDraft = {};
    for (const definition of OPTIONAL_MODULES) {
      const assignment = selectedOrganization.modules.find(
        (module) => module.module_id === definition.id
      );
      nextModules[definition.id] = {
        enabled: assignment?.enabled ?? false,
        settings_text: JSON.stringify(assignment?.settings ?? {}, null, 2),
      };
    }
    setModuleDraft(nextModules);
    setMemberUserId("");
    setMemberRole("member");
  }, [selectedOrganization]);

  const performAction = async (
    action: Record<string, unknown>,
    successMessage: string
  ) => {
    setBusyAction(String(action.action ?? "action"));
    setActionMessage("");
    setErrorMessage("");

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/control-center", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(action),
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        organization_id?: string;
      };

      if (!response.ok) {
        throw new Error(result.message ?? "Operația nu a putut fi finalizată.");
      }

      await load();
      if (result.organization_id) {
        setSelectedOrganizationId(result.organization_id);
      }
      setActionMessage(successMessage);
      return true;
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Operația a eșuat."
      );
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const createOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await performAction(
      {
        action: "create_organization",
        name: createDraft.name,
        slug: createDraft.slug,
        legal_name: createDraft.legal_name,
        display_name: createDraft.name,
        module_ids: createDraft.module_ids,
      },
      "Organizația a fost creată."
    );

    if (success) {
      setCreateDraft(EMPTY_CREATE);
      setShowCreate(false);
    }
  };

  const saveProfile = async () => {
    if (!selectedOrganization || !profileDraft) return;

    let settings: Record<string, unknown>;
    try {
      settings = parseJsonObject(profileDraft.settings_text, "Profile settings");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "JSON invalid.");
      return;
    }

    await performAction(
      {
        action: "update_organization",
        organization_id: selectedOrganization.id,
        name: profileDraft.name,
        slug: profileDraft.slug,
        legal_name: profileDraft.legal_name,
        display_name: profileDraft.display_name,
        greeting_name: profileDraft.greeting_name,
        logo_url: profileDraft.logo_url,
        timezone: profileDraft.timezone,
        locale: profileDraft.locale,
        profile_settings: settings,
      },
      "Profilul organizației a fost salvat."
    );
  };

  const saveModules = async () => {
    if (!selectedOrganization) return;

    try {
      const modules = OPTIONAL_MODULES.map((definition) => ({
        module_id: definition.id,
        enabled: moduleDraft[definition.id]?.enabled ?? false,
        settings: parseJsonObject(
          moduleDraft[definition.id]?.settings_text ?? "{}",
          `Config ${definition.shortName}`
        ),
      }));

      await performAction(
        {
          action: "set_modules",
          organization_id: selectedOrganization.id,
          modules,
        },
        "Modulele au fost actualizate."
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Config JSON invalid.");
    }
  };

  const assignMember = async () => {
    if (!selectedOrganization || !memberUserId) return;
    const success = await performAction(
      {
        action: "assign_member",
        organization_id: selectedOrganization.id,
        user_id: memberUserId,
        role: memberRole,
      },
      "Utilizatorul a fost atribuit organizației."
    );
    if (success) setMemberUserId("");
  };

  const updateMemberRole = async (userId: string, role: OrbyvenPlatformRole) => {
    if (!selectedOrganization) return;
    await performAction(
      {
        action: "update_member_role",
        organization_id: selectedOrganization.id,
        user_id: userId,
        role,
      },
      "Rolul a fost actualizat."
    );
  };

  const removeMember = async (userId: string) => {
    if (!selectedOrganization) return;
    if (!window.confirm("Elimini utilizatorul din această organizație?")) return;

    await performAction(
      {
        action: "remove_member",
        organization_id: selectedOrganization.id,
        user_id: userId,
      },
      "Utilizatorul a fost eliminat."
    );
  };

  const logout = async () => {
    await orbyvenSupabase.auth.signOut();
    router.replace("/control-center/login");
  };

  const availableUsers = useMemo(() => {
    if (!payload || !selectedOrganization) return [];
    const assigned = new Set(selectedOrganization.members.map((member) => member.user_id));
    return payload.auth_users.filter((user) => !assigned.has(user.id));
  }, [payload, selectedOrganization]);

  if (loading && !payload) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090a] text-sm text-[#a1a1a6]">
        Se deschide ORBYVEN Control Center...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090a] text-[#f5f5f7] antialiased">
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#09090a]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1680px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-4">
            <BrandLogo compact theme="dark" />
            <div className="hidden h-6 w-px bg-white/[0.1] md:block" />
            <div>
              <p className="text-xs font-semibold">Control Center</p>
              <p className="hidden text-[10px] text-[#86868b] sm:block">
                Platform Core · Internal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="h-10 rounded-full border border-white/[0.12] px-4 text-xs font-medium text-[#d2d2d7]"
            >
              Reîncarcă
            </button>
            <button
              type="button"
              onClick={logout}
              className="h-10 rounded-full bg-white px-4 text-xs font-semibold text-black"
            >
              Ieșire
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-white/[0.08] bg-[#0d0d0f] p-5 lg:min-h-[calc(100vh-72px)] lg:border-b-0 lg:border-r lg:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
                Organizații
              </p>
              <p className="mt-1 text-sm text-[#a1a1a6]">
                {payload?.organizations.length ?? 0} tenant-uri
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate((current) => !current)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-black"
              aria-label="Creează organizație"
            >
              +
            </button>
          </div>

          {showCreate && (
            <form
              onSubmit={createOrganization}
              className="mt-5 rounded-[22px] border border-white/[0.1] bg-[#151517] p-4"
            >
              <p className="text-xs font-semibold">Organizație nouă</p>
              <input
                required
                value={createDraft.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setCreateDraft((current) => ({
                    ...current,
                    name,
                    slug: slugify(name),
                  }));
                }}
                placeholder="Nume companie"
                className="mt-4 h-11 w-full rounded-[14px] border border-white/[0.1] bg-black px-3 text-sm outline-none focus:border-[#6d68ff]"
              />
              <input
                required
                value={createDraft.slug}
                onChange={(event) =>
                  setCreateDraft((current) => ({
                    ...current,
                    slug: slugify(event.target.value),
                  }))
                }
                placeholder="slug-companie"
                className="mt-2 h-11 w-full rounded-[14px] border border-white/[0.1] bg-black px-3 text-sm outline-none focus:border-[#6d68ff]"
              />
              <input
                value={createDraft.legal_name}
                onChange={(event) =>
                  setCreateDraft((current) => ({
                    ...current,
                    legal_name: event.target.value,
                  }))
                }
                placeholder="Denumire legală (opțional)"
                className="mt-2 h-11 w-full rounded-[14px] border border-white/[0.1] bg-black px-3 text-sm outline-none focus:border-[#6d68ff]"
              />

              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">
                  Module inițiale
                </p>
                {OPTIONAL_MODULES.map((module) => {
                  const checked = createDraft.module_ids.includes(module.id);
                  return (
                    <label
                      key={module.id}
                      className="flex cursor-pointer items-center justify-between rounded-[12px] bg-black/40 px-3 py-2 text-xs"
                    >
                      <span>{module.shortName}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setCreateDraft((current) => ({
                            ...current,
                            module_ids: checked
                              ? current.module_ids.filter((id) => id !== module.id)
                              : [...current.module_ids, module.id],
                          }))
                        }
                      />
                    </label>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={busyAction === "create_organization"}
                className="mt-4 h-10 w-full rounded-full bg-white text-xs font-semibold text-black disabled:opacity-60"
              >
                Creează
              </button>
            </form>
          )}

          <div className="mt-5 space-y-2 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1">
            {payload?.organizations.map((organization) => {
              const active = organization.id === selectedOrganizationId;
              return (
                <button
                  key={organization.id}
                  type="button"
                  onClick={() => setSelectedOrganizationId(organization.id)}
                  className={`w-full rounded-[18px] border p-4 text-left transition ${
                    active
                      ? "border-[#6d68ff]/50 bg-[#4b46ee]/15"
                      : "border-white/[0.08] bg-[#111113] hover:border-white/[0.16]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {organization.profile?.display_name ?? organization.name}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-[#86868b]">
                        {organization.slug}
                      </p>
                    </div>
                    <span
                      className={`mt-1 h-2.5 w-2.5 rounded-full ${
                        organization.technical_status.state === "healthy"
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                      }`}
                    />
                  </div>
                  <div className="mt-3 flex gap-3 text-[10px] text-[#a1a1a6]">
                    <span>{organization.members.length} useri</span>
                    <span>·</span>
                    <span>
                      {organization.technical_status.enabled_module_count} module
                    </span>
                  </div>
                </button>
              );
            })}

            {payload?.organizations.length === 0 && (
              <div className="rounded-[18px] border border-dashed border-white/[0.12] p-5 text-xs leading-5 text-[#86868b]">
                Nu există încă organizații. Creează primul tenant ORBYVEN din butonul +.
              </div>
            )}
          </div>
        </aside>

        <section className="min-w-0 p-5 md:p-8 xl:p-10">
          {errorMessage && (
            <div className="mb-5 rounded-[18px] border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}
          {actionMessage && (
            <div className="mb-5 rounded-[18px] border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
              {actionMessage}
            </div>
          )}

          {!selectedOrganization || !profileDraft ? (
            <EmptyControlCenter />
          ) : (
            <div className="space-y-6">
              <section className="flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-8 xl:flex-row xl:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#86868b]">
                    Tenant · {selectedOrganization.id.slice(0, 8)}
                  </p>
                  <h1 className="mt-4 text-[44px] font-semibold leading-none tracking-[-0.055em] sm:text-[58px]">
                    {selectedOrganization.profile?.display_name ?? selectedOrganization.name}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-[#a1a1a6]">
                    Platform Core: identitate, acces, module și sănătatea tehnică a clientului.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <StatusPill organization={selectedOrganization} />
                  <a
                    href="/workspace/login"
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 rounded-full border border-white/[0.12] px-4 text-xs font-medium leading-10 text-[#d2d2d7]"
                  >
                    Client login ↗
                  </a>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label="Utilizatori"
                  value={String(selectedOrganization.technical_status.member_count)}
                  note="membership-uri"
                />
                <Metric
                  label="Module active"
                  value={String(selectedOrganization.technical_status.enabled_module_count)}
                  note="+ Overview Core"
                />
                <Metric
                  label="Owner"
                  value={selectedOrganization.technical_status.checks.owner ? "OK" : "Lipsă"}
                  note="acces principal"
                />
                <Metric
                  label="Profil"
                  value={selectedOrganization.technical_status.checks.profile ? "OK" : "Lipsă"}
                  note="workspace config"
                />
              </section>

              <section className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
                <Card title="Profil organizație" eyebrow="IDENTITATE">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Nume"
                      value={profileDraft.name}
                      onChange={(value) =>
                        setProfileDraft((current) =>
                          current ? { ...current, name: value } : current
                        )
                      }
                    />
                    <Field
                      label="Slug"
                      value={profileDraft.slug}
                      onChange={(value) =>
                        setProfileDraft((current) =>
                          current ? { ...current, slug: slugify(value) } : current
                        )
                      }
                    />
                    <Field
                      label="Denumire legală"
                      value={profileDraft.legal_name}
                      onChange={(value) =>
                        setProfileDraft((current) =>
                          current ? { ...current, legal_name: value } : current
                        )
                      }
                    />
                    <Field
                      label="Display name"
                      value={profileDraft.display_name}
                      onChange={(value) =>
                        setProfileDraft((current) =>
                          current ? { ...current, display_name: value } : current
                        )
                      }
                    />
                    <Field
                      label="Greeting name"
                      value={profileDraft.greeting_name}
                      onChange={(value) =>
                        setProfileDraft((current) =>
                          current ? { ...current, greeting_name: value } : current
                        )
                      }
                    />
                    <Field
                      label="Logo URL"
                      value={profileDraft.logo_url}
                      onChange={(value) =>
                        setProfileDraft((current) =>
                          current ? { ...current, logo_url: value } : current
                        )
                      }
                    />
                    <Field
                      label="Timezone"
                      value={profileDraft.timezone}
                      onChange={(value) =>
                        setProfileDraft((current) =>
                          current ? { ...current, timezone: value } : current
                        )
                      }
                    />
                    <Field
                      label="Locale"
                      value={profileDraft.locale}
                      onChange={(value) =>
                        setProfileDraft((current) =>
                          current ? { ...current, locale: value } : current
                        )
                      }
                    />
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">
                      Profile settings JSON
                    </span>
                    <textarea
                      value={profileDraft.settings_text}
                      onChange={(event) =>
                        setProfileDraft((current) =>
                          current
                            ? { ...current, settings_text: event.target.value }
                            : current
                        )
                      }
                      rows={5}
                      className="w-full rounded-[16px] border border-white/[0.1] bg-black p-3 font-mono text-xs leading-5 outline-none focus:border-[#6d68ff]"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void saveProfile()}
                    disabled={busyAction === "update_organization"}
                    className="mt-5 h-10 rounded-full bg-white px-5 text-xs font-semibold text-black disabled:opacity-60"
                  >
                    Salvează profilul
                  </button>
                </Card>

                <Card title="Stare tehnică" eyebrow="CLIENT HEALTH">
                  <div className="space-y-3">
                    <HealthRow
                      label="Profil configurat"
                      ok={selectedOrganization.technical_status.checks.profile}
                    />
                    <HealthRow
                      label="Cel puțin un owner"
                      ok={selectedOrganization.technical_status.checks.owner}
                    />
                    <HealthRow
                      label="Utilizatori atribuiți"
                      ok={selectedOrganization.technical_status.checks.members}
                    />
                    <HealthRow label="RLS tenant model" ok />
                    <HealthRow label="Workspace route" ok />
                  </div>

                  <div className="mt-6 rounded-[18px] bg-black/40 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">
                      Ultima configurație
                    </p>
                    <p className="mt-2 text-sm">
                      {selectedOrganization.technical_status.last_config_update
                        ? new Intl.DateTimeFormat("ro-RO", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(
                            new Date(
                              selectedOrganization.technical_status.last_config_update
                            )
                          )
                        : "—"}
                    </p>
                  </div>

                  <div className="mt-4 rounded-[18px] border border-[#6d68ff]/20 bg-[#4b46ee]/10 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9f9cff]">
                      Chat 3 contract
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <ContractValue
                        label="subscription"
                        value={
                          selectedOrganization.subscription.subscription_status ??
                          "pending"
                        }
                      />
                      <ContractValue
                        label="plan"
                        value={selectedOrganization.subscription.plan ?? "pending"}
                      />
                      <ContractValue
                        label="entitlements"
                        value={
                          selectedOrganization.subscription.entitlements
                            ? "loaded"
                            : "pending"
                        }
                      />
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-[#a1a1a6]">
                      Control Center nu implementează billing. Aceste valori vor fi furnizate de Chat 3.
                    </p>
                  </div>
                </Card>
              </section>

              <Card title="Utilizatori & roluri" eyebrow="ACCESS CONTROL">
                <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
                  <select
                    value={memberUserId}
                    onChange={(event) => setMemberUserId(event.target.value)}
                    className="h-11 rounded-[14px] border border-white/[0.1] bg-black px-3 text-sm outline-none"
                  >
                    <option value="">Alege user Supabase Auth...</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email ?? user.id}
                      </option>
                    ))}
                  </select>
                  <select
                    value={memberRole}
                    onChange={(event) =>
                      setMemberRole(event.target.value as OrbyvenPlatformRole)
                    }
                    className="h-11 rounded-[14px] border border-white/[0.1] bg-black px-3 text-sm outline-none"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void assignMember()}
                    disabled={!memberUserId || busyAction === "assign_member"}
                    className="h-11 rounded-full bg-white px-5 text-xs font-semibold text-black disabled:opacity-40"
                  >
                    Atribuie
                  </button>
                </div>

                {availableUsers.length === 0 && (
                  <p className="mt-3 text-xs text-[#86868b]">
                    Toți utilizatorii Auth disponibili sunt deja atribuiți acestei firme. Crearea/invitarea conturilor Auth rămâne separată de atribuirea tenantului.
                  </p>
                )}

                <div className="mt-5 overflow-hidden rounded-[18px] border border-white/[0.08]">
                  {selectedOrganization.members.length === 0 ? (
                    <div className="p-5 text-sm text-[#86868b]">
                      Niciun utilizator atribuit.
                    </div>
                  ) : (
                    selectedOrganization.members.map((member, index) => (
                      <div
                        key={member.user_id}
                        className={`grid items-center gap-3 p-4 md:grid-cols-[1fr_180px_auto] ${
                          index > 0 ? "border-t border-white/[0.08]" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {member.email ?? member.user_id}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-[#86868b]">
                            {member.user_id}
                          </p>
                        </div>
                        <select
                          value={member.role}
                          onChange={(event) =>
                            void updateMemberRole(
                              member.user_id,
                              event.target.value as OrbyvenPlatformRole
                            )
                          }
                          className="h-10 rounded-[13px] border border-white/[0.1] bg-black px-3 text-xs outline-none"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => void removeMember(member.user_id)}
                          className="h-9 rounded-full border border-red-400/20 px-4 text-xs text-red-300"
                        >
                          Elimină
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card title="Module" eyebrow="PORTABLE MODULE ASSIGNMENTS">
                <div className="rounded-[18px] border border-[#6d68ff]/20 bg-[#4b46ee]/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Overview</p>
                      <p className="mt-1 text-xs text-[#a1a1a6]">
                        ORBYVEN Core · disponibil implicit tuturor workspace-urilor.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#6d68ff]/20 px-3 py-1 text-[10px] font-semibold text-[#c3c1ff]">
                      CORE
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  {OPTIONAL_MODULES.map((module) => {
                    const draft = moduleDraft[module.id] ?? {
                      enabled: false,
                      settings_text: "{}",
                    };
                    return (
                      <article
                        key={module.id}
                        className="rounded-[20px] border border-white/[0.08] bg-[#111113] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold">{module.name}</p>
                            <p className="mt-1 text-xs leading-5 text-[#86868b]">
                              {module.description}
                            </p>
                          </div>
                          <label className="flex items-center gap-2 text-xs text-[#a1a1a6]">
                            <input
                              type="checkbox"
                              checked={draft.enabled}
                              onChange={(event) =>
                                setModuleDraft((current) => ({
                                  ...current,
                                  [module.id]: {
                                    ...draft,
                                    enabled: event.target.checked,
                                  },
                                }))
                              }
                            />
                            Activ
                          </label>
                        </div>
                        <textarea
                          rows={4}
                          value={draft.settings_text}
                          onChange={(event) =>
                            setModuleDraft((current) => ({
                              ...current,
                              [module.id]: {
                                ...draft,
                                settings_text: event.target.value,
                              },
                            }))
                          }
                          aria-label={`${module.shortName} settings JSON`}
                          className="mt-4 w-full rounded-[14px] border border-white/[0.08] bg-black p-3 font-mono text-[11px] leading-5 text-[#d2d2d7] outline-none focus:border-[#6d68ff]"
                        />
                      </article>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => void saveModules()}
                  disabled={busyAction === "set_modules"}
                  className="mt-5 h-10 rounded-full bg-white px-5 text-xs font-semibold text-black disabled:opacity-60"
                >
                  Salvează modulele
                </button>
              </Card>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyControlCenter() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#86868b]">
          ORBYVEN CONTROL CENTER
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
          Selectează un tenant.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#a1a1a6]">
          Alege o organizație din stânga sau creează una nouă.
        </p>
      </div>
    </div>
  );
}

function Card({
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
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868b]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-[14px] border border-white/[0.1] bg-black px-3 text-sm outline-none focus:border-[#6d68ff]"
      />
    </label>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-[20px] border border-white/[0.08] bg-[#0f0f11] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-2 text-xs text-[#86868b]">{note}</p>
    </article>
  );
}

function HealthRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-[15px] bg-black/40 px-4 py-3 text-sm">
      <span className="text-[#d2d2d7]">{label}</span>
      <span className={ok ? "text-emerald-300" : "text-amber-300"}>
        {ok ? "OK" : "Atenție"}
      </span>
    </div>
  );
}

function StatusPill({ organization }: { organization: ControlCenterOrganization }) {
  const healthy = organization.technical_status.state === "healthy";
  return (
    <span
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-semibold ${
        healthy
          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
          : "border-amber-400/20 bg-amber-400/[0.08] text-amber-200"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${healthy ? "bg-emerald-400" : "bg-amber-400"}`}
      />
      {healthy ? "Healthy" : "Needs attention"}
    </span>
  );
}

function ContractValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-black/30 p-2">
      <p className="truncate text-[9px] uppercase text-[#86868b]">{label}</p>
      <p className="mt-1 truncate font-medium text-[#d2d2d7]">{value}</p>
    </div>
  );
}
