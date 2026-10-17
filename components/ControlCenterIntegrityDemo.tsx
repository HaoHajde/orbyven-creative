import Link from "next/link";

type Category = "all" | "code" | "security" | "seo" | "legal";
type Queue = "all" | "manual" | "guardian";

type DemoProps = {
  category?: Category;
  queue?: Queue;
  guardianQueued?: boolean;
};

const categories = [
  { id: "code", label: "CODE", score: 100, glyph: "</>" },
  { id: "security", label: "SEC", score: 94, glyph: "◇" },
  { id: "seo", label: "SEO", score: 100, glyph: "⌕" },
  { id: "legal", label: "LEGAL", score: 88, glyph: "§" },
] as const;

const history = [
  { date: "17 OCT", sha: "8967f39", score: 95 },
  { date: "16 OCT", sha: "e451cee", score: 100 },
  { date: "15 OCT", sha: "06dd04e", score: 98 },
];

function href(category: Category, queue: Queue, guardianQueued = false) {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (queue !== "all") params.set("queue", queue);
  if (guardianQueued) params.set("guardian", "queued");
  const query = params.toString();
  return `/control-center/integrity/demo${query ? `?${query}` : ""}`;
}

function Dot({ tone }: { tone: "good" | "warn" | "bad" }) {
  const cls = tone === "good" ? "bg-emerald-400" : tone === "warn" ? "bg-amber-300" : "bg-rose-400";
  return <span className={`h-2 w-2 rounded-full ${cls}`} />;
}

