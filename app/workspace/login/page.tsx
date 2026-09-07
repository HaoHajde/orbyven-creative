"use client";

import BrandLogo from "@/components/BrandLogo";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { getWorkspaceEntryPath } from "@/lib/orbyven-workspace";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";

type Theme = "light" | "dark";

export default function WorkspaceLoginPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("light");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("studio-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme: Theme =
      saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";

    document.documentElement.style.colorScheme = initialTheme;
    const themeTimer = window.setTimeout(() => setTheme(initialTheme), 0);

    const checkUser = async () => {
      try {
        const destination = await getWorkspaceEntryPath();
        if (destination !== "/workspace/login") router.replace(destination);
      } catch (error) {
        console.error(error);
      }
    };

    void checkUser();
    return () => window.clearTimeout(themeTimer);
  }, [router]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { error } = await orbyvenSupabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setErrorMessage("Email sau parolă incorectă.");
      setLoading(false);
      return;
    }

    try {
      const destination = await getWorkspaceEntryPath();
      router.replace(destination === "/workspace/login" ? "/workspace" : destination);
      router.refresh();
    } catch (routeError) {
      console.error(routeError);
      router.replace("/workspace");
      router.refresh();
    }
  };

  const vars = {
    "--bg": theme === "dark" ? "#09090a" : "#ffffff",
    "--surface": theme === "dark" ? "#111113" : "#f5f5f7",
    "--text": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--muted": theme === "dark" ? "#a1a1a6" : "#6e6e73",
    "--muted-2": theme === "dark" ? "#85858a" : "#86868b",
    "--border":
      theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-soft":
      theme === "dark" ? "rgba(75,70,238,0.20)" : "rgba(75,70,238,0.08)",
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
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-6 py-6 md:px-10">
        <header className="flex items-center justify-between">
          <BrandLogo compact theme={theme} />

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Schimbă tema"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)]"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </header>

        <section className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                ORBYVEN · WORKSPACE
              </p>
              <h1 className="mt-5 text-[46px] font-semibold leading-[1] tracking-[-0.055em] sm:text-[54px]">
                Businessul tău. Simplu.
              </h1>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[var(--muted)]">
                Intră în spațiul firmei tale. Vezi doar instrumentele pe care le folosești.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.05)] sm:p-8"
            >
              <label className="block">
                <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Email
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="nume@firma.ro"
                  className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--bg)] px-4 py-4 text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Parolă
                </span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--bg)] px-4 py-4 text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </label>

              {errorMessage && (
                <div className="mt-5 rounded-[18px] border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-500">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-medium text-[var(--button-text)] disabled:opacity-60"
              >
                {loading ? "Se deschide workspace-ul..." : "Intră în workspace"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
