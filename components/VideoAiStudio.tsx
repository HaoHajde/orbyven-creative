"use client";

import SiteFooter from "@/components/SiteFooter";
import SiteFooterEn from "@/components/SiteFooterEn";
import SiteHeader from "@/components/SiteHeader";
import SiteHeaderEn from "@/components/SiteHeaderEn";
import VideoRenderHistory, { type VideoHistoryJob } from "@/components/video-ai/VideoRenderHistory";
import VideoStoryboardView from "@/components/video-ai/VideoStoryboardView";
import {
  buildStoryboard,
  type VideoAspect,
  type VideoDuration,
  type VideoStoryboard,
  type VideoStyle,
  type VideoLocale,
} from "@/lib/video-ai-director";
import { useRouter } from "next/navigation";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { getVideoAiCopy } from "@/lib/video-ai-copy";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Theme = "light" | "dark";

type RenderConfigState = {
  enabled: boolean;
  ready: boolean;
  provider: "webhook" | "wan" | "ltx" | null;
  endpointConfigured: boolean;
};

type RenderJobState = {
  id: string;
  status: "provider_required" | "queued" | "rendering" | "complete" | "failed";
  provider: "webhook" | "wan" | "ltx" | null;
  outputUrl: string | null;
  providerJobId: string | null;
  createdAt: string;
};

const durationOptions: VideoDuration[] = [15, 30, 45, 60];
const aspectOptions: VideoAspect[] = ["9:16", "16:9", "1:1"];

function formatSeconds(value: number) {
  return Number.isInteger(value) ? `${value}s` : `${value.toFixed(1)}s`;
}

