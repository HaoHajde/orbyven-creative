"use client";

import BrandLogo from "@/components/BrandLogo";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function WorkspaceLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await orbyvenSupabase.auth.getUser();
      if (data.user) router.replace("/workspace");
    };

    checkSession();
  }, [router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
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

    router.replace("/workspace");
  };

  return (
    <main className="min-h-screen bg-white text-[#1d1d1f] antialiased dark:bg-black dark:text-[#f5f5f7]">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-6 py-6 md:px-10">
        <header className="flex items-center justify-between">
          <BrandLogo compact />
          <span className="rounded-full bg-black/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73] dark:bg-white/[0.08] dark:text-[#a1a1a6]">
            Workspace
          </span>
        </header>

        <section className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#86868b]">
                ORBYVEN · BUSINESS OS
              </p>
              <h1 className="mt-5 text-[46px] font-semibold leading-none tracking-[-0.055em] sm:text-[56px]">
                Tot business-ul tău. Simplu.
              </h1>
              <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">
                Autentifică-te pentru a intra în spațiul companiei tale.
              </p>
            </div>

            <form
              onSubmit={submit}
              className="rounded-[30px] border border-black/[0.08] bg-[#f5f5f7] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.05)] dark:border-white/[0.1] dark:bg-[#111113] sm:p-8"
            >
              <label className="block">
                <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6e6e73] dark:text-[#a1a1a6]">
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
                  className="w-full rounded-[18px] border border-black/[0.08] bg-white px-4 py-4 text-sm outline-none focus:border-[#4b46ee] focus:ring-4 focus:ring-[#4b46ee]/10 dark:border-white/[0.1] dark:bg-black"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6e6e73] dark:text-[#a1a1a6]">
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
                  className="w-full rounded-[18px] border border-black/[0.08] bg-white px-4 py-4 text-sm outline-none focus:border-[#4b46ee] focus:ring-4 focus:ring-[#4b46ee]/10 dark:border-white/[0.1] dark:bg-black"
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
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1d1d1f] px-5 text-sm font-medium text-white disabled:opacity-60 dark:bg-[#f5f5f7] dark:text-black"
              >
                {loading ? "Se autentifică..." : "Intră în ORBYVEN"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
