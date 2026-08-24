"use client";

import {
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

type FormState = {
  name: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  projectType: "Website pentru business",
  budget: "Nu știu încă",
  message: "",
};

export default function MobileContactForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateField = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (sent) setSent(false);
    if (errorMessage) setErrorMessage("");
  };

  const submit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const message = form.message.trim();

    if (!name || !email || !message) {
      setErrorMessage("Completează câmpurile obligatorii.");
      return;
    }

    setSending(true);
    setSent(false);
    setErrorMessage("");

    try {
      const { orbitaSupabase: orbyvenSupabase } =
        await import("@/lib/orbita-supabase");

      const { error } = await orbyvenSupabase
        .from("leads")
        .insert({
          name,
          email,
          project_type: form.projectType,
          budget: form.budget,
          message,
        });

      if (error) throw error;

      setForm(initialForm);
      setSent(true);
    } catch (error) {
      console.error("ORBYVEN lead insert error:", error);
      setErrorMessage(
        "Cererea nu a putut fi trimisă. Încearcă din nou."
      );
    } finally {
      setSending(false);
    }
  };

  const fieldClass =
    "w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-[15px] text-[var(--text)] outline-none transition focus:border-[#4b46ee]";

  return (
    <form
      onSubmit={submit}
      className="mobile-card rounded-[26px] border border-[var(--border)] bg-[var(--bg)] p-5"
      data-mobile-reveal
    >
      <div className="mb-7">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
          Project brief
        </p>

        <p className="mt-2 text-sm text-[var(--muted)]">
          Spune-ne esențialul. Restul îl clarificăm împreună.
        </p>
      </div>

      <div className="space-y-4">
        <Field label="01 · Nume">
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            value={form.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
            placeholder="Numele tău"
            className={fieldClass}
          />
        </Field>

        <Field label="02 · Email">
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) =>
              updateField("email", event.target.value)
            }
            placeholder="email@exemplu.ro"
            className={fieldClass}
          />
        </Field>

        <Field label="03 · Tipul proiectului">
          <select
            name="projectType"
            value={form.projectType}
            onChange={(event) =>
              updateField("projectType", event.target.value)
            }
            className={fieldClass}
          >
            <option>Website pentru business</option>
            <option>Landing page</option>
            <option>Redesign website</option>
            <option>Invitație digitală de nuntă</option>
            <option>Invitație digitală de botez</option>
            <option>Proiect custom</option>
          </select>
        </Field>

        <Field label="04 · Buget orientativ">
          <select
            name="budget"
            value={form.budget}
            onChange={(event) =>
              updateField("budget", event.target.value)
            }
            className={fieldClass}
          >
            <option>Nu știu încă</option>
            <option>Sub 500 lei</option>
            <option>500 – 1.000 lei</option>
            <option>1.000 – 2.500 lei</option>
            <option>2.500 – 5.000 lei</option>
            <option>Peste 5.000 lei</option>
          </select>
        </Field>

        <Field label="05 · Despre proiect">
          <textarea
            name="message"
            required
            minLength={10}
            rows={7}
            value={form.message}
            onChange={(event) =>
              updateField("message", event.target.value)
            }
            placeholder="Ce vrei să construim și ce rezultat urmărești?"
            className={`${fieldClass} min-h-[170px] resize-y`}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={sending}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)] disabled:opacity-60"
      >
        {sending ? "Se trimite..." : "Trimite cererea ↗"}
      </button>

      {sent && (
        <p className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)]">
          Mulțumim. Cererea a fost trimisă.
        </p>
      )}

      {errorMessage && (
        <p className="mt-4 text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
        {label}
      </span>
      {children}
    </label>
  );
}
