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

function getSignupErrorMessage(error: { message?: string; status?: number }) {
  const message = (error.message ?? "").toLowerCase();

  if (error.status === 429 || message.includes("rate limit") || message.includes("too many")) {
    return "Serviciul de email a atins temporar limita de trimitere. Încearcă din nou puțin mai târziu.";
  }

  if (
    message.includes("email address not authorized") ||
    message.includes("smtp") ||
    message.includes("sending confirmation email") ||
    message.includes("error sending")
  ) {
    return "Contul nu poate fi finalizat deoarece serviciul de email ORBYVEN nu este configurat corect. Încearcă din nou după remedierea SMTP.";
  }

  if (message.includes("already") || message.includes("registered") || message.includes("user already exists")) {
    return "Există deja un cont pentru acest email. Încearcă să te autentifici.";
  }

  if (message.includes("signup is disabled") || message.includes("signups not allowed")) {
    return "Crearea de conturi este dezactivată momentan în serviciul de autentificare.";
  }

  if (message.includes("invalid email")) {
    return "Adresa de email nu este validă.";
  }

  if (message.includes("password")) {
    return "Parola nu respectă cerințele de securitate. Folosește minimum 8 caractere.";
  }

  return "Contul nu a putut fi creat. Verifică datele și încearcă din nou.";
}

export default function WorkspaceRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

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
    setRegisteredEmail("");

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
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await orbyvenSupabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${origin}/workspace/auth/callback`,
        },
      });

      if (error) {
        console.error("ORBYVEN workspace signup failed", {
          status: error.status,
          code: error.code,
          message: error.message,
        });
        setErrorMessage(getSignupErrorMessage(error));
        return;
      }

      if (data.session) {
        const destination = await getWorkspaceEntryPath();
        router.replace(destination === "/workspace/login" ? "/workspace/onboarding" : destination);
        router.refresh();
        return;
      }

      setRegisteredEmail(normalizedEmail);
      setSuccessMessage(
        "Contul a fost creat. Verifică emailul și apasă linkul de confirmare; după confirmare vei continua direct în ORBYVEN."
      );
    } catch (error) {
      console.error("Unexpected ORBYVEN workspace signup error", error);
      setErrorMessage("A apărut o eroare neașteptată la crearea contului. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!registeredEmail || resending) return;

    setErrorMessage("");
    setSuccessMessage("");
    setResending(true);

    try {
      const { error } = await orbyvenSupabase.auth.resend({
        type: "signup",
        email: registeredEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/workspace/auth/callback`,
        },
      });

      if (error) {
        console.error("ORBYVEN confirmation email resend failed", {
          status: error.status,
          code: error.code,
          message: error.message,
        });
        setErrorMessage(getSignupErrorMessage(error));
        return;
      }

      setSuccessMessage("Emailul de confirmare a fost retrimis. Verifică și folderul Spam/Junk.");
    } catch (error) {
      console.error("Unexpected ORBYVEN confirmation resend error", error);
      setErrorMessage("Emailul de confirmare nu a putut fi retrimis. Încearcă din nou.");
    } finally {
      setResending(false);
    }
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

        {registeredEmail ? (
          <button
            type="button"
            onClick={resendConfirmation}
            disabled={resending}
            className="mt-3 w-full rounded-2xl border border-[#d2d2d7] px-4 py-3 text-sm font-semibold text-[#4b46ee] transition hover:bg-[#f5f5f7] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#3a3a3c] dark:hover:bg-[#1c1c1e]"
          >
            {resending ? "Se retrimite..." : "Retrimite emailul de confirmare"}
          </button>
        ) : null}

        <AuthPrimaryButton loading={loading} loadingLabel="Se creează contul...">
          Creează cont
        </AuthPrimaryButton>
      </form>
    </WorkspaceAuthShell>
  );
}
