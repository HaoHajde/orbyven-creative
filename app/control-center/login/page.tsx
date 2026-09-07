"use client";

import BrandLogo from "@/components/BrandLogo";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

async function verifyControlCenterSession(accessToken: string) {
  const response = await fetch("/api/control-center", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (response.ok) return;

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
  };
  throw new Error(payload.message ?? "Control Center access denied.");
}

export default function ControlCenterLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const checkExistingSession = async () => {
      const { data } = await orbyvenSupabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        if (!cancelled) setChecking(false);
        return;
      }

      try {
        await verifyControlCenterSession(token);
        if (!cancelled) router.replace("/control-center");
      } catch {
        if (!cancelled) setChecking(false);
      }
    };

    void checkExistingSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await orbyvenSupabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.session) {
      setErrorMessage("Email sau parolă incorectă.");
      setLoading(false);
      return;
    }

    try {
      await verifyControlCenterSession(data.session.access_token);
      router.replace("/control-center");
      router.refresh();
    } catch (verifyError) {
      console.error(verifyError);
      await orbyvenSupabase.auth.signOut();
      setErrorMessage(
        verifyError instanceof Error
          ? verifyError.message
          : "Contul nu are acces la ORBYVEN Control Center."
      );
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0b] text-sm text-[#a1a1a6]">
        Se verifică accesul intern...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-[#f5f5f7] antialiased">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-6 py-6 md:px-10">
        <header className="flex items-center justify-between">
          <BrandLogo compact theme="dark" />
          <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a1a1a6]">
            Internal only
          </span>
        </header>

        <section className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#86868b]">
                ORBYVEN · CONTROL CENTER
              </p>
              <h1 className="mt-5 text-[48px] font-semibold leading-none tracking-[-0.055em] sm:text-[58px]">
                Platform control.
              </h1>
              <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-[#a1a1a6]">
                Acces intern pentru administrarea tenant-urilor ORBYVEN. Nu este dashboard-ul clientului.
              </p>
            </div>

            <form
              onSubmit={submit}
              className="rounded-[30px] border border-white/[0.1] bg-[#111113] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:p-8"
            >
              <label className="block">
                <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#a1a1a6]">
                  Email ORBYVEN
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
                  className="w-full rounded-[18px] border border-white/[0.1] bg-black px-4 py-4 text-sm outline-none focus:border-[#6d68ff] focus:ring-4 focus:ring-[#4b46ee]/20"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#a1a1a6]">
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
                  className="w-full rounded-[18px] border border-white/[0.1] bg-black px-4 py-4 text-sm outline-none focus:border-[#6d68ff] focus:ring-4 focus:ring-[#4b46ee]/20"
                />
              </label>

              {errorMessage && (
                <div className="mt-5 rounded-[18px] border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 h-12 w-full rounded-full bg-[#f5f5f7] px-5 text-sm font-semibold text-black disabled:opacity-60"
              >
                {loading ? "Se verifică..." : "Intră în Control Center"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
