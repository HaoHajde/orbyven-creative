"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { PUBLIC_OFFERS } from "@/lib/commerce/public-offers";
import {
  BILLING_PLANS,
  LEGAL_DOCUMENT_VERSION,
  PUBLIC_PRICE_TAX_LABEL,
  type BillingPlanId,
} from "@/lib/billing/public-config";
import { publicThemeVars, themeBodyBackground } from "@/lib/orbyven-theme";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { getCurrentWorkspace, getWorkspaceEntryPath, type OrbyvenWorkspace } from "@/lib/orbyven-workspace";

type Theme = "light" | "dark";
type AccountState = "checking" | "guest" | "onboarding" | "ready" | "restricted";
type Mode = "web" | "ecosystem";

const META: Record<BillingPlanId,{note:string;badge?:string}> = {
  start:{note:"Website + baza operațională esențială."},
  business:{note:"Site + modulele folosite zilnic.",badge:"Recomandat"},
  pro:{note:"Ecosistem extins pentru procese și echipă."},
};

function WebDesignStartContent(){
  const searchParams=useSearchParams();
  const mode:Mode=searchParams.get("mode")==="ecosystem"?"ecosystem":"web";
  const [theme,setTheme]=useState<Theme>("light");
  const [planId,setPlanId]=useState<BillingPlanId>("business");
  const [accountState,setAccountState]=useState<AccountState>("checking");
  const [workspace,setWorkspace]=useState<OrbyvenWorkspace|null>(null);
  const [accepted,setAccepted]=useState(false);
  const [paying,setPaying]=useState(false);
  const [error,setError]=useState("");
  const plan=useMemo(()=>BILLING_PLANS[planId],[planId]);

  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      const saved=localStorage.getItem("studio-theme");
      const next:Theme=saved==="dark"||saved==="light"?saved:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
      setTheme(next);
      document.documentElement.style.colorScheme=next;
      document.body.style.backgroundColor=themeBodyBackground(next);
    });
    return()=>cancelAnimationFrame(frame);
  },[]);

  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      try{
        const {data}=await orbyvenSupabase.auth.getSession();
        if(cancelled)return;
        if(!data.session){setAccountState("guest");return;}
        const destination=await getWorkspaceEntryPath();
        if(cancelled)return;
        if(destination==="/workspace/onboarding"){setAccountState("onboarding");return;}
        if(destination!=="/workspace"){setAccountState("restricted");return;}
        const current=await getCurrentWorkspace();
        if(cancelled)return;
        if(!current){setAccountState("onboarding");return;}
        setWorkspace(current);
        setAccountState("ready");
      }catch{
        if(!cancelled)setAccountState("guest");
      }
    };
    void load();
    return()=>{cancelled=true};
  },[]);

  const toggleTheme=()=>setTheme(current=>{
    const next=current==="light"?"dark":"light";
    localStorage.setItem("studio-theme",next);
    document.documentElement.style.colorScheme=next;
    document.body.style.backgroundColor=themeBodyBackground(next);
    return next;
  });

  const query=`?plan=${planId}&checkout=1&product=web-design-dashboard`;
  const registerHref=`/workspace/register${query}`;
  const loginHref=`/workspace/login${query}`;
  const onboardingHref=`/workspace/onboarding${query}`;

  const checkout=async()=>{
    if(!workspace||!accepted||paying)return;
    setPaying(true);setError("");
    try{
      const {data}=await orbyvenSupabase.auth.getSession();
      const token=data.session?.access_token;
      if(!token)throw new Error("Sesiunea a expirat.");
      const response=await fetch("/api/billing/checkout",{
        method:"POST",
        headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({organizationId:workspace.organization.id,planId,acceptedLegalVersion:LEGAL_DOCUMENT_VERSION}),
      });
      const payload=await response.json() as {url?:string;error?:string};
      if(!response.ok||!payload.url)throw new Error(payload.error||"Checkout indisponibil.");
      window.location.assign(payload.url);
    }catch(e){
      setError(e instanceof Error?e.message:"Checkout indisponibil.");
      setPaying(false);
    }
  };

  return(
    <main
      data-orbyven-theme={theme}
      style={{
        ...publicThemeVars(theme),
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",
        background:theme==="dark"
          ?"radial-gradient(circle at 78% 10%,rgba(119,83,255,.16),transparent 24%),linear-gradient(180deg,#0b0912,#09090d 74%)"
          :"radial-gradient(circle at 78% 10%,rgba(119,83,255,.10),transparent 24%),linear-gradient(180deg,#fbfaff,#f7f7fa 74%)",
      }}
      className="orbyven-theme-shell relative min-h-screen overflow-x-hidden text-[var(--text)] antialiased"
    >
      <SiteHeader theme={theme} compact={false} activePage="contact" onToggleTheme={toggleTheme}/>

      <section className="relative z-10 px-5 pb-24 pt-28 sm:px-6 md:px-10 md:pb-32 md:pt-36">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 text-[10px] font-semibold text-[var(--muted)] transition hover:text-[var(--text)]">← Înapoi la alegere</Link>
            <div className="flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
              <Link href="/porneste/web-design?mode=web" className={`rounded-full px-4 py-2.5 text-[10px] font-semibold ${mode==="web"?"bg-[var(--button)] text-[var(--button-text)]":"text-[var(--muted)]"}`}>Web design</Link>
              <Link href="/porneste/web-design?mode=ecosystem" className={`rounded-full px-4 py-2.5 text-[10px] font-semibold ${mode==="ecosystem"?"bg-[var(--button)] text-[var(--button-text)]":"text-[var(--muted)]"}`}>Web design + Dashboard</Link>
            </div>
          </div>

          {mode==="web"?(
            <>
              <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--home-violet)]">WEB DESIGN · BONUS DE LANSARE</p>
                  <h1 className="mt-5 max-w-[900px] text-[clamp(54px,6.4vw,98px)] font-semibold leading-[.87] tracking-[-.072em]">
                    Website-ul tău.
                    <br/>
                    <span className="text-[var(--home-violet)]">30 zile Dashboard gratuit.</span>
                  </h1>
                </div>
                <p className="max-w-xl text-[14px] leading-7 text-[var(--muted)] lg:justify-self-end">
                  La prima achiziție eligibilă de web design, primul utilizator primește 30 de zile de ORBYVEN Dashboard. Îl testezi pe business-ul tău înainte să decizi dacă îl păstrezi.
                </p>
              </div>

              <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
                <div
                  className="relative min-h-[560px] overflow-hidden rounded-[34px] border border-white/12 bg-cover bg-center text-white shadow-[0_32px_120px_rgba(0,0,0,.22)]"
                  style={{backgroundImage:"linear-gradient(180deg,rgba(7,8,12,.10),rgba(7,8,12,.82)),url('/hao-customs/hero.webp')"}}
                >
                  <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                    <p className="text-[9px] font-bold uppercase tracking-[.18em] text-white/55">WEBSITE / PREVIEW</p>
                    <h2 className="mt-4 max-w-2xl text-[40px] font-semibold leading-[.94] tracking-[-.06em] sm:text-[50px]">Design construit în jurul business-ului, nu în jurul unui template rigid.</h2>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {["Responsive","SEO tehnic","Formulare","Analytics"].map(x=><span key={x} className="rounded-full border border-white/14 bg-black/20 px-3 py-2 text-[9px] font-semibold backdrop-blur-md">{x}</span>)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col rounded-[34px] border border-[#a58bff]/30 bg-[linear-gradient(145deg,rgba(126,93,255,.15),rgba(126,93,255,.035))] p-6 shadow-[0_28px_100px_rgba(75,70,238,.12)] sm:p-8 lg:p-10">
                  <span className="w-fit rounded-full border border-[#a58bff]/30 bg-[var(--accent-soft)] px-4 py-2.5 text-[9px] font-bold text-[var(--home-violet)]">INCLUS LA PRIMA ACHIZIȚIE</span>
                  <p className="mt-8 text-[72px] font-semibold leading-none tracking-[-.08em]">30</p>
                  <p className="mt-2 text-[22px] font-semibold tracking-[-.045em]">zile ORBYVEN Dashboard</p>
                  <p className="mt-2 text-[12px] text-[var(--muted)]">
                    399 lei acum · 1 utilizator · apoi 499 lei/lună după cele 30 de zile
                  </p>

                  <div className="mt-8 grid gap-2">
                    {["Testezi clienți, task-uri și calendar în context real.","Vezi ce module chiar îți sunt utile.","După trial alegi dacă vrei să continui."].map((x,i)=>(
                      <div key={x} className="flex items-start gap-3 rounded-[18px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_52%,transparent)] p-4">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-[9px] font-bold">0{i+1}</span>
                        <p className="text-[11px] leading-5 text-[var(--muted)]">{x}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 rounded-[20px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_50%,transparent)] p-5">
                    <div className="flex items-end justify-between gap-5">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--muted-2)]">AZI</p>
                        <p className="mt-2 text-[38px] font-semibold leading-none tracking-[-.07em]">{PUBLIC_OFFERS.web.priceLei} lei</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--muted-2)]">DUPĂ 30 ZILE</p>
                        <p className="mt-2 text-[24px] font-semibold leading-none tracking-[-.055em]">{PUBLIC_OFFERS.web.recurringLei} lei/lună</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-8">
                    <Link href="/porneste/plata?offer=web" className="flex h-14 w-full items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)]">
                      <span>Mergi direct la plată · {PUBLIC_OFFERS.web.priceLei} lei</span><span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ):(
            <>
              <div className="mt-10 grid gap-8 lg:grid-cols-[1.04fr_.96fr] lg:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--home-violet)]">ADVANCED · WEBSITE + OPERATIONS</p>
                  <h1 className="mt-5 max-w-[940px] text-[clamp(54px,6.3vw,96px)] font-semibold leading-[.87] tracking-[-.072em]">
                    Site-ul devine
                    <br/>
                    <span className="text-[var(--home-violet)]">sistemul firmei.</span>
                  </h1>
                </div>
                <p className="max-w-xl text-[14px] leading-7 text-[var(--muted)] lg:justify-self-end">
                  Varianta avansată: website-ul public, dashboard-ul și modulele operaționale sunt construite ca un singur ecosistem. Personalizăm modulele în funcție de fluxurile tale.
                </p>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["01","Site public","Design, SEO și conversie."],
                  ["02","Workspace","Clienți, task-uri, calendar, oferte."],
                  ["03","Module custom","Configurăm și adaptăm modulele la activitatea firmei."],
                  ["04","Automatizări","Modulele pot comunica între ele pentru pași mai rapizi."],
                ].map(([n,t,d])=>(
                  <div key={n} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5">
                    <p className="text-[9px] font-bold text-[var(--home-violet)]">{n}</p>
                    <p className="mt-4 text-[15px] font-semibold">{t}</p>
                    <p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">{d}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
                <section className="rounded-[34px] border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[0_28px_100px_rgba(0,0,0,.12)] sm:p-8 lg:p-10">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">ALEGE BAZA</p>
                      <h2 className="mt-3 text-[38px] font-semibold leading-[.94] tracking-[-.055em]">Apoi o personalizăm.</h2>
                    </div>
                    <span className="rounded-full border border-[#a58bff]/28 bg-[var(--accent-soft)] px-3 py-2 text-[8px] font-bold text-[var(--home-violet)]">MODULE ADAPTABILE</span>
                  </div>

                  <div className="mt-8 space-y-3">
                    {(["start","business","pro"] as BillingPlanId[]).map(id=>{
                      const p=BILLING_PLANS[id],active=id===planId;
                      return(
                        <button key={id} type="button" onClick={()=>{setPlanId(id);setAccepted(false);setError("")}} className={`flex w-full items-center gap-4 rounded-[22px] border p-5 text-left transition ${active?"border-[#a58bff]/50 bg-[var(--accent-soft)]":"border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]"}`}>
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[9px] font-bold ${active?"border-[#a58bff] bg-[#a58bff] text-[#09090d]":"border-[var(--border-strong)] text-transparent"}`}>✓</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-[15px] font-semibold">{p.name}</p>
                              {META[id].badge?<span className="rounded-full bg-[var(--button)] px-2.5 py-1 text-[7px] font-bold text-[var(--button-text)]">{META[id].badge}</span>:null}
                            </div>
                            <p className="mt-1.5 text-[11px] text-[var(--muted)]">{META[id].note}</p>
                          </div>
                          <div className="text-right"><span className="text-[30px] font-semibold tracking-[-.06em]">{p.priceLei}</span><span className="ml-1 text-[9px] text-[var(--muted)]">lei/lună</span></div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-6 rounded-[20px] border border-dashed border-[#a58bff]/30 bg-[#a58bff]/[.055] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--home-violet)]">PERSONALIZARE MODULE</p>
                    <p className="mt-2 text-[12px] leading-6 text-[var(--muted)]">Planul este baza. În etapa de configurare alegem modulele relevante și adaptăm fluxurile la business-ul tău.</p>
                  </div>
                </section>

                <aside className="rounded-[34px] border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[0_28px_100px_rgba(0,0,0,.14)] sm:p-8 lg:p-10">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">CONT & CHECKOUT</p>
                  <div className="mt-5 rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                    <div className="flex items-center justify-between">
                      <div><p className="text-[10px] text-[var(--muted)]">Plan selectat</p><p className="mt-1 text-[17px] font-semibold">{plan.name}</p></div>
                      <p className="text-[28px] font-semibold tracking-[-.06em]">{plan.priceLei} lei</p>
                    </div>
                    <div className="mt-4 flex justify-between border-t border-[var(--border)] pt-4 text-[9px] text-[var(--muted)]"><span>Lunar</span><span>{PUBLIC_PRICE_TAX_LABEL}</span></div>
                  </div>

                  <div className="mt-6">
                    {accountState==="checking"?<div className="rounded-[18px] bg-[var(--surface-2)] p-5 text-[12px] text-[var(--muted)]">Verificăm contul…</div>:null}
                    {accountState==="guest"?<div>
                      <Link href={registerHref} className="flex h-14 items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)]"><span>Creează cont și continuă</span><span>→</span></Link>
                      <Link href={loginHref} className="mt-3 flex h-13 items-center justify-center rounded-[18px] border border-[var(--border-strong)] text-[12px] font-semibold">Am deja cont</Link>
                    </div>:null}
                    {accountState==="onboarding"?<Link href={onboardingHref} className="flex h-14 items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)]"><span>Finalizează contul</span><span>→</span></Link>:null}
                    {accountState==="restricted"?<Link href="/workspace/access" className="flex h-14 items-center justify-center rounded-[18px] border border-[var(--border-strong)] text-[12px] font-semibold">Verifică accesul</Link>:null}
                    {accountState==="ready"?<div>
                      <div className="rounded-[18px] bg-[var(--surface-2)] p-4"><p className="text-[9px] text-[var(--muted)]">Cont conectat</p><p className="mt-1 truncate text-[13px] font-semibold">{workspace?.organization.name}</p></div>
                      <label className="mt-4 flex items-start gap-3 rounded-[18px] border border-[var(--border)] p-4 text-[11px] leading-5 text-[var(--muted)]"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} className="mt-1 h-4 w-4 accent-[#4b46ee]"/><span>Accept <Link href="/legal/terms" className="font-semibold text-[var(--text)] underline">Termenii</Link> și <Link href="/legal/subscriptions" className="font-semibold text-[var(--text)] underline">Termenii de abonament</Link>.</span></label>
                      <button type="button" disabled={!accepted||paying} onClick={checkout} className="mt-4 flex h-14 w-full items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)] disabled:opacity-40"><span>{paying?"Se deschide checkout-ul…":"Continuă la plată · "+plan.priceLei+" lei"}</span><span>→</span></button>
                    </div>:null}
                    {error?<p className="mt-4 rounded-[16px] border border-red-500/20 bg-red-500/10 p-4 text-[11px] text-red-500">{error}</p>:null}
                  </div>

                  <div className="mt-7 border-t border-[var(--border)] pt-5">
                    <p className="text-[11px] font-semibold">Plata este procesată prin Stripe.</p>
                    <p className="mt-2 text-[9px] leading-5 text-[var(--muted)]">Metodele compatibile, inclusiv Apple Pay și Google Pay, sunt afișate direct de Stripe Checkout.</p>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </section>

      <SiteFooter theme={theme} activePage="contact"/>
    </main>
  )
}

export default function WebDesignStartPage(){
  return <Suspense fallback={<main className="min-h-screen bg-[#09090d]"/>}><WebDesignStartContent/></Suspense>
}
