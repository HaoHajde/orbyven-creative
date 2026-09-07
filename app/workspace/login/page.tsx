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

  return (
    <WorkspaceAuthShell
      eyebrow="ORBYVEN · WORKSPACE"
      title="Bine ai revenit."
      description="Intră în spațiul firmei tale. Sesiunea rămâne activă pe dispozitivul tău până când alegi să te deconectezi."
      footer={
        <>
          Nu ai cont?{" "}
          <Link href="/workspace/register" className="font-semibold text-[#4b46ee]">
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
            className="text-xs font-medium text-[#4b46ee]"
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
