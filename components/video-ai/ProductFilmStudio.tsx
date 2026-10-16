"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

type Locale = "ro" | "en";
type FilmSceneId = "intro" | "presence" | "create" | "control" | "connect" | "outro";

type FilmScene = {
  id: FilmSceneId;
  start: number;
  end: number;
  label: string;
  note: string;
  src?: string;
  scrollDepth?: number;
};

type ProductFilmCopy = {
  eyebrow: string;
  title: string;
  body: string;
  preview: string;
  record: string;
  recording: string;
  restart: string;
  fullscreen: string;
  back: string;
  exportNote: string;
  browserNote: string;
  ready: string;
  chooseTab: string;
  completed: string;
  error: string;
};

type CropTrack = MediaStreamTrack & {
  cropTo?: (target: unknown) => Promise<void>;
};

type CropTargetConstructor = {
  fromElement?: (element: Element) => Promise<unknown>;
};

const FPS = 60;
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
const FILM_DURATION = 22;
const FADE_SECONDS = 0.55;

const copy: Record<Locale, ProductFilmCopy> = {
  ro: {
    eyebrow: "ORBYVEN VIDEO AI · PRODUCT FILM ENGINE",
    title: "Filmează produsul real. Nu screenshot-uri.",
    body:
      "Scenele folosesc paginile ORBYVEN live, cu scroll, UI și stări reale. Timeline-ul este animat continuu, iar exportul înregistrează exact scena verticală la 60 fps.",
    preview: "Pornește preview",
    record: "Înregistrează 1080×1920",
    recording: "Se înregistrează…",
    restart: "Repornește",
    fullscreen: "Fullscreen",
    back: "Înapoi la Video AI",
    exportNote: "Export gratuit în browser · WebM · 1080×1920 · 60 fps țintă",
    browserNote: "Pentru cea mai bună calitate folosește Chrome și selectează tab-ul curent când browserul cere sursa.",
    ready: "Live UI ready",
    chooseTab: "Selectează tab-ul ORBYVEN în dialogul de captură. Înregistrarea începe după confirmare.",
    completed: "Clipul a fost generat și descărcat.",
    error: "Înregistrarea nu a putut fi pornită.",
  },
  en: {
    eyebrow: "ORBYVEN VIDEO AI · PRODUCT FILM ENGINE",
    title: "Film the real product. Not screenshots.",
    body:
      "Scenes use live ORBYVEN pages with real scrolling, UI and application states. The timeline animates continuously and the browser export records the vertical stage at 60 fps.",
    preview: "Play preview",
    record: "Record 1080×1920",
    recording: "Recording…",
    restart: "Restart",
    fullscreen: "Fullscreen",
    back: "Back to Video AI",
    exportNote: "Free browser export · WebM · 1080×1920 · 60 fps target",
    browserNote: "For best quality use Chrome and choose the current ORBYVEN tab when the browser asks for a capture source.",
    ready: "Live UI ready",
    chooseTab: "Choose the ORBYVEN tab in the capture dialog. Recording starts after confirmation.",
    completed: "The film was generated and downloaded.",
    error: "Recording could not be started.",
  },
};

