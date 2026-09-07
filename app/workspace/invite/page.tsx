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

export default function WorkspaceInvitePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const syncSession = async () => {
      const { data } = await orbyvenSupabase.auth.getSession();
      if (!cancelled && data.session) {
        setReady(true);
        setEmail(data.session.user.email ?? null);
      }
    };

    void syncSession();
    const { data: listener } = orbyvenSupabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) {
        setReady(true);
        setEmail(session.user.email ?? null);
      }
    });

    const timeout = window.setTimeout(() => {
      if (!cancelled && !ready) {
        setErrorMessage((current) => current || "Invitația este invalidă sau a expirat. Cere ORBYVEN să retrimită accesul.");
      }
    }, 4000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, [ready]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!ready) {
      setErrorMessage("Deschide invitația direct din email.");
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
      setErrorMessage("Parola nu a putut fi setată. Cere o invitație nouă și încearcă din nou.");
      setLoading(false);
      return;
    }

    const destination = await getWorkspaceEntryPath();
    router.replace(destination === "/workspace/login" ? "/workspace" : destination);
    router.refresh();
  };

  return (
    <WorkspaceAuthShell
      eyebrow="ORBYVEN · INVITAȚIE"
      title="Workspace-ul tău este pregătit."
      description={
        email
          ? `Finalizează accesul pentru ${email}. Firma și modulele au fost deja configurate de ORBYVEN.`
          : "Finalizează accesul. Firma și modulele tale sunt deja configurate."
      }
    >
      <form onSubmit={submit}>
        <AuthField
          label="Alege parola"
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
        <AuthPrimaryButton loading={loading} loadingLabel="Se activează accesul...">
          Intră în ORBYVEN
        </AuthPrimaryButton>
      </form>
    </WorkspaceAuthShell>
  );
}
