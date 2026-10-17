import BrandLogo from "@/components/BrandLogo";

const categories = [
  { label: "Cod", score: 100, note: "Lint, TypeScript, arhitectură și build trecute" },
  { label: "Securitate", score: 94, note: "1 constatare izolată pentru Guardian" },
  { label: "SEO", score: 100, note: "Contractele SEO sunt conforme" },
  { label: "Juridic", score: 88, note: "1 acțiune manuală necesară" },
];

const history = [
  { run: "2026-10-17 · 07:30", status: "Atenție", score: 95 },
  { run: "2026-10-16 · 07:30", status: "Protejat", score: 100 },
  { run: "2026-10-15 · 07:30", status: "Protejat", score: 98 },
];

export default function ControlCenterIntegrityDemo() {
  return (
    <main className="min-h-screen bg-[#08080a] text-[#f5f5f7] antialiased">
      <div className="mx-auto max-w-[1480px] px-5 py-6 md:px-9 md:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <BrandLogo compact theme="dark" />
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-indigo-300/20 bg-indigo-400/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-200">
              Preview demo · date fictive
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
              Owner only · MFA
            </span>
          </div>
        </header>

        <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#86868b]">
              ORBYVEN · CONTROL CENTER · INTEGRITY
            </p>
            <h1 className="mt-4 max-w-4xl text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[64px]">
              Tot ce contează, într-un singur loc.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-[#a1a1a6]">
              Audit zilnic automat pentru cod, securitate, SEO și juridic. Panoul principal rămâne minimalist; diagnosticul complet stă separat în raportul tehnic.
            </p>
          </div>

          <div className="min-w-[230px] rounded-[28px] border border-white/[0.1] bg-[#111113] p-6 shadow-2xl shadow-black/20">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868b]">Health score</p>
            <div className="mt-3 text-6xl font-semibold tracking-[-0.06em] text-emerald-300">95</div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#a1a1a6]">
              <span>Atenție minoră</span>
              <span>azi · 07:30</span>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <article key={category.label} className="rounded-[24px] border border-white/[0.08] bg-[#101012] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#d1d1d6]">{category.label}</p>
                  <p className="mt-2 max-w-[220px] text-[11px] leading-4 text-[#6e6e73]">{category.note}</p>
                </div>
                <span className={`text-2xl font-semibold tracking-[-0.04em] ${category.score >= 90 ? "text-emerald-300" : "text-amber-300"}`}>
                  {category.score}
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <article className="rounded-[30px] border border-white/[0.09] bg-[#0f0f11] p-5 md:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868b]">Pentru tine</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Lucru manual</h2>
              </div>
              <span className="rounded-full border border-white/[0.1] px-3 py-1 text-xs text-[#a1a1a6]">1</span>
            </div>

            <div className="mt-6 rounded-[20px] border border-amber-400/20 bg-amber-400/[0.04] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">Revizuire juridică necesară</p>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">Juridic · medium</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#a1a1a6]">
                Politica de retenție a datelor a fost modificată. Auditul poate detecta diferența, dar confirmarea juridică rămâne la owner înainte de publicare.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black">Marchează rezolvat</span>
                <span className="rounded-full border border-white/[0.1] px-4 py-2 text-xs font-medium text-[#a1a1a6]">Acceptă risc</span>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-indigo-400/15 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_38%),#0f0f11] p-5 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-300">ORBYVEN Guardian</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Poate lucra singur</h2>
              </div>
              <div className="text-right text-[10px] leading-5 text-[#86868b]">
                <div>PR only</div>
                <div>No auto-merge · No production write</div>
              </div>
            </div>

            <div className="mt-6 rounded-[20px] border border-red-400/20 bg-red-400/[0.05] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">Security regression test failed</p>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">Securitate · high</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#a1a1a6]">
                Guardian poate investiga cauza, pregăti cea mai mică remediere, rula validările și deschide un draft PR pentru aprobarea ta.
              </p>
              <span className="mt-4 inline-flex rounded-full border border-indigo-300/25 bg-indigo-400/[0.08] px-4 py-2 text-xs font-semibold text-indigo-100">
                Pregătește PR
              </span>
            </div>
          </article>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <article className="rounded-[30px] border border-white/[0.09] bg-[#0f0f11] p-5 md:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868b]">Istoric</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Rapoarte de integritate</h2>
              </div>
              <span className="rounded-full border border-white/[0.1] px-4 py-2 text-xs text-[#a1a1a6]">Audit zilnic · 07:30</span>
            </div>

            <div className="mt-6 divide-y divide-white/[0.06] overflow-hidden rounded-[20px] border border-white/[0.06]">
              {history.map((run) => (
                <div key={run.run} className="grid gap-4 px-4 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-medium">{run.run}</p>
                    <p className="mt-1 text-xs text-[#6e6e73]">main · audit determinist</p>
                  </div>
                  <div className={run.score >= 90 ? "text-xl font-semibold text-emerald-300" : "text-xl font-semibold text-amber-300"}>{run.score}</div>
                  <span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-center text-xs font-medium text-[#d1d1d6]">
                    Raport complet ↓
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-white/[0.09] bg-[#0f0f11] p-5 md:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868b]">Protecție activă</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Reguli de execuție</h2>
            <div className="mt-6 space-y-3 text-xs leading-5 text-[#a1a1a6]">
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-4">MFA AAL2 + rol owner + owner UUID exact.</div>
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-4">Guardian nu primește token GitHub cu write în jobul AI.</div>
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-4">Patch-ul trece prin validare completă înainte de draft PR.</div>
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-4">Auto-merge și write direct în producție rămân dezactivate.</div>
            </div>
          </article>
        </section>

        <div className="mt-6 rounded-[20px] border border-indigo-300/15 bg-indigo-400/[0.05] px-4 py-3 text-xs leading-5 text-indigo-100/80">
          Acesta este un demo de interfață cu date fictive. Nu citește Supabase, nu poate executa acțiuni și nu conține date reale din Control Center.
        </div>
      </div>
    </main>
  );
}