const sceneCopy: Record<Locale, Record<FilmSceneId, { label: string; note: string }>> = {
  ro: {
    intro: { label: "ORBYVEN", note: "Build. Manage. Grow." },
    presence: { label: "Presence", note: "Website real, în mișcare." },
    create: { label: "Create", note: "AI Web Design, live." },
    control: { label: "Control", note: "Workspace și dashboard real." },
    connect: { label: "Connect", note: "Același sistem, mai multe suprafețe." },
    outro: { label: "ORBYVEN", note: "One platform. Your business." },
  },
  en: {
    intro: { label: "ORBYVEN", note: "Build. Manage. Grow." },
    presence: { label: "Presence", note: "The real website in motion." },
    create: { label: "Create", note: "AI Web Design, live." },
    control: { label: "Control", note: "The real workspace and dashboard." },
    connect: { label: "Connect", note: "One system across every surface." },
    outro: { label: "ORBYVEN", note: "One platform. Your business." },
  },
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeInOutSine(value: number) {
  const t = clamp(value);
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function sceneOpacity(scene: FilmScene, time: number) {
  if (time < scene.start || time > scene.end) return 0;
  const fadeIn = clamp((time - scene.start) / FADE_SECONDS);
  const fadeOut = clamp((scene.end - time) / FADE_SECONDS);
  return Math.min(fadeIn, fadeOut, 1);
}

function sceneProgress(scene: FilmScene, time: number) {
  return easeInOutSine((time - scene.start) / Math.max(0.001, scene.end - scene.start));
}

function bestMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function waitForVideo(video: HTMLVideoElement) {
  return new Promise<void>((resolve, reject) => {
    if (video.readyState >= 2 && video.videoWidth > 0) {
      resolve();
      return;
    }
    const timer = window.setTimeout(() => reject(new Error("CAPTURE_VIDEO_TIMEOUT")), 8000);
    video.addEventListener(
      "loadedmetadata",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

function LiveSurface({
  src,
  title,
  iframeRef,
  progress,
  compact = false,
}: {
  src: string;
  title: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  progress: number;
  compact?: boolean;
}) {
  const scale = compact ? 1.015 : 1.025 + progress * 0.012;
  const translateY = compact ? 0 : -10 * progress;

  return (
    <div
      className={`relative overflow-hidden border border-white/10 bg-[#08080a] shadow-[0_40px_120px_rgba(0,0,0,.48)] ${
        compact ? "rounded-[34px]" : "rounded-[42px]"
      }`}
      style={{
        width: compact ? "43%" : "88%",
        height: compact ? "59%" : "71%",
      }}
    >
      <div className="absolute inset-x-0 top-0 z-20 flex h-10 items-center gap-2 border-b border-white/[0.07] bg-black/70 px-4 backdrop-blur-xl">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/10" />
        <span className="h-2 w-2 rounded-full bg-white/[0.07]" />
        <span className="ml-2 truncate text-[9px] font-medium tracking-[0.08em] text-white/35">{title}</span>
      </div>
      <div
        className="absolute inset-0 pt-10 will-change-transform"
        style={{ transform: `translate3d(0, ${translateY}px, 0) scale(${scale})` }}
      >
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          tabIndex={-1}
          aria-hidden="true"
          className="h-full w-full border-0 bg-black"
          style={{ pointerEvents: "none" }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(115deg,transparent_22%,rgba(255,255,255,.055)_45%,transparent_61%)] opacity-50" />
      <div className="pointer-events-none absolute inset-0 z-30 shadow-[inset_0_0_80px_rgba(0,0,0,.34)]" />
    </div>
  );
}

function BrandScene({ label, note, progress, closing = false }: { label: string; note: string; progress: number; closing?: boolean }) {
  const lift = (1 - progress) * 18;
  const scale = 0.985 + progress * 0.015;
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="text-center will-change-transform"
        style={{ transform: `translate3d(0, ${lift}px, 0) scale(${scale})` }}
      >
        <div className="mx-auto mb-8 h-px w-24 bg-gradient-to-r from-transparent via-[#8b7cff]/80 to-transparent" />
        <h2 className="text-[70px] font-semibold tracking-[-0.075em] text-white sm:text-[86px]">{label}</h2>
        <p className="mt-5 text-[13px] font-medium tracking-[0.22em] text-white/42">{note}</p>
        {closing ? <p className="mt-10 text-[10px] uppercase tracking-[0.24em] text-white/25">orbyven.com</p> : null}
      </div>
    </div>
  );
}

export default function ProductFilmStudio({ locale = "ro" }: { locale?: Locale }) {
  const ui = copy[locale];
  const stageRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLIFrameElement>(null);
  const aiRef = useRef<HTMLIFrameElement>(null);
  const workspaceRef = useRef<HTMLIFrameElement>(null);
  const workspaceMobileRef = useRef<HTMLIFrameElement>(null);
  const rafRef = useRef<number | null>(null);
  const runTokenRef = useRef(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingMode, setRecordingMode] = useState(false);
  const [status, setStatus] = useState(ui.ready);

  const scenes = useMemo<FilmScene[]>(() => {
    const labels = sceneCopy[locale];
    return [
      { id: "intro", start: 0, end: 2.2, ...labels.intro },
      { id: "presence", start: 1.8, end: 6.2, src: "/", scrollDepth: 0.26, ...labels.presence },
      { id: "create", start: 5.7, end: 11.1, src: "/ai-web-design", scrollDepth: 0.2, ...labels.create },
      { id: "control", start: 10.6, end: 16.2, src: "/workspace", scrollDepth: 0.14, ...labels.control },
      { id: "connect", start: 15.7, end: 19.5, src: "/workspace", scrollDepth: 0.08, ...labels.connect },
      { id: "outro", start: 19, end: FILM_DURATION, ...labels.outro },
    ];
  }, [locale]);

  const stopPlayback = useCallback(() => {
    runTokenRef.current += 1;
    if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlaying(false);
  }, []);

  const startPlayback = useCallback(
    (onComplete?: () => void) => {
      stopPlayback();
      const token = runTokenRef.current;
      const startedAt = performance.now();
      setTime(0);
      setPlaying(true);

      const tick = (now: number) => {
        if (runTokenRef.current !== token) return;
        const elapsed = (now - startedAt) / 1000;
        const next = Math.min(FILM_DURATION, elapsed);
        setTime(next);
        if (elapsed >= FILM_DURATION) {
          setPlaying(false);
          rafRef.current = null;
          onComplete?.();
          return;
        }
        rafRef.current = window.requestAnimationFrame(tick);
      };

      rafRef.current = window.requestAnimationFrame(tick);
    },
    [stopPlayback],
  );

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  useEffect(() => {
    const bindings: Array<[FilmSceneId, RefObject<HTMLIFrameElement | null>]> = [
      ["presence", homeRef],
      ["create", aiRef],
      ["control", workspaceRef],
      ["connect", workspaceMobileRef],
    ];

    for (const [id, ref] of bindings) {
      const scene = scenes.find((item) => item.id === id);
      if (!scene || !scene.scrollDepth || !ref.current?.contentWindow) continue;
      try {
        const progress = sceneProgress(scene, time);
        const win = ref.current.contentWindow;
        const doc = win.document.documentElement;
        const maxScroll = Math.max(0, doc.scrollHeight - win.innerHeight);
        win.scrollTo(0, maxScroll * scene.scrollDepth * progress);
      } catch {
        // Same-origin pages are expected. If a deployment redirects elsewhere, keep the live surface without scripted scroll.
      }
    }
  }, [scenes, time]);

  const requestFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen().catch(() => undefined);
  };

  const recordFilm = async () => {
    if (!stageRef.current || recording) return;
    if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === "undefined") {
      setStatus(locale === "ro" ? "Browserul nu suportă captură video modernă." : "This browser does not support modern video capture.");
      return;
    }

    setRecording(true);
    setRecordingMode(true);
    setStatus(ui.chooseTab);
    stopPlayback();

    let sourceStream: MediaStream | null = null;
    let outputStream: MediaStream | null = null;
    let drawFrame = 0;

    try {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));

      sourceStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: FPS, max: FPS },
          width: { ideal: OUTPUT_WIDTH },
          height: { ideal: OUTPUT_HEIGHT },
        },
        audio: true,
      });

      const sourceVideo = document.createElement("video");
      sourceVideo.srcObject = sourceStream;
      sourceVideo.muted = true;
      sourceVideo.playsInline = true;
      await sourceVideo.play();
      await waitForVideo(sourceVideo);

      const sourceTrack = sourceStream.getVideoTracks()[0] as CropTrack | undefined;
      const cropTarget = (window as unknown as { CropTarget?: CropTargetConstructor }).CropTarget;
      if (sourceTrack?.cropTo && cropTarget?.fromElement && stageRef.current) {
        try {
          const target = await cropTarget.fromElement(stageRef.current);
          await sourceTrack.cropTo(target);
          await new Promise((resolve) => window.setTimeout(resolve, 120));
        } catch {
          // Canvas cropping below remains the deterministic fallback.
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("CANVAS_UNAVAILABLE");

      const paint = () => {
        if (!stageRef.current || sourceVideo.readyState < 2) {
          drawFrame = window.requestAnimationFrame(paint);
          return;
        }

        const rect = stageRef.current.getBoundingClientRect();
        const viewportWidth = Math.max(1, window.innerWidth);
        const viewportHeight = Math.max(1, window.innerHeight);
        const scaleX = sourceVideo.videoWidth / viewportWidth;
        const scaleY = sourceVideo.videoHeight / viewportHeight;
        const sx = Math.max(0, rect.left * scaleX);
        const sy = Math.max(0, rect.top * scaleY);
        const sw = Math.min(sourceVideo.videoWidth - sx, rect.width * scaleX);
        const sh = Math.min(sourceVideo.videoHeight - sy, rect.height * scaleY);

        context.fillStyle = "#000000";
        context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
        if (sw > 1 && sh > 1) {
          context.drawImage(sourceVideo, sx, sy, sw, sh, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
        }
        drawFrame = window.requestAnimationFrame(paint);
      };
      paint();

      outputStream = canvas.captureStream(FPS);
      for (const audioTrack of sourceStream.getAudioTracks()) outputStream.addTrack(audioTrack);

      const mimeType = bestMimeType();
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(outputStream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: 18_000_000,
        audioBitsPerSecond: 256_000,
      });

      const stopped = new Promise<Blob>((resolve, reject) => {
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        });
        recorder.addEventListener(
          "stop",
          () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" })),
          { once: true },
        );
        recorder.addEventListener("error", () => reject(new Error("MEDIA_RECORDER_FAILED")), { once: true });
      });

      recorder.start(250);
      setStatus(ui.recording);

      await new Promise<void>((resolve) => {
        startPlayback(() => window.setTimeout(resolve, 280));
      });

      if (recorder.state !== "inactive") recorder.stop();
      const blob = await stopped;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `orbyven-product-film-${new Date().toISOString().slice(0, 10)}.webm`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus(ui.completed);
    } catch (error) {
      console.error("ORBYVEN Product Film recording failed", error);
      setStatus(ui.error);
    } finally {
      if (drawFrame) window.cancelAnimationFrame(drawFrame);
      sourceStream?.getTracks().forEach((track) => track.stop());
      outputStream?.getTracks().forEach((track) => track.stop());
      setRecording(false);
      setRecordingMode(false);
    }
  };

  const progressPct = `${(time / FILM_DURATION) * 100}%`;
  const activeScene = scenes.find((scene) => time >= scene.start && time <= scene.end) ?? scenes[0];

  const stageStyle = {
    "--film-progress": progressPct,
  } as CSSProperties;

  return (
    <main className="min-h-screen bg-[#050506] text-white antialiased">
      <div
        className={`transition ${recordingMode ? "pointer-events-none fixed inset-0 z-[999] flex items-center justify-center bg-black" : ""}`}
      >
        <div
          ref={stageRef}
          data-product-film-stage
          style={stageStyle}
          className={`relative isolate aspect-[9/16] overflow-hidden bg-[#030304] shadow-[0_30px_120px_rgba(0,0,0,.68)] ${
            recordingMode ? "h-screen max-h-screen w-auto" : "w-full max-w-[520px]"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 z-[80] bg-[radial-gradient(circle_at_50%_42%,rgba(106,83,255,.10),transparent_42%)]" />
          <div className="pointer-events-none absolute inset-0 z-[90] shadow-[inset_0_0_160px_rgba(0,0,0,.60)]" />

          {scenes.map((scene) => {
            const opacity = sceneOpacity(scene, time);
            const progress = sceneProgress(scene, time);
            if (opacity <= 0.001) return null;

            if (scene.id === "intro" || scene.id === "outro") {
              return (
                <section key={scene.id} className="absolute inset-0 z-10" style={{ opacity }}>
                  <BrandScene label={scene.label} note={scene.note} progress={progress} closing={scene.id === "outro"} />
                </section>
              );
            }

            if (scene.id === "connect") {
              return (
                <section key={scene.id} className="absolute inset-0 z-20 flex flex-col items-center justify-center" style={{ opacity }}>
                  <div className="absolute left-[8%] top-[11%]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">{scene.label}</p>
                    <p className="mt-2 text-[22px] font-semibold tracking-[-0.045em] text-white/92">{scene.note}</p>
                  </div>
                  <div className="relative mt-24 flex h-[67%] w-full items-end justify-center gap-4 px-[6%]">
                    <LiveSurface src="/workspace" title="ORBYVEN Workspace" iframeRef={workspaceRef} progress={progress} compact />
                    <div
                      className="relative h-[75%] w-[30%] overflow-hidden rounded-[34px] border border-white/10 bg-[#08080a] shadow-[0_34px_90px_rgba(0,0,0,.54)]"
                      style={{ transform: `translate3d(0, ${8 - progress * 14}px, 0)` }}
                    >
                      <iframe
                        ref={workspaceMobileRef}
                        src="/workspace"
                        title="ORBYVEN mobile workspace"
                        tabIndex={-1}
                        aria-hidden="true"
                        className="h-full w-full border-0 bg-black"
                        style={{ pointerEvents: "none" }}
                      />
                      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_55px_rgba(0,0,0,.32)]" />
                    </div>
                  </div>
                </section>
              );
            }

            const iframeRef = scene.id === "presence" ? homeRef : scene.id === "create" ? aiRef : workspaceRef;
            return (
              <section key={scene.id} className="absolute inset-0 z-20 flex flex-col items-center justify-center" style={{ opacity }}>
                <div className="absolute left-[8%] top-[9.5%] z-40">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">{scene.label}</p>
                  <p className="mt-2 text-[24px] font-semibold tracking-[-0.05em] text-white/92">{scene.note}</p>
                </div>
                <div className="mt-16 flex h-[78%] w-full items-center justify-center">
                  <LiveSurface src={scene.src!} title={`ORBYVEN ${scene.label}`} iframeRef={iframeRef} progress={progress} />
                </div>
              </section>
            );
          })}

          <div className="pointer-events-none absolute bottom-0 left-0 z-[100] h-[2px] w-full bg-white/[0.05]">
            <div className="h-full bg-[#8b7cff]/70" style={{ width: progressPct }} />
          </div>
        </div>
      </div>

      {!recordingMode ? (
        <div className="mx-auto grid min-h-screen max-w-[1420px] gap-10 px-5 py-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-10">
          <section className="max-w-xl py-6">
            <Link href={locale === "en" ? "/en/video-ai" : "/video-ai"} className="text-xs font-semibold text-white/42 transition hover:text-white/75">
              ← {ui.back}
            </Link>
            <p className="mt-12 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9387ff]">{ui.eyebrow}</p>
            <h1 className="mt-5 text-[clamp(46px,7vw,82px)] font-semibold leading-[0.92] tracking-[-0.065em]">{ui.title}</h1>
            <p className="mt-7 max-w-lg text-[15px] leading-7 text-white/52">{ui.body}</p>

            <div className="mt-8 rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-white/78">{activeScene.label}</span>
                <span className="text-[10px] font-semibold tabular-nums text-white/34">
                  {time.toFixed(1)} / {FILM_DURATION}s
                </span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-[#7d6cff] transition-[width] duration-75" style={{ width: progressPct }} />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => startPlayback()}
                disabled={recording}
                className="h-12 rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {playing ? ui.restart : ui.preview}
              </button>
              <button
                type="button"
                onClick={recordFilm}
                disabled={recording}
                className="h-12 rounded-full border border-[#7e70ff]/45 bg-[#7567ff]/10 px-5 text-sm font-semibold text-[#b8b1ff] transition hover:border-[#8c80ff]/70 hover:bg-[#7567ff]/15 disabled:opacity-50"
              >
                {recording ? ui.recording : ui.record}
              </button>
              <button
                type="button"
                onClick={requestFullscreen}
                className="h-11 rounded-full border border-white/[0.08] px-5 text-xs font-semibold text-white/54 transition hover:text-white/80"
              >
                {ui.fullscreen}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopPlayback();
                  setTime(0);
                  setStatus(ui.ready);
                }}
                className="h-11 rounded-full border border-white/[0.08] px-5 text-xs font-semibold text-white/54 transition hover:text-white/80"
              >
                {ui.restart}
              </button>
            </div>

            <p className="mt-6 text-[11px] font-medium text-white/40">{ui.exportNote}</p>
            <p className="mt-2 text-[11px] leading-5 text-white/28">{ui.browserNote}</p>
            <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold text-white/45">
              <span className={`h-2 w-2 rounded-full ${recording ? "animate-pulse bg-red-400" : "bg-emerald-400"}`} />
              {status}
            </div>
          </section>

          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[520px] rounded-[34px] border border-white/[0.08] bg-white/[0.025] p-3 shadow-[0_50px_160px_rgba(0,0,0,.52)]">
              <div className="mb-3 flex items-center justify-between px-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">Live product stage</span>
                <span className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[9px] font-semibold text-white/34">9:16 · {FPS} FPS</span>
              </div>
              <div className="pointer-events-none aspect-[9/16] w-full" aria-hidden="true" />
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
