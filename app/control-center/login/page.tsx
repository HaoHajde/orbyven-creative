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
    error?: string;
    message?: string;
  };
  const failure = new Error(
    payload.message ?? "Control Center access denied."
  ) as Error & { code?: string };
  failure.code = payload.error;
  throw failure;
}

function Shield() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3 5.5 6v5.2c0 4.2 2.5 7.4 6.5 9.3 4-1.9 6.5-5.1 6.5-9.3V6L12 3Z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

export default function ControlCenterLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [mfaMode, setMfaMode] = useState<"none" | "challenge" | "enroll">("none");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [copied, setCopied] = useState(false);

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

  const prepareMfa = async () => {
    const { data: factors, error: factorsError } =
      await orbyvenSupabase.auth.mfa.listFactors();

    if (factorsError) throw factorsError;

    const totpFactors = factors.totp ?? [];
    const verifiedTotp = totpFactors.find(
      (factor) => factor.status === "verified"
    );

    if (verifiedTotp) {
      setMfaFactorId(verifiedTotp.id);
      setMfaSecret("");
      setMfaCode("");
      setMfaMode("challenge");
      return;
    }

    for (const factor of totpFactors.filter(
      (candidate) => candidate.status !== "verified"
    )) {
      await orbyvenSupabase.auth.mfa.unenroll({ factorId: factor.id });
    }

    const { data: enrollment, error: enrollError } =
      await orbyvenSupabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "ORBYVEN Control Center",
      });

    if (enrollError) throw enrollError;

    const secret = enrollment.totp?.secret;
    if (!secret) {
      throw new Error("TOTP enrollment did not return a secret.");
    }

    setMfaFactorId(enrollment.id);
    setMfaSecret(secret);
    setMfaCode("");
    setMfaMode("enroll");
  };

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
      const code =
        verifyError &&
        typeof verifyError === "object" &&
        "code" in verifyError
          ? String((verifyError as { code?: unknown }).code ?? "")
          : "";

      if (code === "mfa_required") {
        try {
          await prepareMfa();
        } catch (mfaError) {
          console.error(mfaError);
          await orbyvenSupabase.auth.signOut();
          setErrorMessage("MFA indisponibil. Încearcă din nou.");
        }
        setLoading(false);
        return;
      }

      await orbyvenSupabase.auth.signOut();
      setErrorMessage(
        verifyError instanceof Error
          ? verifyError.message
          : "Acces refuzat."
      );
      setLoading(false);
    }
  };

  const submitMfa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const code = mfaCode.trim();
    if (!/^\d{6,8}$/.test(code) || !mfaFactorId) {
      setErrorMessage("Cod invalid.");
      setLoading(false);
      return;
    }

    const { error } = await orbyvenSupabase.auth.mfa.challengeAndVerify({
      factorId: mfaFactorId,
      code,
    });

    if (error) {
      setErrorMessage("Cod incorect sau expirat.");
      setLoading(false);
      return;
    }

    const { data } = await orbyvenSupabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setErrorMessage("Sesiunea MFA nu a putut fi actualizată.");
      setLoading(false);
      return;
    }

    try {
      await verifyControlCenterSession(token);
      router.replace("/control-center");
      router.refresh();
    } catch (verifyError) {
      console.error(verifyError);
      setErrorMessage(
        verifyError instanceof Error
          ? verifyError.message
          : "Acces refuzat."
      );
      setLoading(false);
    }
  };

  const cancelMfa = async () => {
    await orbyvenSupabase.auth.signOut();
    setMfaMode("none");
    setMfaFactorId("");
    setMfaCode("");
    setMfaSecret("");
    setPassword("");
    setErrorMessage("");
    setCopied(false);
  };

  const copySecret = async () => {
    if (!mfaSecret) return;
    try {
      await navigator.clipboard.writeText(mfaSecret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08080a] text-[#77777d]">
        <span className="h-5 w-5 animate-spin rounded-full border border-white/15 border-t-white" aria-label="Checking access" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(79,70,229,.16),transparent_34%),#08080a] text-[#f5f5f7] antialiased">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-5 py-5 sm:px-8 md:px-10">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo compact theme="dark" />
          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8d8d94]">
            <Shield />
            <span>MFA</span>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-10 sm:py-16">
          <div className="w-full max-w-[410px]">
            <div className="mb-6 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#707077]">ORBYVEN</p>
              <h1 className="mt-2 text-[38px] font-semibold leading-none tracking-[-0.055em] sm:text-[44px]">Control Center</h1>
            </div>

            {mfaMode === "none" ? (
              <form onSubmit={submit} className="rounded-[26px] border border-white/[0.09] bg-[#111114]/90 p-4 shadow-[0_30px_90px_rgba(0,0,0,.38)] backdrop-blur-xl sm:p-5">
                <label className="block">
                  <span className="sr-only">Email</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setErrorMessage("");
                    }}
                    className="h-12 w-full rounded-[15px] border border-white/[0.08] bg-black/45 px-4 text-sm outline-none transition placeholder:text-[#56565c] focus:border-indigo-400/55"
                  />
                </label>

                <label className="mt-2.5 block">
                  <span className="sr-only">Parolă</span>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Parolă"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setErrorMessage("");
                    }}
                    className="h-12 w-full rounded-[15px] border border-white/[0.08] bg-black/45 px-4 text-sm outline-none transition placeholder:text-[#56565c] focus:border-indigo-400/55"
                  />
                </label>

                {errorMessage && (
                  <div role="alert" className="mt-3 rounded-[13px] border border-rose-400/18 bg-rose-400/[0.07] px-3 py-2.5 text-[11px] text-rose-200">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 h-12 w-full rounded-[15px] bg-white px-5 text-xs font-semibold text-black transition hover:bg-[#ededf0] disabled:opacity-50"
                >
                  {loading ? "Verific…" : "Continuă"}
                </button>

                <div className="mt-4 flex items-center justify-center gap-3 text-[9px] font-medium uppercase tracking-[0.12em] text-[#55555b]">
                  <span>Exact owner</span>
                  <span className="h-1 w-1 rounded-full bg-[#414147]" />
                  <span>AAL2</span>
                </div>
              </form>
            ) : (
              <form onSubmit={submitMfa} className="rounded-[26px] border border-white/[0.09] bg-[#111114]/90 p-4 shadow-[0_30px_90px_rgba(0,0,0,.38)] backdrop-blur-xl sm:p-5">
                <div className="flex items-center gap-3 rounded-[15px] border border-indigo-300/15 bg-indigo-400/[0.06] px-3.5 py-3 text-[11px] text-indigo-100/85">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-indigo-300/[0.08] text-indigo-200"><Shield /></span>
                  <span>{mfaMode === "enroll" ? "Adaugă cheia TOTP, apoi confirmă codul." : "Confirmă codul din Authenticator."}</span>
                </div>

                {mfaMode === "enroll" && (
                  <div className="mt-2.5 flex items-center gap-2 rounded-[15px] border border-white/[0.08] bg-black/45 p-2.5">
                    <code className="min-w-0 flex-1 break-all px-1 font-mono text-[10px] leading-5 text-[#c8c8ce]">{mfaSecret}</code>
                    <button type="button" onClick={() => void copySecret()} className="h-8 shrink-0 rounded-[10px] border border-white/[0.08] px-2.5 text-[9px] font-semibold text-[#8f8f96] hover:text-white">
                      {copied ? "COPIED" : "COPY"}
                    </button>
                  </div>
                )}

                <label className="mt-2.5 block">
                  <span className="sr-only">Cod MFA</span>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(event) => {
                      setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 8));
                      setErrorMessage("");
                    }}
                    className="h-14 w-full rounded-[15px] border border-white/[0.08] bg-black/45 px-4 text-center font-mono text-xl tracking-[0.3em] outline-none transition placeholder:text-[#39393f] focus:border-indigo-400/55"
                  />
                </label>

                {errorMessage && (
                  <div role="alert" className="mt-3 rounded-[13px] border border-rose-400/18 bg-rose-400/[0.07] px-3 py-2.5 text-[11px] text-rose-200">
                    {errorMessage}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                  <button type="submit" disabled={loading} className="h-12 rounded-[15px] bg-white px-5 text-xs font-semibold text-black transition hover:bg-[#ededf0] disabled:opacity-50">
                    {loading ? "Verific…" : "Confirmă"}
                  </button>
                  <button type="button" onClick={() => void cancelMfa()} className="h-12 rounded-[15px] border border-white/[0.08] px-4 text-xs font-medium text-[#77777d] transition hover:text-white">
                    ×
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
