"use client";

import WorkspaceAuthShell, {
  AuthError,
  AuthField,
  AuthPrimaryButton,
  AuthSuccess,
} from "@/components/WorkspaceAuthShell";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { getWorkspaceEntryPath } from "@/lib/orbyven-workspace";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function WorkspaceRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const destination = await getWorkspaceEntryPath();
        if (!cancelled && destination !== "/workspace/login") {
          router.replace(destination);
        }
      } catch (error) {
        console.error(error);
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (name.trim().length < 2) {
      setErrorMessage("Introdu numele tău.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Parola trebuie să aibă cel puțin 8 caractere.");
      return;
    }

    setLoading(true);
    const origin = window.location.origin;
    const { data, error } = await orbyvenSupabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${origin}/workspace/auth/callback`,
      },
    });

    if (error) {
      const message = error.message.toLowerCase();
      setErrorMessage(
        message.includes("already") || message.includes("registered")
          ? "Există deja un cont pentru acest email. Încearcă să te autentifici."
          : "Contul nu a putut fi creat. Verifică datele și încearcă din nou."
      );
      setLoading(false);
      return;
    }

    if (data.session) {
      const destination = await getWorkspaceEntryPath();
      router.replace(destination === "/workspace/login" ? "/workspace/onboarding" : destination);
      router.refresh();
      return;
    }

    setSuccessMessage(
      "Contul a fost creat. Verifică emailul și apasă linkul de confirmare; după confirmare vei continua direct în ORBYVEN."
    );
    setLoading(false);
  };

  return (
    <WorkspaceAuthShell
      eyebrow="ORBYVEN · CONT NOU"
      title="Începi în câteva minute."
      description="Creează-ți contul ORBYVEN. După confirmarea emailului te ducem automat la configurarea companiei."
      footer={
        <>
          Ai deja cont?{" "}
          <Link href="/workspace/login" className="font-semibold text-[#4b46ee]">
            Intră în workspace
          </Link>
        </>
      }
    >
      <form onSubmit={submit}>
        <AuthField
          label="Nume"
          value={name}
          onChange={(value) => {
            setName(value);
            setErrorMessage("");
          }}
          autoComplete="name"
          placeholder="Numele tău"
        />
        <div className="mt-5">
          <AuthField
            label="Email"
            type="email"
            value={email}
            onChange={(value) => {
              setEmail(value);
              setErrorMessage("");
            }}
            autoComplete="email"
            placeholder="nume@firma.ro"
          />
        </div>
        <div className="mt-5">
          <AuthField
            label="Parolă"
            type="password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setErrorMessage("");
            }}
            autoComplete="new-password"
            minLength={8}
            placeholder="Minimum 8 caractere"
          />
        </div>

        <AuthError message={errorMessage} />
        <AuthSuccess message={successMessage} />
        <AuthPrimaryButton loading={loading} loadingLabel="Se creează contul...">
          Creează cont
        </AuthPrimaryButton>
      </form>
    </WorkspaceAuthShell>
  );
}
