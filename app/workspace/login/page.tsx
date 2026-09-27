"use client";

import WorkspaceAuthShell, {
  AuthError,
  AuthField,
  AuthPrimaryButton,
} from "@/components/WorkspaceAuthShell";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { getWorkspaceEntryPath } from "@/lib/orbyven-workspace";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function WorkspaceLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const checkUser = async () => {
      try {
        // A local session is only a negative hint. If present, always call
        // getWorkspaceEntryPath() for authoritative server-side access state.
        const { data } = await orbyvenSupabase.auth.getSession();
        if (cancelled || !data.session) return;
        const destination = await getWorkspaceEntryPath();
        if (!cancelled && destination !== "/workspace/login") {
          router.replace(destination);
        }
      } catch (error) {
        console.error(error);
      }
    };

    void checkUser();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await orbyvenSupabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setErrorMessage(
          error.status === 0 || error.message.toLowerCase().includes("fetch")
            ? "Serviciul de autentificare nu răspunde. Verifică conexiunea și încearcă din nou."
            : "Email sau parolă incorectă."
        );
        setLoading(false);
        return;
      }

      // Sign-in succeeded: never repeat the password request if the workspace
      // entry-state lookup fails. The workspace route handles its own access.
      let destination: Awaited<ReturnType<typeof getWorkspaceEntryPath>> = "/workspace";
      try {
        destination = await getWorkspaceEntryPath();
      } catch (routeError) {
        console.error("Workspace entry routing unavailable", routeError);
      }
      router.replace(destination === "/workspace/login" ? "/workspace" : destination);
      router.refresh();
    } catch (error) {
      console.error("Workspace sign-in request failed", error);
      setErrorMessage("Autentificarea nu este disponibilă acum. Verifică conexiunea și reîncearcă.");
      setLoading(false);
    }
  };

  return (
    <WorkspaceAuthShell
      eyebrow="ORBYVEN · WORKSPACE"
      title="Bine ai revenit."
      titleAccent="revenit."
      description="Intră în spațiul firmei tale. Sesiunea rămâne activă pe dispozitivul tău până când alegi să te deconectezi."
      footer={
        <>
          Nu ai cont?{" "}
          <Link href="/workspace/register" className="font-semibold text-[#8fa3ff] transition hover:text-[#bdc9ff]">
            Creează unul
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            setErrorMessage("");
          }}
          placeholder="nume@firma.ro"
        />

        <div className="mt-5">
          <AuthField
            label="Parolă"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setErrorMessage("");
            }}
            placeholder="••••••••"
          />
        </div>

        <div className="mt-3 text-right">
          <Link
            href="/workspace/forgot-password"
            className="text-[11px] font-medium text-[#98a7ff] transition hover:text-[#bdc9ff]"
          >
            Ai uitat parola?
          </Link>
        </div>

        <AuthError message={errorMessage} />
        <AuthPrimaryButton loading={loading} loadingLabel="Se deschide workspace-ul...">
          Intră în workspace
        </AuthPrimaryButton>
      </form>
    </WorkspaceAuthShell>
  );
}