export default function ControlCenterIntegrityDemo({ category = "all", queue = "all", guardianQueued = false }: DemoProps) {
  const showManual = (queue === "all" || queue === "manual") && (category === "all" || category === "legal");
  const showGuardian = (queue === "all" || queue === "guardian") && (category === "all" || category === "security");

  return (
    <main className="min-h-screen bg-[#07080b] text-white antialiased">
      <div className="mx-auto max-w-[1380px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
          <Link href={href("all", "all")} className="flex items-center gap-3" aria-label="ORBYVEN Control Center">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-indigo-400/25 bg-indigo-400/[0.08] text-lg text-indigo-200">◎</span>
            <span className="leading-none">
              <strong className="block text-[12px] tracking-[0.22em]">ORBYVEN</strong>
              <span className="mt-1 block text-[8px] font-bold tracking-[0.28em] text-indigo-300">CONTROL</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.12em] text-[#85858d]">
            <span className="hidden sm:inline">DEMO</span>
            <span className="h-1 w-1 rounded-full bg-[#45454b]" />
            <span className="text-emerald-300">OWNER</span>
            <span className="h-1 w-1 rounded-full bg-[#45454b]" />
            <span>MFA</span>
          </div>
        </header>

        <section className="grid gap-5 py-7 lg:grid-cols-[220px_1fr] lg:items-stretch">
          <div className="grid place-items-center rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5">
            <div className="relative grid h-36 w-36 place-items-center rounded-full" style={{ background: "conic-gradient(#6ee7b7 0deg 342deg, #202126 342deg 360deg)" }}>
              <div className="grid h-[118px] w-[118px] place-items-center rounded-full bg-[#0d0e12]">
                <div className="text-center">
                  <div className="text-5xl font-semibold tracking-[-0.07em]">95</div>
                  <div className="mt-1 text-[9px] font-bold tracking-[0.18em] text-[#74747b]">HEALTH</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {categories.map((item) => {
              const active = category === item.id;
              const tone = item.score >= 95 ? "good" : item.score >= 90 ? "warn" : "bad";
              return (
                <Link
                  key={item.id}
                  href={href(active ? "all" : item.id, queue, guardianQueued)}
                  className={`group rounded-[22px] border p-4 transition ${active ? "border-indigo-300/35 bg-indigo-400/[0.09]" : "border-white/[0.07] bg-[#0d0e12] hover:border-white/[0.15]"}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] text-[#8b8b93]">{item.glyph}</span>
                    <Dot tone={tone} />
                  </div>
                  <div className="mt-7 flex items-end justify-between gap-3">
                    <span className="text-[9px] font-bold tracking-[0.16em] text-[#73737b]">{item.label}</span>
                    <span className="text-3xl font-semibold tracking-[-0.06em]">{item.score}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_310px]">
          <div className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-black/20 p-1">
                {(["all", "manual", "guardian"] as Queue[]).map((item) => (
                  <Link key={item} href={href(category, item, guardianQueued)} className={`rounded-full px-3 py-1.5 text-[9px] font-bold tracking-[0.1em] ${queue === item ? "bg-white text-black" : "text-[#777780]"}`}>
                    {item === "all" ? "ALL" : item === "manual" ? "YOU" : "AI"}
                  </Link>
                ))}
              </div>
              <span className="text-[9px] font-bold tracking-[0.12em] text-[#5f5f67]">2 OPEN</span>
            </div>

            <div className="mt-4 space-y-2">
              {showManual && (
                <details className="group rounded-[18px] border border-amber-300/15 bg-amber-300/[0.035] px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">Data retention</span>
                    <span className="rounded-full border border-white/[0.08] px-2 py-1 text-[8px] font-bold tracking-[0.1em] text-[#777780]">YOU</span>
                    <span className="text-[#55555d]">⌄</span>
                  </summary>
                  <div className="mt-3 border-t border-white/[0.06] pt-3 text-xs text-[#8a8a92]">
                    Confirmare juridică înainte de publicare.
                    <div className="mt-3 flex gap-2">
                      <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-black">DONE</span>
                      <span className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[9px] font-bold text-[#777780]">RISK</span>
                    </div>
                  </div>
                </details>
              )}

              {showGuardian && (
                <details className="group rounded-[18px] border border-rose-400/15 bg-rose-400/[0.035] px-4 py-3" open={guardianQueued}>
                  <summary className="flex cursor-pointer list-none items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${guardianQueued ? "bg-indigo-300 animate-pulse" : "bg-rose-400"}`} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">Security regression</span>
                    <span className="rounded-full border border-indigo-300/15 bg-indigo-400/[0.06] px-2 py-1 text-[8px] font-bold tracking-[0.1em] text-indigo-200">AI</span>
                    <span className="text-[#55555d]">⌄</span>
                  </summary>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                    <span className="text-xs text-[#8a8a92]">{guardianQueued ? "Queued · preparing patch" : "Draft PR only"}</span>
                    {guardianQueued ? (
                      <span className="rounded-full border border-indigo-300/20 bg-indigo-400/[0.08] px-3 py-1.5 text-[9px] font-bold text-indigo-200">RUNNING</span>
                    ) : (
                      <Link href={href(category, queue, true)} className="rounded-full bg-indigo-200 px-3 py-1.5 text-[9px] font-bold text-[#101018]">PREPARE PR</Link>
                    )}
                  </div>
                </details>
              )}

              {!showManual && !showGuardian && (
                <div className="grid min-h-28 place-items-center rounded-[18px] border border-dashed border-white/[0.08] text-[10px] font-bold tracking-[0.12em] text-[#55555d]">NO ITEMS</div>
              )}
            </div>
          </div>

          <aside className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-[0.16em] text-[#707078]">GUARDIAN</span>
              <Dot tone="good" />
            </div>
            <div className="mt-7 grid grid-cols-3 gap-2 text-center">
              <div><div className="text-2xl font-semibold">PR</div><div className="mt-1 text-[8px] text-[#66666e]">MODE</div></div>
              <div><div className="text-2xl font-semibold">0</div><div className="mt-1 text-[8px] text-[#66666e]">MERGE</div></div>
              <div><div className="text-2xl font-semibold">0</div><div className="mt-1 text-[8px] text-[#66666e]">PROD</div></div>
            </div>
            <div className="mt-6 h-px bg-white/[0.06]" />
            <div className="mt-4 flex items-center justify-between text-[9px] text-[#66666e]"><span>AUDIT</span><span>07:30</span></div>
          </aside>
        </section>

        <section className="mt-4 overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#0d0e12]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <span className="text-[9px] font-bold tracking-[0.16em] text-[#707078]">HISTORY</span>
            <span className="text-[9px] text-[#55555d]">↓ REPORT</span>
          </div>
          {history.map((run) => (
            <div key={run.date} className="grid grid-cols-[90px_1fr_auto] items-center gap-3 border-b border-white/[0.05] px-5 py-3 last:border-b-0">
              <span className="text-[10px] font-bold text-[#73737b]">{run.date}</span>
              <span className="font-mono text-[10px] text-[#52525a]">{run.sha}</span>
              <div className="flex items-center gap-3"><span className="text-sm font-semibold">{run.score}</span><span className="text-[#5a5a62]">↓</span></div>
            </div>
          ))}
        </section>

        <footer className="flex items-center justify-between px-1 py-4 text-[8px] font-bold tracking-[0.12em] text-[#45454d]">
          <span>ISOLATED DEMO</span>
          <span>NO DATA · NO PROD</span>
        </footer>
      </div>
    </main>
  );
}
