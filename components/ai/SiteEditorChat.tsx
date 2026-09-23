"use client";
import type { FormEvent } from "react";

export type SiteEditorMessage = {role:"user"|"assistant";text:string};

type Props = {
  messages: SiteEditorMessage[];
  prompt: string;
  onPrompt: (prompt: string) => void;
  onSend: (event: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  error: string;
  notice: string;
  aiStatus: "loading" | "ready" | "disabled";
  aiStatusReason: string;
};

export default function SiteEditorChat({
  messages, prompt, onPrompt, onSend, busy, error, notice, aiStatus, aiStatusReason,
}: Props) {
  const aiReady = aiStatus === "ready";
  return <section className="flex min-h-[500px] flex-col overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-sm lg:min-h-0"
    aria-label="Chat de personalizare">
    <div className="border-b border-black/[0.07] px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#7772e8]">ORBYVEN AI</p>
        <span className={aiReady ? "rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700" :
          "rounded-full bg-amber-50 px-3 py-1 text-[10px] font-semibold text-amber-800"}>
          {aiStatus === "loading" ? "Se verifică..." : aiReady ? "AI gata pentru test" : "Preview manual"}
        </span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">Spune-ne cum îl vezi.</h1>
      <p className="mt-2 text-xs leading-5 text-[#777780]">
        {aiReady
          ? "Cere o schimbare. Voi modifica în siguranță textele, culorile sau layoutul din preview."
          : "Editează fără costuri în panoul din dreapta; chatul se activează separat pentru pilot."}
      </p>
      {!aiReady && aiStatusReason && <p role="status" className="mt-3 rounded-[12px] bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-900">
        {aiStatusReason}
      </p>}
    </div>
    <div aria-live="polite" className="flex min-h-[180px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 lg:min-h-0">
      {messages.map((message, index) =>
        <div key={index} className={message.role === "user"
          ? "ml-8 rounded-[18px] bg-[#6058e8] p-4 text-sm leading-6 text-white"
          : "mr-8 rounded-[18px] bg-[#f2f2f6] p-4 text-sm leading-6 text-[#3a3a42]"}>
          {message.text}
        </div>
      )}
      {busy && <p className="px-3 text-xs text-[#777780]" role="status">AI-ul pregătește modificarea...</p>}
    </div>
    <div className="border-t border-black/[0.07] p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {["Fă site-ul negru cu accent auriu", "Vreau un titlu mai scurt", "Schimbă layoutul în centrat"].map(example =>
          <button key={example} type="button" onClick={() => onPrompt(example)} disabled={busy || !aiReady}
            className="rounded-full border border-black/10 px-3 py-2 text-[11px] text-[#595961] hover:bg-[#f7f7fa] disabled:cursor-not-allowed disabled:opacity-40">
            {example}
          </button>
        )}
      </div>
      <form onSubmit={onSend} className="rounded-[20px] border border-black/10 bg-[#f7f7fa] p-2">
        <label htmlFor="editor-prompt" className="sr-only">Ce dorești să modifici?</label>
        <textarea id="editor-prompt" value={prompt} maxLength={600} rows={3}
          disabled={busy || !aiReady} onChange={event => onPrompt(event.target.value)}
          placeholder={aiReady ? "Ex.: Fă titlul mai scurt și schimbă fundalul în negru..." : "Chatul AI este dezactivat. Încearcă ajustările manuale din dreapta."}
          className="w-full resize-none bg-transparent p-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-55"/>
        <div className="flex items-center justify-between gap-2 px-2 pb-1">
          <span className="text-[10px] text-[#86868b]">{prompt.length}/600 · fără publicare</span>
          <button type="submit" disabled={busy || !aiReady || prompt.trim().length < 4}
            className="rounded-full bg-[#6058e8] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40">
            {busy ? "Se generează..." : "Modifică preview-ul →"}
          </button>
        </div>
      </form>
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      {notice && <p role="status" className="mt-2 text-xs text-emerald-700">{notice}</p>}
    </div>
  </section>;
}
