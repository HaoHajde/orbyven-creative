"use client";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  buildStoryboard,
  type VideoAspect,
  type VideoDuration,
  type VideoStoryboard,
  type VideoStyle,
} from "@/lib/video-ai-director";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

type Theme = "light" | "dark";

const defaultBrief =
  "Create a premium ORBYVEN Creative launch video that moves fluidly through Homepage, Templates, AI Web Design, Dashboard, connected modules and AI actions. Keep the real ORBYVEN product recognizable, use minimal text and cinematic continuous transitions.";

const durationOptions: VideoDuration[] = [15, 30, 45, 60];
const aspectOptions: VideoAspect[] = ["9:16", "16:9", "1:1"];
const styleOptions: { value: VideoStyle; label: string; detail: string }[] = [
  { value: "product", label: "Product launch", detail: "Precise, premium, product-first." },
  { value: "cinematic", label: "Cinematic", detail: "More atmosphere, depth and camera movement." },
  { value: "minimal-ui", label: "UI showcase", detail: "Sharper focus on the real interface." },
  { value: "social", label: "Social", detail: "Faster retention for Reels, TikTok and Shorts." },
];

const engines = [
  { name: "Wan", note: "Self-host / GPU", status: "Ready to connect" },
  { name: "LTX", note: "Self-host / GPU", status: "Ready to connect" },
  { name: "External API", note: "Fastest prototype", status: "Optional" },
];

function formatSeconds(value: number) {
  return Number.isInteger(value) ? `${value}s` : `${value.toFixed(1)}s`;
}

