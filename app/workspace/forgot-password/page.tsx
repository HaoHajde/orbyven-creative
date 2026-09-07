"use client";

import WorkspaceAuthShell, {
  AuthError,
  AuthField,
  AuthPrimaryButton,
  AuthSuccess,
} from "@/components/WorkspaceAuthShell";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await orbyvenSupabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/workspace/reset-password` }
    );

    if (error) {
      console.error(error);
      setErrorMessage("Emailul de recuperare nu a putut fi trimis. Încearcă din nou.");
      setLoading(false);
      return;
    }

    setSuccessMessage(
      "Dacă există un cont pentru această adresă, vei primi un email cu linkul pentru setarea unei parole noi."
    );
    setLoading(false);
  };

  return (
    <WorkspaceAuthShell
      eyebrow="ORBYVEN · RECUPERARE"
      title="Recuperează accesul."
      description="Îți trimitem un link securizat. După schimbarea parolei vei continua direct către workspace."
      footer={
        <Link href="/workspace/login" className="font-semibold text-[#4b46ee]">
          ← Înapoi la autentificare
        </Link>
      }
    >
      <form onSubmit={submit}>
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            setErrorMessage("");
            setSuccessMessage("");
          }}
          placeholder="nume@firma.ro"
        />
        <AuthError message={errorMessage} />
        <AuthSuccess message={successMessage} />
        <AuthPrimaryButton loading={loading} loadingLabel="Se trimite...">
          Trimite linkul
        </AuthPrimaryButton>
      </form>
    </WorkspaceAuthShell>
  );
}
