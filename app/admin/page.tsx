"use client";

import BrandLogo from "@/components/BrandLogo";
import { orbitaSupabase } from "@/lib/orbita-supabase";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

type Theme = "light" | "dark";
type LeadStatus = "new" | "contacted" | "won" | "lost";

type Lead = {
  id: number;
  name: string;
  email: string;
  project_type: string;
  budget: string;
  message: string;
  status: LeadStatus;
  created_at: string;
};

const labels: Record<LeadStatus, string> = {
  new: "Nou",
  contacted: "Contactat",
  won: "Câștigat",
  lost: "Pierdut",
};

export default function AdminPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("light");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    const { data: authData, error: authError } =
      await orbitaSupabase.auth.getUser();

    if (authError || !authData.user) {
      router.replace("/admin/login");
      return;
    }

    const { data, error } = await orbitaSupabase
      .from("leads")
      .select("id,name,email,project_type,budget,message,status,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoadError("Nu am putut încărca cererile. Verifică politicile RLS.");
      setLoading(false);
      return;
    }

    setLeads((data ?? []) as Lead[]);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const saved = window.localStorage.getItem("studio-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme: Theme =
      saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";

    setTheme(initialTheme);
    document.documentElement.style.colorScheme = initialTheme;
    loadLeads();
  }, [loadLeads]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      return next;
    });
  };

  const updateStatus = async (id: number, status: LeadStatus) => {
    setUpdatingId(id);

    const { error } = await orbitaSupabase
      .from("leads")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("Statusul nu a putut fi actualizat.");
      setUpdatingId(null);
      return;
    }

    setLeads((current) =>
      current.map((lead) => (lead.id === id ? { ...lead, status } : lead))
    );
    setUpdatingId(null);
  };

  const logout = async () => {
    await orbitaSupabase.auth.signOut();
    router.replace("/admin/login");
  };

  const counts = useMemo(
    () => ({
      all: leads.length,
      new: leads.filter((x) => x.status === "new").length,
      contacted: leads.filter((x) => x.status === "contacted").length,
      won: leads.filter((x) => x.status === "won").length,
    }),
    [leads]
  );

  const visibleLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const statusOk = statusFilter === "all" || lead.status === statusFilter;
      const searchOk =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.project_type.toLowerCase().includes(q);
      return statusOk && searchOk;
    });
  }, [leads, search, statusFilter]);

  const vars = {
    "--bg": theme === "dark" ? "#000000" : "#ffffff",
    "--surface": theme === "dark" ? "#111113" : "#f5f5f7",
    "--surface-2": theme === "dark" ? "#1c1c1e" : "#fbfbfd",
    "--text": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--muted": theme === "dark" ? "#a1a1a6" : "#6e6e73",
    "--muted-2": theme === "dark" ? "#8e8e93" : "#86868b",
    "--border": theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-soft": theme === "dark" ? "rgba(75,70,238,0.18)" : "rgba(75,70,238,0.08)",
  } as CSSProperties;

  return (
    <main
      style={{
        ...vars,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased transition-colors duration-300"
    >
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:var(--bg)]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-4">
            <BrandLogo compact />
            <span className="hidden text-xs font-medium text-[var(--muted)] sm:block">
              Admin
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)]"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>

            <button
              type="button"
              onClick={logout}
              className="h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-12 md:px-10 md:py-16">
        <section className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted-2)]">
              ORBITA CREATIVE · LEADS
            </p>
            <h1 className="mt-5 text-[48px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[62px] md:text-[72px]">
              Cererile tale.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-[var(--muted)]">
              Urmărește cererile primite, contactează clienții și actualizează statusul.
            </p>
          </div>

          <button
            type="button"
            onClick={loadLeads}
            className="h-11 self-start rounded-full bg-[var(--button)] px-5 text-sm font-medium text-[var(--button-text)]"
          >
            Reîmprospătează
          </button>
        </section>

        <section className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total cereri" value={counts.all} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
          <Metric label="Noi" value={counts.new} active={statusFilter === "new"} onClick={() => setStatusFilter("new")} />
          <Metric label="Contactate" value={counts.contacted} active={statusFilter === "contacted"} onClick={() => setStatusFilter("contacted")} />
          <Metric label="Câștigate" value={counts.won} active={statusFilter === "won"} onClick={() => setStatusFilter("won")} />
        </section>

        <section className="mt-8 flex flex-col gap-3 rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută după nume, email sau tip proiect..."
            className="h-12 flex-1 rounded-[18px] bg-[var(--bg)] px-4 text-sm outline-none focus:ring-4 focus:ring-[var(--accent-soft)]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")}
            className="h-12 rounded-[18px] bg-[var(--bg)] px-4 text-sm outline-none"
          >
            <option value="all">Toate statusurile</option>
            <option value="new">Noi</option>
            <option value="contacted">Contactate</option>
            <option value="won">Câștigate</option>
            <option value="lost">Pierdute</option>
          </select>
        </section>

        <section className="mt-6">
          {loading ? (
            <div className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
              Se încarcă cererile...
            </div>
          ) : loadError ? (
            <div className="rounded-[30px] border border-red-500/20 bg-red-500/[0.06] p-8 text-sm text-red-500">
              {loadError}
            </div>
          ) : visibleLeads.length === 0 ? (
            <div className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
              Nicio cerere aici.
            </div>
          ) : (
            <div className="space-y-4">
              {visibleLeads.map((lead) => (
                <article
                  key={lead.id}
                  className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)]"
                >
                  <div className="grid xl:grid-cols-[0.8fr_1.2fr]">
                    <div className="border-b border-[var(--border)] p-6 md:p-8 xl:border-b-0 xl:border-r">
                      <span className="inline-flex rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-semibold">
                        {labels[lead.status]}
                      </span>

                      <h2 className="mt-5 text-[30px] font-semibold tracking-[-0.04em]">
                        {lead.name}
                      </h2>

                      <a href={`mailto:${lead.email}`} className="mt-2 inline-block text-sm text-[var(--muted)]">
                        {lead.email}
                      </a>

                      <div className="mt-8 space-y-3 text-xs">
                        <div className="flex justify-between gap-5">
                          <span className="text-[var(--muted)]">Proiect</span>
                          <span className="text-right font-medium">{lead.project_type}</span>
                        </div>
                        <div className="flex justify-between gap-5">
                          <span className="text-[var(--muted)]">Buget</span>
                          <span className="text-right font-medium">{lead.budget}</span>
                        </div>
                        <div className="flex justify-between gap-5">
                          <span className="text-[var(--muted)]">Primit</span>
                          <span className="text-right font-medium">
                            {new Intl.DateTimeFormat("ro-RO", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(lead.created_at))}
                          </span>
                        </div>
                      </div>

                      <select
                        value={lead.status}
                        disabled={updatingId === lead.id}
                        onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                        className="mt-7 h-11 w-full rounded-[16px] border border-[var(--border)] bg-[var(--bg)] px-3 text-sm outline-none disabled:opacity-60"
                      >
                        <option value="new">Nou</option>
                        <option value="contacted">Contactat</option>
                        <option value="won">Câștigat</option>
                        <option value="lost">Pierdut</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-between p-6 md:p-8">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">
                          Mesaj
                        </p>
                        <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7">
                          {lead.message}
                        </p>
                      </div>

                      <a
                        href={`mailto:${lead.email}?subject=${encodeURIComponent(`ORBITA CREATIVE — ${lead.project_type}`)}`}
                        className="mt-10 inline-flex h-11 self-start items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-medium text-[var(--button-text)]"
                      >
                        Trimite email
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[26px] border p-6 text-left ${
        active
          ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <p className={`text-xs font-medium ${active ? "opacity-60" : "text-[var(--muted)]"}`}>
        {label}
      </p>
      <p className="mt-6 text-[42px] font-semibold leading-none tracking-[-0.05em]">
        {value}
      </p>
    </button>
  );
}
