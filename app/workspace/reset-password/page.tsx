"use client";

import WorkspaceAuthShell, {
  AuthError,
  AuthField,
  AuthPrimaryButton,
} from "@/components/WorkspaceAuthShell";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { getWorkspaceEntryPath } from "@/lib/orbyven-workspace";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const syncSession = async () => {
      const { data } = await orbyvenSupabase.auth.getSession();
      if (!cancelled && data.session) setReady(true);
    };

    void syncSession();
    const { data: listener } = orbyvenSupabase.auth.onAuthStateChange((event, session) => {
      if (!cancelled && session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        setReady(true);
      }
    });

    const timeout = window.setTimeout(() => {
      if (!cancelled) setErrorMessage((current) => current || "Linkul de recuperare este invalid sau a expirat.");
    }, 3500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!ready) {
      setErrorMessage("Deschide din nou linkul primit pe email.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Parola trebuie să aibă cel puțin 8 caractere.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Parolele nu coincid.");
      return;
    }

    setLoading(true);
    const { error } = await orbyvenSupabase.auth.updateUser({ password });
    if (error) {
      console.error(error);
      setErrorMessage("Parola nu a putut fi actualizată. Cere un link nou și încearcă din nou.");
      setLoading(false);
      return;
    }

    const destination = await getWorkspaceEntryPath();
    router.replace(destination === "/workspace/login" ? "/workspace" : destination);
    router.refresh();
  };

  return (
    <WorkspaceAuthShell
      eyebrow="ORBYVEN · PAROLĂ NOUĂ"
      title="Setează noua parolă."
      description="După salvare rămâi autentificat și continui direct în spațiul potrivit contului tău."
    >
      <form onSubmit={submit}>
        <AuthField
          label="Parolă nouă"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(value) => {
            setPassword(value);
            setErrorMessage("");
          }}
          placeholder="Minimum 8 caractere"
        />
        <div className="mt-5">
          <AuthField
            label="Confirmă parola"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              setErrorMessage("");
            }}
            placeholder="Repetă parola"
          />
        </div>
        <AuthError message={errorMessage} />
        <AuthPrimaryButton loading={loading} loadingLabel="Se salvează...">
          Salvează parola
        </AuthPrimaryButton>
      </form>
    </WorkspaceAuthShell>
  );
}