export default function VideoAiStudio() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [brief, setBrief] = useState(defaultBrief);
  const [duration, setDuration] = useState<VideoDuration>(30);
  const [aspect, setAspect] = useState<VideoAspect>("9:16");
  const [style, setStyle] = useState<VideoStyle>("product");
  const [storyboard, setStoryboard] = useState<VideoStoryboard>(() =>
    buildStoryboard({ brief: defaultBrief, duration: 30, aspect: "9:16", style: "product" }),
  );
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("studio-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextTheme: Theme = saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";
      setTheme(nextTheme);
      document.documentElement.style.colorScheme = nextTheme;
      document.body.style.backgroundColor = nextTheme === "dark" ? "#000000" : "#ffffff";
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const vars = useMemo(
    () =>
      ({
        "--bg": theme === "dark" ? "#050506" : "#fbfbfd",
        "--surface": theme === "dark" ? "#0d0d10" : "#ffffff",
        "--surface-2": theme === "dark" ? "#141419" : "#f3f2f8",
        "--text": theme === "dark" ? "#f7f7fa" : "#171719",
        "--muted": theme === "dark" ? "#a5a5ad" : "#686870",
        "--muted-2": theme === "dark" ? "#74747c" : "#85858d",
        "--border": theme === "dark" ? "rgba(255,255,255,.09)" : "rgba(26,22,45,.09)",
        "--border-strong": theme === "dark" ? "rgba(255,255,255,.16)" : "rgba(67,49,120,.16)",
        "--button": theme === "dark" ? "#f5f5f7" : "#171719",
        "--button-text": theme === "dark" ? "#050506" : "#ffffff",
        "--accent": "#6d5dfc",
        "--accent-soft": theme === "dark" ? "rgba(109,93,252,.20)" : "rgba(109,93,252,.10)",
        "--accent-soft-2": theme === "dark" ? "rgba(137,91,255,.13)" : "rgba(137,91,255,.08)",
      }) as CSSProperties,
    [theme],
  );

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#000000" : "#ffffff";
      return next;
    });
  };

  const generateDirection = () => {
    setStoryboard(buildStoryboard({ brief, duration, aspect, style }));
    window.requestAnimationFrame(() => {
      document.getElementById("video-ai-storyboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const copyText = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1300);
  };

  const allPrompts = storyboard.scenes
    .map(
      (scene) =>
        `SCENE ${scene.index} — ${scene.title} (${formatSeconds(scene.start)}–${formatSeconds(scene.end)})\n${scene.generationPrompt}`,
    )
    .join("\n\n");

  return (
    <main
      style={{
        ...vars,
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="min-h-screen overflow-x-clip antialiased"
    >
      <SiteHeader theme={theme} compact activePage="videoAi" onToggleTheme={toggleTheme} />

      <section className="relative overflow-hidden px-5 pb-16 pt-32 sm:px-6 md:px-10 md:pb-24 md:pt-40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-180px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-[160px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-180px] top-[360px] h-[420px] w-[420px] rounded-full bg-[var(--accent-soft-2)] blur-[130px]"
        />

        <div className="relative mx-auto max-w-[1500px]">
          <div className="grid gap-12 xl:grid-cols-[0.82fr_1.18fr] xl:items-start">
            <div className="xl:sticky xl:top-28">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--muted-2)]">
                ORBYVEN VIDEO AI · MVP 0.1
              </p>
              <h1 className="mt-5 max-w-3xl text-[clamp(48px,8vw,96px)] font-semibold leading-[0.9] tracking-[-0.065em]">
                Direct the idea.
                <span className="block text-[#8d7dff]">Build the film.</span>
              </h1>
              <p className="mt-7 max-w-xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">
                The first ORBYVEN Video AI layer turns a business brief into a production-ready storyboard:
                timing, camera, transitions, copy and generation prompts for every shot.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {[
                  ["01", "Director", "Understands the commercial goal."],
                  ["02", "Storyboard", "Builds scene-by-scene motion direction."],
                  ["03", "Render layer", "Prepared for Wan, LTX or an API engine."],
                ].map(([number, title, note]) => (
                  <div
                    key={number}
                    className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-semibold tracking-[0.16em] text-[var(--muted-2)]">
                        {number}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#7567ff] shadow-[0_0_18px_rgba(117,103,255,.8)]" />
                    </div>
                    <h2 className="mt-5 text-sm font-semibold">{title}</h2>
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[34px] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[0_40px_110px_rgba(0,0,0,.18)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
                    Director input
                  </p>
                  <p className="mt-1 text-sm font-semibold">Describe the result, not the technical prompt.</p>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)]">
                  LOCAL · NO GENERATION COST
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">
                  Creative brief
                </label>
                <textarea
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                  rows={8}
                  className="mt-3 w-full resize-none rounded-[24px] border border-[var(--border)] bg-[var(--bg)] px-5 py-4 text-[16px] leading-7 text-[var(--text)] outline-none transition focus:border-[#7668ff]/70"
                  placeholder="Example: Create a 30-second premium launch film..."
                />

                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                  <ControlGroup label="Duration">
                    <div className="grid grid-cols-4 gap-2">
                      {durationOptions.map((value) => (
                        <OptionButton
                          key={value}
                          active={duration === value}
                          onClick={() => setDuration(value)}
                          label={`${value}s`}
                        />
                      ))}
                    </div>
                  </ControlGroup>

                  <ControlGroup label="Format">
                    <div className="grid grid-cols-3 gap-2">
                      {aspectOptions.map((value) => (
                        <OptionButton
                          key={value}
                          active={aspect === value}
                          onClick={() => setAspect(value)}
                          label={value}
                        />
                      ))}
                    </div>
                  </ControlGroup>

                  <ControlGroup label="Direction">
                    <select
                      value={style}
                      onChange={(event) => setStyle(event.target.value as VideoStyle)}
                      className="h-11 w-full rounded-[15px] border border-[var(--border)] bg-[var(--bg)] px-3 text-sm font-medium text-[var(--text)] outline-none focus:border-[#7668ff]/70"
                    >
                      {styleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </ControlGroup>
                </div>

                <div className="mt-6 rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs font-semibold">
                    {styleOptions.find((option) => option.value === style)?.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    {styleOptions.find((option) => option.value === style)?.detail}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={generateDirection}
                  className="mt-6 flex h-[52px] w-full items-center justify-between rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)] transition hover:-translate-y-0.5"
                >
                  <span>Generate direction</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="video-ai-storyboard"
        className="scroll-mt-28 border-t border-[var(--border)] px-5 py-16 sm:px-6 md:px-10 md:py-24"
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">
                Generated direction
              </p>
              <h2 className="mt-4 text-[42px] font-semibold leading-[0.95] tracking-[-0.055em] sm:text-[62px]">
                {storyboard.scenes.length} scenes.
                <span className="text-[#8d7dff]"> One visual system.</span>
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
              <Badge>{storyboard.duration}s</Badge>
              <Badge>{storyboard.aspect}</Badge>
              <Badge>{styleOptions.find((option) => option.value === storyboard.style)?.label ?? storyboard.style}</Badge>
              <button
                type="button"
                onClick={() => copyText("all", allPrompts)}
                className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 transition hover:border-[#7668ff]/60"
              >
                {copied === "all" ? "Copied" : "Copy all prompts"}
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-4">
            {storyboard.scenes.map((scene, index) => (
              <motion.article
                key={scene.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.18) }}
                className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="grid md:grid-cols-[150px_1fr]">
                  <div className="flex min-h-[150px] flex-row items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface-2)] p-5 md:flex-col md:items-start md:border-b-0 md:border-r">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                        Scene {String(scene.index).padStart(2, "0")}
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                        {formatSeconds(scene.start)}
                      </p>
                    </div>
                    <div className="text-right md:text-left">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted-2)]">End</p>
                      <p className="mt-1 text-xs font-semibold">{formatSeconds(scene.end)}</p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-[26px] font-semibold tracking-[-0.045em]">{scene.title}</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{scene.purpose}</p>
                      </div>
                      <span className="w-fit rounded-full border border-[#786aff]/25 bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-semibold text-[#9c91ff]">
                        {scene.onScreenText}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-3 lg:grid-cols-2">
                      <SceneDetail label="Camera" value={scene.camera} />
                      <SceneDetail label="Transition" value={scene.transition} />
                    </div>

                    <div className="mt-4 rounded-[20px] border border-[var(--border)] bg-[var(--bg)] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
                          Generation prompt
                        </p>
                        <button
                          type="button"
                          onClick={() => copyText(scene.id, scene.generationPrompt)}
                          className="text-[11px] font-semibold text-[#9488ff] transition hover:text-[#b0a8ff]"
                        >
                          {copied === scene.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">{scene.generationPrompt}</p>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-6 md:px-10 md:pb-24">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[34px] border border-[var(--border-strong)] bg-[var(--surface)]">
          <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
            <div className="border-b border-[var(--border)] p-6 lg:border-b-0 lg:border-r lg:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
                Render engine
              </p>
              <h2 className="mt-4 text-[34px] font-semibold leading-[0.98] tracking-[-0.05em]">
                Director is live.
                <span className="block text-[#8d7dff]">Rendering comes next.</span>
              </h2>
              <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
                The interface and scene contract are provider-independent. We can attach a local GPU model or a temporary API without rebuilding the product.
              </p>
            </div>

            <div className="p-5 sm:p-6 lg:p-8">
              <div className="grid gap-3 md:grid-cols-3">
                {engines.map((engine) => (
                  <div key={engine.name} className="rounded-[22px] border border-[var(--border)] bg-[var(--bg)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{engine.name}</span>
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                    </div>
                    <p className="mt-5 text-[11px] font-medium text-[var(--muted)]">{engine.note}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--muted-2)]">{engine.status}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled
                className="mt-5 flex h-12 w-full cursor-not-allowed items-center justify-between rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-5 text-sm font-semibold text-[var(--muted-2)]"
              >
                <span>Generate final video</span>
                <span>Engine required</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="home" />
    </main>
  );
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">{label}</p>
      {children}
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-11 rounded-[15px] border text-xs font-semibold transition ${
        active
          ? "border-[#786aff]/60 bg-[var(--accent-soft)] text-[var(--text)]"
          : "border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--border-strong)]"
      }`}
    >
      {label}
    </button>
  );
}

function SceneDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">{label}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--muted)]">
      {children}
    </span>
  );
}
