import Link from "next/link";

type Tab = "overview" | "integrity" | "legal" | "platform";
type Category = "all" | "code" | "security" | "seo" | "legal";
type Queue = "all" | "manual" | "guardian";

type Props = {
  tab?: Tab;
  category?: Category;
  queue?: Queue;
  guardianQueued?: boolean;
  panel?: "none" | "legal-new" | "tenant-new";
};

const tabs: { id: Tab; label: string; glyph: string }[] = [
  { id: "overview", label: "OVERVIEW", glyph: "◎" },
  { id: "integrity", label: "INTEGRITY", glyph: "◇" },
  { id: "legal", label: "LEGAL", glyph: "§" },
  { id: "platform", label: "PLATFORM", glyph: "⌘" },
];

function route({
  tab = "overview",
  category = "all",
  queue = "all",
  guardianQueued = false,
  panel = "none",
}: Props) {
  const params = new URLSearchParams();
  if (tab !== "overview") params.set("tab", tab);
  if (category !== "all") params.set("category", category);
  if (queue !== "all") params.set("queue", queue);
  if (guardianQueued) params.set("guardian", "queued");
  if (panel !== "none") params.set("panel", panel);
  const query = params.toString();
  return `/control-center/demo${query ? `?${query}` : ""}`;
}

function Dot({ tone = "good" }: { tone?: "good" | "warn" | "bad" | "idle" }) {
  const color =
    tone === "good"
      ? "bg-emerald-400"
      : tone === "warn"
        ? "bg-amber-300"
        : tone === "bad"
          ? "bg-rose-400"
          : "bg-[#4a4a52]";
  return <span className={`h-2 w-2 rounded-full ${color}`} />;
}

function Metric({ label, value, tone = "good" }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  const text = tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : "text-rose-300";
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#0d0e12] p-4">
      <div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[0.14em] text-[#686870]">{label}</span><Dot tone={tone} /></div>
      <div className={`mt-5 text-3xl font-semibold tracking-[-0.06em] ${text}`}>{value}</div>
    </div>
  );
}

