"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createCustomerPortalLink,
  listCustomerPortalLinks,
  revokeCustomerPortalLink,
  type CustomerPortalLinkSummary,
} from "@/lib/modules/customer-portal";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CustomerPortalSharePanel({
  organizationId,
  clientId,
}: {
  organizationId: string;
  clientId: string;
}) {
  const [links, setLinks] = useState<CustomerPortalLinkSummary[]>([]);
  const [days, setDays] = useState(30);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setLinks(await listCustomerPortalLinks(organizationId, clientId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Portalul nu a putut fi încărcat.");
    }
  }, [clientId, organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const activeCount = useMemo(
    () => links.filter((link) => !link.revokedAt && new Date(link.expiresAt).getTime() > Date.now()).length,
    [links]
  );

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const created = await createCustomerPortalLink(organizationId, clientId, days);
      setGeneratedUrl(created.url);
      setMessage("Link nou generat. Copiază-l acum; tokenul complet nu este păstrat în ORBYVEN.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Linkul nu a putut fi creat.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setMessage("Link copiat.");
    } catch {
      setMessage("Copiază manual linkul din câmp.");
    }
  };

  const revoke = async (linkId: string) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await revokeCustomerPortalLink(organizationId, linkId);
      if (generatedUrl) setGeneratedUrl("");
      await load();
      setMessage("Link revocat.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Linkul nu a putut fi revocat.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-5 rounded-[20px] border border-[var(--border)] bg-[var(--surface)]/70 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">Customer Portal</p>
          <p className="mt-1 text-sm font-semibold">Acces extern securizat</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {activeCount ? `${activeCount} linkuri active` : "Niciun link activ"} · clientul vede doar datele publicabile și documentele marcate explicit.
          </p>
        </div>
        <div className="flex gap-2">
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="h-9 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 text-xs">
            <option value={7}>7 zile</option>
            <option value={30}>30 zile</option>
            <option value={60}>60 zile</option>
            <option value={90}>90 zile</option>
          </select>
          <button type="button" disabled={busy} onClick={() => void generate()} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-40">
            Generează link
          </button>
        </div>
      </div>

      {generatedUrl ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={generatedUrl} className="h-10 min-w-0 flex-1 rounded-[12px] border border-[var(--border)] bg-[var(--bg)] px-3 text-xs" />
          <button type="button" onClick={() => void copy()} className="h-10 rounded-[12px] border border-[var(--border-strong)] px-4 text-xs font-semibold">Copiază</button>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-xs text-[var(--muted)]">{message}</p> : null}

      {links.length ? (
        <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-3">
          {links.slice(0, 8).map((link) => {
            const active = !link.revokedAt && new Date(link.expiresAt).getTime() > Date.now();
            return (
              <div key={link.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-[var(--muted)]">
                  {active ? "Activ" : link.revokedAt ? "Revocat" : "Expirat"} · creat {formatDate(link.createdAt)} · expiră {formatDate(link.expiresAt)}
                </span>
                {active ? (
                  <button type="button" disabled={busy} onClick={() => void revoke(link.id)} className="shrink-0 font-semibold text-red-500 disabled:opacity-40">Revocă</button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
