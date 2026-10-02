"use client";

import {
  loadPublicFeedbackContext,
  submitPublicClientFeedback,
  type PublicFeedbackContext,
} from "@/lib/modules/feedback-links";
import { useEffect, useState } from "react";

export default function ClientFeedbackForm({ token }: { token: string }) {
  const [context, setContext] = useState<PublicFeedbackContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const next = await loadPublicFeedbackContext(token);
        if (!active) return;
        setContext(next);
        setSubmitted(Boolean(next?.submitted));
      } catch (loadError) {
        console.error(loadError);
        if (active) setError("Linkul de feedback nu a putut fi verificat.");
      } finally {
        if (active) setLoading(false);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [token]);

  const submit = async () => {
    if (!score || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await submitPublicClientFeedback(token, score, note);
      setSubmitted(true);
    } catch (submitError) {
      console.error(submitError);
      setError("Feedbackul nu a putut fi trimis. Linkul poate fi expirat sau deja folosit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 sm:py-16">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-center">
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            ORBYVEN · Feedback
          </span>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
          <div className="border-b border-[var(--border)] bg-[var(--surface-2)] p-6 sm:p-8">
            {loading ? (
              <>
                <div className="h-4 w-28 animate-pulse rounded-full bg-[var(--border)]" />
                <div className="mt-4 h-9 w-4/5 animate-pulse rounded-xl bg-[var(--border)]" />
              </>
            ) : context ? (
              <>
                <p className="text-xs font-semibold text-[var(--accent)]">
                  {context.organization_name}
                </p>
                <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.045em] sm:text-[36px]">
                  Cum a fost experiența ta?
                </h1>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Feedback pentru <span className="font-semibold text-[var(--text)]">{context.task_title}</span>.
                  Durează mai puțin de un minut.
                </p>
              </>
            ) : (
              <h1 className="text-[28px] font-semibold tracking-[-0.04em]">
                Link indisponibil
              </h1>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {loading ? (
              <p className="text-sm text-[var(--muted)]">Se verifică linkul…</p>
            ) : submitted || context?.submitted ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-xl text-emerald-600">
                  ✓
                </div>
                <h2 className="mt-4 text-xl font-semibold">Mulțumim pentru feedback.</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
                  Răspunsul tău a fost înregistrat și ajunge direct la firma cu care ai lucrat.
                </p>
              </div>
            ) : !context || !context.available ? (
              <div className="py-8 text-center">
                <h2 className="text-lg font-semibold">Acest link nu mai este activ.</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Linkul poate fi expirat, revocat sau asociat unei solicitări deja închise.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
                    Nota ta
                  </p>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setScore(value)}
                        aria-pressed={score === value}
                        className={
                          "h-14 rounded-[16px] border text-sm font-semibold transition " +
                          (score === value
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]")
                        }
                      >
                        {value}★
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-[10px] text-[var(--muted-2)]">
                    <span>De îmbunătățit</span>
                    <span>Excelent</span>
                  </div>
                </div>

                <label className="mt-6 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
                    Comentariu <span className="font-normal normal-case tracking-normal">· opțional</span>
                  </span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value.slice(0, 1200))}
                    rows={4}
                    placeholder="Ce ți-a plăcut sau ce putem îmbunătăți?"
                    className="mt-3 w-full resize-none rounded-[18px] border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--accent)]"
                  />
                  <span className="mt-1 block text-right text-[10px] text-[var(--muted-2)]">
                    {note.length}/1200
                  </span>
                </label>

                {error && (
                  <p className="mt-4 rounded-[14px] bg-red-500/[0.06] px-3 py-2.5 text-xs text-red-500">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  disabled={!score || submitting}
                  onClick={() => void submit()}
                  className="mt-5 h-12 w-full rounded-full bg-[var(--button)] text-sm font-semibold text-[var(--button-text)] transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? "Se trimite…" : "Trimite feedback"}
                </button>

                <p className="mt-4 text-center text-[10px] leading-4 text-[var(--muted-2)]">
                  Link unic, utilizabil o singură dată. Feedbackul este transmis doar firmei afișate mai sus.
                </p>
              </>
            )}

            {error && (loading || submitted || !context?.available) && (
              <p className="mt-4 text-center text-xs text-red-500">{error}</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
