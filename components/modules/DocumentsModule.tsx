"use client";

import {
  createDocumentSignedUrl,
  deleteDocument,
  listDocumentContexts,
  listDocuments,
  uploadDocument,
  type BusinessDocument,
  type DocumentCategory,
  type DocumentEstimateLink,
  type DocumentLink,
  type DocumentTaskLink,
} from "@/lib/modules/documents";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { Field, ModuleEmpty, ModuleError, ModuleHeader, ModuleMetric, moduleInputClass } from "@/components/modules/ModuleKit";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Props = {
  organizationId: string;
  locale: string;
  role: OrbyvenWorkspace["membership"]["role"];
};

const categoryLabels: Record<DocumentCategory, string> = {
  general: "General",
  estimate: "Ofertă / deviz",
  contract: "Contract",
  invoice: "Factură",
  photo: "Foto",
  receipt: "Bon / dovadă",
  other: "Alt document",
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function DocumentsModule({ organizationId, locale, role }: Props) {
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [clients, setClients] = useState<DocumentLink[]>([]);
  const [tasks, setTasks] = useState<DocumentTaskLink[]>([]);
  const [estimates, setEstimates] = useState<DocumentEstimateLink[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("general");
  const [clientId, setClientId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [estimateId, setEstimateId] = useState("");
  const [note, setNote] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const canWrite = role !== "viewer";
  const canDelete = role === "owner" || role === "admin" || role === "manager";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextDocuments, contexts] = await Promise.all([
        listDocuments(organizationId),
        listDocumentContexts(organizationId),
      ]);
      setDocuments(nextDocuments);
      setClients(contexts.clients);
      setTasks(contexts.tasks);
      setEstimates(contexts.estimates);
    } catch (loadError) {
      console.error(loadError);
      setError("Documentele nu au putut fi încărcate.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const clientById = useMemo(() => new Map(clients.map((item) => [item.id, item.name])), [clients]);
  const taskById = useMemo(() => new Map(tasks.map((item) => [item.id, item.title])), [tasks]);
  const estimateById = useMemo(() => new Map(estimates.map((item) => [item.id, `${item.reference} · ${item.title}`])), [estimates]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    if (!normalized) return documents;
    return documents.filter((document) => {
      const haystack = [
        document.name,
        categoryLabels[document.category],
        document.note,
        document.client_id ? clientById.get(document.client_id) : "",
        document.task_id ? taskById.get(document.task_id) : "",
        document.estimate_id ? estimateById.get(document.estimate_id) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(locale);
      return haystack.includes(normalized);
    });
  }, [clientById, documents, estimateById, locale, query, taskById]);

  const metrics = useMemo(() => ({
    total: documents.length,
    photos: documents.filter((item) => item.category === "photo").length,
    receipts: documents.filter((item) => item.category === "receipt").length,
    linked: documents.filter((item) => item.client_id || item.task_id || item.estimate_id).length,
  }), [documents]);

  const resetUpload = () => {
    setFile(null);
    setCategory("general");
    setClientId("");
    setTaskId("");
    setEstimateId("");
    setNote("");
    setFileInputKey((current) => current + 1);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || !file || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await uploadDocument(organizationId, {
        file,
        category,
        clientId: clientId || null,
        taskId: taskId || null,
        estimateId: estimateId || null,
        note,
      });
      setDocuments((current) => [created, ...current]);
      resetUpload();
      setUploadOpen(false);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Fișierul nu a putut fi încărcat.");
    } finally {
      setSaving(false);
    }
  };

  const openDocument = async (document: BusinessDocument) => {
    setError("");
    try {
      const url = await createDocumentSignedUrl(document.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (openError) {
      console.error(openError);
      setError("Linkul securizat pentru document nu a putut fi creat.");
    }
  };

  const removeDocument = async (document: BusinessDocument) => {
    if (!canDelete || saving || !window.confirm(`Ștergi ${document.name}?`)) return;
    setSaving(true);
    setError("");
    try {
      await deleteDocument(organizationId, document);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
    } catch (deleteError) {
      console.error(deleteError);
      setError("Documentul nu a putut fi șters.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pb-24 text-sm text-[var(--muted)]">Se încarcă documentele…</div>;

  return (
    <div className="pb-24 md:pb-8">
      <ModuleHeader
        eyebrow="Operations · Documente"
        title="Documente"
        description="Fișiere private, păstrate lângă clientul, lucrarea sau oferta la care se referă. Accesul este izolat pe organizație."
        action={canWrite ? (
          <button type="button" onClick={() => setUploadOpen((current) => !current)} className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)]">
            {uploadOpen ? "Închide" : "+ Încarcă fișier"}
          </button>
        ) : null}
      />

      <div className="mt-8"><ModuleError message={error} /></div>

      <section className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ModuleMetric label="Fișiere" value={String(metrics.total)} note="storage privat" />
        <ModuleMetric label="Legate de context" value={String(metrics.linked)} note="client / lucrare / ofertă" />
        <ModuleMetric label="Fotografii" value={String(metrics.photos)} note="poze din teren" />
        <ModuleMetric label="Bonuri" value={String(metrics.receipts)} note="pentru cheltuieli" />
      </section>

      {uploadOpen && canWrite ? (
        <form onSubmit={handleUpload} className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fișier *">
              <input key={fileInputKey} type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className={`${moduleInputClass} file:mr-3 file:rounded-full file:border-0 file:bg-[var(--button)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--button-text)]`} />
            </Field>
            <Field label="Categorie">
              <select value={category} onChange={(event) => setCategory(event.target.value as DocumentCategory)} className={moduleInputClass}>
                {(Object.keys(categoryLabels) as DocumentCategory[]).map((key) => <option key={key} value={key}>{categoryLabels[key]}</option>)}
              </select>
            </Field>
            <Field label="Client">
              <select value={clientId} onChange={(event) => setClientId(event.target.value)} className={moduleInputClass}>
                <option value="">Fără client</option>
                {clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </Field>
            <Field label="Lucrare">
              <select value={taskId} onChange={(event) => setTaskId(event.target.value)} className={moduleInputClass}>
                <option value="">Fără lucrare</option>
                {tasks.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </Field>
            <Field label="Ofertă / deviz">
              <select value={estimateId} onChange={(event) => setEstimateId(event.target.value)} className={moduleInputClass}>
                <option value="">Fără ofertă</option>
                {estimates.map((item) => <option key={item.id} value={item.id}>{item.reference} · {item.title}</option>)}
              </select>
            </Field>
            <Field label="Notă">
              <input value={note} onChange={(event) => setNote(event.target.value)} className={moduleInputClass} placeholder="Ex. poze înainte de intervenție" />
            </Field>
          </div>
          <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs text-[var(--muted)]">Maxim 20 MB. Descărcarea se face prin link temporar securizat.</p>
            <button disabled={!file || saving} className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)] disabled:opacity-40">{saving ? "Se încarcă…" : "Salvează documentul"}</button>
          </div>
        </form>
      ) : null}

      <section className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="font-semibold">Biblioteca firmei</h2>
          <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${moduleInputClass} sm:max-w-xs`} placeholder="Caută document…" />
        </div>

        {filtered.length ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {filtered.map((document) => (
              <article key={document.id} className="rounded-[22px] border border-[var(--border)] bg-[var(--bg)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{document.name}</p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">{categoryLabels[document.category]} · {formatSize(document.size_bytes)} · {formatDate(document.created_at, locale)}</p>
                  </div>
                  <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold">Privat</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[var(--muted)]">
                  {document.client_id ? <span className="rounded-full bg-[var(--surface)] px-2.5 py-1">Client: {clientById.get(document.client_id) || "—"}</span> : null}
                  {document.task_id ? <span className="rounded-full bg-[var(--surface)] px-2.5 py-1">Lucrare: {taskById.get(document.task_id) || "—"}</span> : null}
                  {document.estimate_id ? <span className="rounded-full bg-[var(--surface)] px-2.5 py-1">{estimateById.get(document.estimate_id) || "Ofertă"}</span> : null}
                </div>
                {document.note ? <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{document.note}</p> : null}

                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => void openDocument(document)} className="h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">Deschide</button>
                  {canDelete ? <button type="button" disabled={saving} onClick={() => void removeDocument(document)} className="h-10 rounded-full px-4 text-xs font-semibold text-red-500 disabled:opacity-40">Șterge</button> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5"><ModuleEmpty title={query ? "Niciun rezultat" : "Niciun document încă"} description={query ? "Încearcă un alt termen de căutare." : "Încarcă documentele direct lângă contextul lor, nu într-un folder fără legături."} /></div>
        )}
      </section>
    </div>
  );
}