function Overview() {
  return (
    <>
      <section className="grid gap-3 md:grid-cols-[210px_1fr]">
        <div className="grid place-items-center rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5">
          <div className="relative grid h-36 w-36 place-items-center rounded-full" style={{ background: "conic-gradient(#6ee7b7 0deg 342deg, #1c1d22 342deg 360deg)" }}>
            <div className="grid h-[118px] w-[118px] place-items-center rounded-full bg-[#0d0e12] text-center">
              <div><div className="text-5xl font-semibold tracking-[-0.07em]">95</div><div className="mt-1 text-[9px] font-bold tracking-[0.18em] text-[#67676f]">HEALTH</div></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="CODE" value="100" />
          <Metric label="SEC" value="94" tone="warn" />
          <Metric label="SEO" value="100" />
          <Metric label="LEGAL" value="88" tone="warn" />
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5">
          <div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[0.15em] text-[#6d6d75]">ATTENTION</span><span className="text-[9px] text-[#52525a]">2 OPEN</span></div>
          <div className="mt-4 space-y-2">
            <Link href={route({ tab: "integrity", category: "security", queue: "guardian" })} className="flex items-center gap-3 rounded-[18px] border border-rose-400/15 bg-rose-400/[0.035] px-4 py-3">
              <Dot tone="bad" /><span className="min-w-0 flex-1 truncate text-sm font-medium">Security regression</span><span className="rounded-full border border-indigo-300/15 px-2 py-1 text-[8px] font-bold text-indigo-200">AI</span><span className="text-[#55555d]">›</span>
            </Link>
            <Link href={route({ tab: "integrity", category: "legal", queue: "manual" })} className="flex items-center gap-3 rounded-[18px] border border-amber-300/15 bg-amber-300/[0.035] px-4 py-3">
              <Dot tone="warn" /><span className="min-w-0 flex-1 truncate text-sm font-medium">Data retention</span><span className="rounded-full border border-white/[0.08] px-2 py-1 text-[8px] font-bold text-[#777780]">YOU</span><span className="text-[#55555d]">›</span>
            </Link>
          </div>
        </div>
        <div className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5">
          <div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[0.15em] text-[#6d6d75]">TODAY</span><Dot /></div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center"><div><div className="text-2xl font-semibold">12</div><div className="mt-1 text-[8px] text-[#5d5d65]">TENANTS</div></div><div><div className="text-2xl font-semibold">3</div><div className="mt-1 text-[8px] text-[#5d5d65]">LEGAL</div></div><div><div className="text-2xl font-semibold">1</div><div className="mt-1 text-[8px] text-[#5d5d65]">AI JOB</div></div></div>
          <div className="mt-6 h-px bg-white/[0.06]" />
          <div className="mt-4 flex items-center justify-between text-[9px] text-[#66666e]"><span>LAST AUDIT</span><span>07:30</span></div>
        </div>
      </section>
    </>
  );
}

function Integrity({ category = "all", queue = "all", guardianQueued = false }: Pick<Props, "category" | "queue" | "guardianQueued">) {
  const cats = [
    { id: "code", label: "CODE", score: 100, glyph: "</>" },
    { id: "security", label: "SEC", score: 94, glyph: "◇" },
    { id: "seo", label: "SEO", score: 100, glyph: "⌕" },
    { id: "legal", label: "LEGAL", score: 88, glyph: "§" },
  ] as const;
  const showManual = (queue === "all" || queue === "manual") && (category === "all" || category === "legal");
  const showGuardian = (queue === "all" || queue === "guardian") && (category === "all" || category === "security");
  return (
    <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cats.map((item) => {
          const active = category === item.id;
          const tone = item.score >= 95 ? "good" : "warn";
          return <Link key={item.id} href={route({ tab: "integrity", category: active ? "all" : item.id, queue, guardianQueued })} className={`rounded-[22px] border p-4 ${active ? "border-indigo-300/35 bg-indigo-400/[0.09]" : "border-white/[0.07] bg-[#0d0e12]"}`}><div className="flex items-start justify-between"><span className="text-[11px] text-[#777780]">{item.glyph}</span><Dot tone={tone} /></div><div className="mt-7 flex items-end justify-between"><span className="text-[9px] font-bold tracking-[0.14em] text-[#6b6b73]">{item.label}</span><span className="text-3xl font-semibold tracking-[-0.06em]">{item.score}</span></div></Link>;
        })}
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_310px]">
        <div className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-black/20 p-1">{(["all", "manual", "guardian"] as Queue[]).map((item) => <Link key={item} href={route({ tab: "integrity", category, queue: item, guardianQueued })} className={`rounded-full px-3 py-1.5 text-[9px] font-bold tracking-[0.1em] ${queue === item ? "bg-white text-black" : "text-[#777780]"}`}>{item === "all" ? "ALL" : item === "manual" ? "YOU" : "AI"}</Link>)}</div><span className="text-[9px] text-[#55555d]">2 OPEN</span></div>
          <div className="mt-4 space-y-2">
            {showManual && <details className="rounded-[18px] border border-amber-300/15 bg-amber-300/[0.035] px-4 py-3"><summary className="flex cursor-pointer list-none items-center gap-3"><Dot tone="warn"/><span className="min-w-0 flex-1 truncate text-sm font-medium">Data retention</span><span className="rounded-full border border-white/[0.08] px-2 py-1 text-[8px] font-bold text-[#777780]">YOU</span><span className="text-[#55555d]">⌄</span></summary><div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3"><span className="text-[10px] text-[#777780]">LEGAL REVIEW</span><div className="flex gap-2"><span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-black">DONE</span><span className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[9px] font-bold text-[#777780]">RISK</span></div></div></details>}
            {showGuardian && <details className="rounded-[18px] border border-rose-400/15 bg-rose-400/[0.035] px-4 py-3" open={guardianQueued}><summary className="flex cursor-pointer list-none items-center gap-3"><Dot tone={guardianQueued ? "good" : "bad"}/><span className="min-w-0 flex-1 truncate text-sm font-medium">Security regression</span><span className="rounded-full border border-indigo-300/15 px-2 py-1 text-[8px] font-bold text-indigo-200">AI</span><span className="text-[#55555d]">⌄</span></summary><div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3"><span className="text-[10px] text-[#777780]">{guardianQueued ? "PATCH RUNNING" : "DRAFT PR ONLY"}</span>{guardianQueued ? <span className="rounded-full border border-indigo-300/20 px-3 py-1.5 text-[9px] font-bold text-indigo-200">RUNNING</span> : <Link href={route({ tab: "integrity", category, queue, guardianQueued: true })} className="rounded-full bg-indigo-200 px-3 py-1.5 text-[9px] font-bold text-[#101018]">PREPARE PR</Link>}</div></details>}
            {!showManual && !showGuardian && <div className="grid min-h-28 place-items-center rounded-[18px] border border-dashed border-white/[0.08] text-[9px] font-bold tracking-[0.12em] text-[#55555d]">NO ITEMS</div>}
          </div>
        </div>
        <aside className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5"><div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[0.16em] text-[#707078]">GUARDIAN</span><Dot /></div><div className="mt-7 grid grid-cols-3 gap-2 text-center"><div><div className="text-2xl font-semibold">PR</div><div className="mt-1 text-[8px] text-[#66666e]">MODE</div></div><div><div className="text-2xl font-semibold">0</div><div className="mt-1 text-[8px] text-[#66666e]">MERGE</div></div><div><div className="text-2xl font-semibold">0</div><div className="mt-1 text-[8px] text-[#66666e]">PROD</div></div></div></aside>
      </section>
    </>
  );
}

function Legal({ panel = "none" }: Pick<Props, "panel">) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_330px]">
      <div className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5">
        <div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[0.15em] text-[#6d6d75]">LEGAL QUEUE</span><Link href={route({ tab: "legal", panel: panel === "legal-new" ? "none" : "legal-new" })} className="grid h-8 w-8 place-items-center rounded-full bg-white text-lg text-black">+</Link></div>
        <div className="mt-4 grid grid-cols-3 gap-3"><Metric label="OPEN" value="3" tone="warn"/><Metric label="DUE" value="0"/><Metric label="CLOSED" value="18"/></div>
        <div className="mt-4 space-y-2"><details className="rounded-[18px] border border-white/[0.07] px-4 py-3"><summary className="flex cursor-pointer list-none items-center gap-3"><Dot tone="warn"/><span className="flex-1 text-sm font-medium">Portability request</span><span className="text-[9px] text-[#66666e]">2D</span><span className="text-[#55555d]">⌄</span></summary><div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center text-[9px]"><span className="rounded-full border border-white/[0.08] py-1.5">VERIFY</span><span className="rounded-full border border-white/[0.08] py-1.5">EXPORT</span><span className="rounded-full border border-white/[0.08] py-1.5">CLOSE</span></div></details><details className="rounded-[18px] border border-white/[0.07] px-4 py-3"><summary className="flex cursor-pointer list-none items-center gap-3"><Dot/><span className="flex-1 text-sm font-medium">Contract evidence</span><span className="text-[9px] text-[#66666e]">OK</span><span className="text-[#55555d]">⌄</span></summary><div className="mt-3 border-t border-white/[0.06] pt-3 font-mono text-[9px] text-[#66666e]">SHA256 · 9fc8…a1d2</div></details></div>
      </div>
      <aside className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5"><span className="text-[9px] font-bold tracking-[0.15em] text-[#6d6d75]">{panel === "legal-new" ? "NEW CASE" : "COMPLIANCE"}</span>{panel === "legal-new" ? <div className="mt-5 space-y-3"><div className="h-10 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-3 text-[10px] text-[#5f5f67]">SUBJECT REF</div><div className="grid grid-cols-2 gap-2"><span className="rounded-xl border border-indigo-300/20 bg-indigo-400/[0.06] px-3 py-3 text-[9px] text-indigo-200">ACCESS</span><span className="rounded-xl border border-white/[0.08] px-3 py-3 text-[9px] text-[#777780]">PORTABILITY</span></div><div className="rounded-full bg-white px-4 py-2.5 text-center text-[9px] font-bold text-black">CREATE</div></div> : <div className="mt-6 grid grid-cols-2 gap-3 text-center"><div><div className="text-2xl font-semibold">100%</div><div className="mt-1 text-[8px] text-[#66666e]">EVIDENCE</div></div><div><div className="text-2xl font-semibold">0</div><div className="mt-1 text-[8px] text-[#66666e]">OVERDUE</div></div></div>}</aside>
    </section>
  );
}

function Platform({ panel = "none" }: Pick<Props, "panel">) {
  const tenants = ["Obsidian Events", "Neagu Costică", "Hao’s Customs"];
  return (
    <section className="grid gap-4 lg:grid-cols-[290px_1fr]">
      <aside className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5"><div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[0.15em] text-[#6d6d75]">TENANTS</span><Link href={route({ tab: "platform", panel: panel === "tenant-new" ? "none" : "tenant-new" })} className="grid h-8 w-8 place-items-center rounded-full bg-white text-lg text-black">+</Link></div><div className="mt-4 space-y-2">{tenants.map((name, index) => <div key={name} className={`flex items-center gap-3 rounded-[16px] border px-3 py-3 ${index === 0 ? "border-indigo-300/25 bg-indigo-400/[0.06]" : "border-white/[0.06]"}`}><Dot/><span className="min-w-0 flex-1 truncate text-xs">{name}</span><span className="text-[9px] text-[#55555d]">›</span></div>)}</div></aside>
      <div className="rounded-[26px] border border-white/[0.07] bg-[#0d0e12] p-5"><div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[0.15em] text-[#6d6d75]">{panel === "tenant-new" ? "NEW TENANT" : "OBSIDIAN EVENTS"}</span><span className="text-[9px] text-emerald-300">ACTIVE</span></div>{panel === "tenant-new" ? <div className="mt-5 grid gap-3 md:grid-cols-2"><div className="h-11 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-3 text-[10px] text-[#5f5f67]">COMPANY</div><div className="h-11 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-3 text-[10px] text-[#5f5f67]">SLUG</div><div className="rounded-full bg-white px-4 py-2.5 text-center text-[9px] font-bold text-black md:col-span-2">CREATE TENANT</div></div> : <><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="USERS" value="4"/><Metric label="MODULES" value="6"/><Metric label="STORAGE" value="1.2G"/><Metric label="STATUS" value="OK"/></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><div className="flex items-center justify-between rounded-[16px] border border-white/[0.06] px-4 py-3 text-[10px]"><span>LEADS</span><Dot/></div><div className="flex items-center justify-between rounded-[16px] border border-white/[0.06] px-4 py-3 text-[10px]"><span>TASKS</span><Dot/></div><div className="flex items-center justify-between rounded-[16px] border border-white/[0.06] px-4 py-3 text-[10px]"><span>FINANCE</span><Dot/></div></div></>}</div>
    </section>
  );
}

export default function ControlCenterCompactDemo({ tab = "overview", category = "all", queue = "all", guardianQueued = false, panel = "none" }: Props) {
  return (
    <main className="min-h-screen bg-[#07080b] text-white antialiased">
      <div className="mx-auto max-w-[1380px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
          <Link href={route({})} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-indigo-400/25 bg-indigo-400/[0.08] text-lg text-indigo-200">◎</span><span className="leading-none"><strong className="block text-[12px] tracking-[0.22em]">ORBYVEN</strong><span className="mt-1 block text-[8px] font-bold tracking-[0.28em] text-indigo-300">CONTROL</span></span></Link>
          <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.12em] text-[#85858d]"><span className="hidden sm:inline">V3 DEMO</span><span className="h-1 w-1 rounded-full bg-[#45454b]"/><span className="text-emerald-300">OWNER</span><span className="h-1 w-1 rounded-full bg-[#45454b]"/><span>MFA</span></div>
        </header>

        <nav className="my-5 flex gap-1 overflow-x-auto rounded-full border border-white/[0.07] bg-[#0b0c10] p-1 sm:w-fit">{tabs.map((item) => <Link key={item.id} href={route({ tab: item.id })} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[9px] font-bold tracking-[0.1em] ${tab === item.id ? "bg-white text-black" : "text-[#707078]"}`}><span>{item.glyph}</span>{item.label}</Link>)}</nav>

        {tab === "overview" && <Overview />}
        {tab === "integrity" && <Integrity category={category} queue={queue} guardianQueued={guardianQueued} />}
        {tab === "legal" && <Legal panel={panel} />}
        {tab === "platform" && <Platform panel={panel} />}

        <footer className="flex items-center justify-between px-1 py-4 text-[8px] font-bold tracking-[0.12em] text-[#45454d]"><span>ISOLATED DEMO</span><span>NO DATA · NO PROD</span></footer>
      </div>
    </main>
  );
}