export default function VideoAiStudio({ locale = "ro" }: { locale?: VideoLocale }) {
  const router = useRouter();
  const ui = getVideoAiCopy(locale);
  const styleOptions = ui.styleOptions;
  const engines = ui.engines;
  const [theme, setTheme] = useState<Theme>("dark");
  const [brief, setBrief] = useState(ui.defaultBrief);
  const [duration, setDuration] = useState<VideoDuration>(30);
  const [aspect, setAspect] = useState<VideoAspect>("9:16");
  const [style, setStyle] = useState<VideoStyle>("product");
  const [storyboard, setStoryboard] = useState<VideoStoryboard>(() =>
    buildStoryboard({ brief: ui.defaultBrief, duration: 30, aspect: "9:16", style: "product", locale }),
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [referenceUrl, setReferenceUrl] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [renderConfig, setRenderConfig] = useState<RenderConfigState | null>(null);
  const [renderJob, setRenderJob] = useState<RenderJobState | null>(null);
  const [renderPackage, setRenderPackage] = useState<Record<string, unknown> | null>(null);
  const [renderBusy, setRenderBusy] = useState(false);
  const [renderError, setRenderError] = useState("");
  const [renderHistory, setRenderHistory] = useState<VideoHistoryJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const renderRequestRef = useRef<{ id: string; fingerprint: string } | null>(null);
  const renderPending = renderJob?.status === "queued" || renderJob?.status === "rendering";
  const renderJobId = renderJob?.id ?? null;
  const renderJobStatus = renderJob?.status ?? null;

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

  useEffect(() => {
    let active = true;

    void Promise.all([
      fetch("/api/video-ai/render", { cache: "no-store" })
        .then((response) => response.json())
        .then((value: RenderConfigState) => {
          if (active) setRenderConfig(value);
        }),
      orbyvenSupabase.auth.getSession().then(({ data }) => {
        if (active) setAccessToken(data.session?.access_token ?? null);
      }),
    ]).catch((error) => {
      console.warn("ORBYVEN Video AI readiness check unavailable", error);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      !accessToken ||
      !renderJobId ||
      (renderJobStatus !== "queued" && renderJobStatus !== "rendering")
    ) {
      return;
    }

    let active = true;
    let timeout: number | undefined;

    const refresh = async () => {
      try {
        const response = await fetch(`/api/video-ai/jobs/${encodeURIComponent(renderJobId)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        const payload = (await response.json()) as { job?: RenderJobState; error?: string };
        if (!active) return;

        if (!response.ok || !payload.job) {
          throw new Error(payload.error || (locale === "ro" ? "Statusul randării nu este disponibil." : "Render status unavailable."));
        }

        setRenderJob(payload.job);
        setRenderHistory((current) => [
          payload.job!,
          ...current.filter((item) => item.id !== payload.job!.id),
        ].slice(0, 12));
        if (payload.job.status === "queued" || payload.job.status === "rendering") {
          timeout = window.setTimeout(refresh, 2500);
        } else if (renderRequestRef.current?.id === payload.job.id) {
          renderRequestRef.current = null;
        }
      } catch (error) {
        if (!active) return;
        console.warn("ORBYVEN Video AI status refresh unavailable", error);
        timeout = window.setTimeout(refresh, 5000);
      }
    };

    timeout = window.setTimeout(refresh, 1200);
    return () => {
      active = false;
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [accessToken, locale, renderJobId, renderJobStatus]);


  useEffect(() => {
    if (!accessToken) return;

    let active = true;

    void fetch("/api/video-ai/jobs", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json()) as { jobs?: VideoHistoryJob[]; error?: string };
        if (!response.ok || !payload.jobs) throw new Error(payload.error || (locale === "ro" ? "Istoricul randărilor nu este disponibil." : "History unavailable."));
        if (active) {
          setRenderHistory(payload.jobs);
          const activeJob = payload.jobs.find(
            (job) => job.status === "queued" || job.status === "rendering",
          );
          if (activeJob) setRenderJob(activeJob);
        }
      })
      .catch((error) => {
        console.warn("ORBYVEN Video AI history unavailable", error);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, locale]);

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
    setStoryboard(buildStoryboard({ brief, duration, aspect, style, locale }));
    window.requestAnimationFrame(() => {
      document.getElementById("video-ai-storyboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const copyText = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1300);
  };

  const upsertHistoryJob = (job: VideoHistoryJob) => {
    setRenderHistory((current) => [job, ...current.filter((item) => item.id !== job.id)].slice(0, 12));
  };

  const startRender = async () => {
    if (!accessToken) {
      router.push("/workspace/login?next=video-ai");
      return;
    }

    setRenderBusy(true);
    setRenderError("");
    setRenderJob(null);
    setRenderPackage(null);

    const fingerprint = JSON.stringify({
      storyboard,
      referenceUrl: referenceUrl.trim() || null,
    });
    const requestId =
      renderRequestRef.current?.fingerprint === fingerprint
        ? renderRequestRef.current.id
        : `video_${crypto.randomUUID()}`;
    renderRequestRef.current = { id: requestId, fingerprint };

    try {
      const response = await fetch("/api/video-ai/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          "X-Orbyven-Render-Id": requestId,
        },
        body: JSON.stringify({
          storyboard,
          referenceUrl: referenceUrl.trim() || undefined,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        job?: RenderJobState;
        renderPackage?: Record<string, unknown>;
      };

      if (!response.ok || !payload.job) {
        throw new Error(payload.error || ui.renderJobCreateFailed);
      }

      setRenderJob(payload.job);
      upsertHistoryJob(payload.job);
      setRenderPackage(payload.renderPackage ?? null);
      renderRequestRef.current = null;
    } catch (error) {
      setRenderError(error instanceof Error ? error.message : ui.renderJobCreateFailed);
    } finally {
      setRenderBusy(false);
    }
  };

  const downloadRenderPackage = () => {
    if (!renderPackage) return;
    const blob = new Blob([JSON.stringify(renderPackage, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${renderJob?.id ?? "orbyven-video"}-render-package.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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
      {locale === "en" ? (
        <SiteHeaderEn theme={theme} compact activePage="videoAi" onToggleTheme={toggleTheme} />
      ) : (
        <SiteHeader theme={theme} compact activePage="videoAi" onToggleTheme={toggleTheme} />
      )}

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
                {ui.heroLead}
                <span className="block text-[#8d7dff]">{ui.heroAccent}</span>
              </h1>
              <p className="mt-7 max-w-xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">
                {ui.heroBody}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {ui.steps.map(([number, title, note]) => (
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
                    {ui.directorInput}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{ui.panelTitle}</p>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)]">
                  {ui.localNoCost}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">
                  {ui.creativeBrief}
                </label>
                <textarea
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                  rows={8}
                  className="mt-3 w-full resize-none rounded-[24px] border border-[var(--border)] bg-[var(--bg)] px-5 py-4 text-[16px] leading-7 text-[var(--text)] outline-none transition focus:border-[#7668ff]/70"
                  placeholder={ui.briefPlaceholder}
                />

                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                  <ControlGroup label={ui.duration}>
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

                  <ControlGroup label={ui.format}>
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

                  <ControlGroup label={ui.direction}>
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
                  <span>{ui.generateDirection}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <VideoStoryboardView
        storyboard={storyboard}
        styleLabel={styleOptions.find((option) => option.value === storyboard.style)?.label ?? storyboard.style}
        ui={ui}
        copied={copied}
        allPrompts={allPrompts}
        copyText={copyText}
      />

      <section className="px-5 pb-16 sm:px-6 md:px-10 md:pb-24">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[34px] border border-[var(--border-strong)] bg-[var(--surface)]">
          <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
            <div className="border-b border-[var(--border)] p-6 lg:border-b-0 lg:border-r lg:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
                {ui.renderEngine}
              </p>
              <h2 className="mt-4 text-[34px] font-semibold leading-[0.98] tracking-[-0.05em]">
                {ui.renderTitle}
                <span className="block text-[#8d7dff]">{ui.renderAccent}</span>
              </h2>
              <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
                {ui.renderBody}
              </p>
            </div>

            <div className="p-5 sm:p-6 lg:p-8">
              <div className="grid gap-3 md:grid-cols-3">
                {engines.map((engine) => {
                  const providerKey = engine.name === "Wan" ? "wan" : engine.name === "LTX" ? "ltx" : "webhook";
                  const active = renderConfig?.provider === providerKey;
                  return (
                    <div
                      key={engine.name}
                      className={`rounded-[22px] border bg-[var(--bg)] p-4 transition ${
                        active ? "border-[#786aff]/60 shadow-[0_0_0_1px_rgba(120,106,255,.10)]" : "border-[var(--border)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{engine.name}</span>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            active && renderConfig?.ready
                              ? "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.6)]"
                              : active
                                ? "bg-amber-400"
                                : "bg-[var(--muted-2)]"
                          }`}
                        />
                      </div>
                      <p className="mt-5 text-[11px] font-medium text-[var(--muted)]">{engine.note}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
                        {active
                          ? renderConfig?.ready
                            ? ui.connected
                            : ui.selectedMissingEndpoint
                          : engine.status}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
                  {ui.referenceLabel}
                </label>
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={(event) => setReferenceUrl(event.target.value)}
                  placeholder="https://..."
                  className="mt-3 h-11 w-full rounded-[15px] border border-[var(--border)] bg-[var(--bg)] px-4 text-[16px] text-[var(--text)] outline-none transition focus:border-[#7668ff]/70"
                />
                <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">
                  Saved in the render contract as creative reference. The render worker decides whether it can inspect or use the source.
                </p>
              </div>

              {renderJob ? (
                <div className="mt-4 rounded-[22px] border border-[var(--border)] bg-[var(--bg)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
                        {ui.renderJob}
                      </p>
                      <p className="mt-2 text-sm font-semibold">{renderJob.id}</p>
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                      {renderJob.status.replace("_", " ")}
                    </span>
                  </div>
                  {renderJob.outputUrl ? (
                    <a
                      href={renderJob.outputUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex h-10 items-center rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold"
                    >
                      {ui.openGenerated}
                    </a>
                  ) : null}
                  {renderPackage ? (
                    <button
                      type="button"
                      onClick={downloadRenderPackage}
                      className="mt-4 inline-flex h-10 items-center rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold"
                    >
                      {ui.downloadPackage}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {renderError ? (
                <p className="mt-4 rounded-[18px] border border-red-400/20 bg-red-400/5 px-4 py-3 text-xs leading-5 text-red-300">
                  {renderError}
                </p>
              ) : null}

              <VideoRenderHistory jobs={renderHistory} loading={Boolean(accessToken) && historyLoading} locale={locale} />

              <button
                type="button"
                onClick={startRender}
                disabled={renderBusy || renderPending}
                className="mt-5 flex h-12 w-full items-center justify-between rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
              >
                <span>
                  {renderBusy
                    ? ui.preparing
                    : renderPending
                      ? ui.renderingInProgress
                      : !accessToken
                      ? ui.signInToRender
                      : renderConfig?.ready
                        ? ui.generateFinalVideo
                        : ui.preparePackage}
                </span>
                <span>
                  {renderConfig?.ready
                    ? renderConfig.provider?.toUpperCase()
                    : accessToken
                      ? ui.noGpuCost
                      : ui.loginRequired}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {locale === "en" ? (
        <SiteFooterEn theme={theme} activePage="home" />
      ) : (
        <SiteFooter theme={theme} activePage="home" />
      )}
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
