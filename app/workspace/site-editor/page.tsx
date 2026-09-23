"use client";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import SiteEditorChat from "@/components/ai/SiteEditorChat";
import SiteEditorPreview from "@/components/ai/SiteEditorPreview";
import { useSiteEditor } from "@/lib/ai/use-site-editor";

export default function SiteEditorPage(){
  const editor=useSiteEditor();
  if(!editor.ready)return <main className="grid min-h-screen place-items-center bg-[#f7f7fa] text-sm">Se pregătește editorul...</main>;
  if(!editor.workspace||!editor.allowed)return <main className="grid min-h-screen place-items-center bg-[#f7f7fa] p-6 text-center"><div><h1 className="text-2xl font-semibold">Editor indisponibil</h1><p className="mt-3 text-sm">{editor.error||"Este necesar un workspace."}</p><Link href="/workspace" className="mt-6 inline-block underline">Înapoi în workspace</Link></div></main>;
  return <main className="min-h-screen bg-[#f7f7fa] text-[#1d1d1f] antialiased">
    <header className="border-b border-black/[0.07] bg-white"><div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
      <div className="flex items-center gap-4"><BrandLogo compact theme="light"/><div><p className="text-sm font-semibold">Editor site · Alpha</p><p className="text-[11px] text-[#86868b]">{editor.workspace.organization.name} · preview privat</p></div></div>
      <div className="flex flex-wrap items-center gap-2"><Link href="/workspace" className="rounded-full border border-black/10 px-4 py-2 text-xs font-medium">Workspace</Link><button type="button" onClick={editor.undo} disabled={editor.history.length<2||editor.busy} className="rounded-full border border-black/10 px-4 py-2 text-xs font-medium disabled:opacity-40">↶ Undo</button><button type="button" onClick={editor.save} disabled={editor.busy} className="rounded-full bg-[#24242a] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">Salvează draft</button></div>
    </div></header>
    <div className="mx-auto grid max-w-[1680px] gap-4 p-3 md:p-5 lg:h-[calc(100vh-83px)] lg:grid-cols-[minmax(300px,390px)_minmax(0,1fr)]">
      <SiteEditorChat messages={editor.messages} prompt={editor.prompt} onPrompt={editor.setPrompt} onSend={editor.send} busy={editor.busy} error={editor.error} notice={editor.notice} aiStatus={editor.aiStatus} aiStatusReason={editor.aiStatusReason} onRefreshAi={editor.refreshAiStatus}/>
      <SiteEditorPreview site={editor.site} view={editor.view} onView={editor.setView} onPatch={editor.onPatch} onSelectPreset={editor.onSelectPreset}/>
    </div>
  </main>;
}
