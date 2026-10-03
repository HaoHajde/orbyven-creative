"use client";

import { motion } from "framer-motion";
import type { VideoStoryboard } from "@/lib/video-ai-director";
import type { VideoAiCopy } from "@/lib/video-ai-copy";

function formatSeconds(value: number) {
  return Number.isInteger(value) ? `${value}s` : `${value.toFixed(1)}s`;
}

function SceneDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">{label}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--muted)]">
      {children}
    </span>
  );
}

export default function VideoStoryboardView({
  storyboard,
  styleLabel,
  ui,
  copied,
  allPrompts,
  copyText,
}: {
  storyboard: VideoStoryboard;
  styleLabel: string;
  ui: VideoAiCopy;
  copied: string | null;
  allPrompts: string;
  copyText: (id: string, value: string) => Promise<void>;
}) {
  return (
    <section
      id="video-ai-storyboard"
      className="scroll-mt-28 border-t border-[var(--border)] px-5 py-16 sm:px-6 md:px-10 md:py-24"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">
              {ui.generatedDirection}
            </p>
            <h2 className="mt-4 text-[42px] font-semibold leading-[0.95] tracking-[-0.055em] sm:text-[62px]">
              {storyboard.scenes.length} {ui.scenesSuffix}
              <span className="text-[#8d7dff]"> {ui.visualSystem}</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
            <Badge>{storyboard.duration}s</Badge>
            <Badge>{storyboard.aspect}</Badge>
            <Badge>{styleLabel}</Badge>
            <button
              type="button"
              onClick={() => void copyText("all", allPrompts)}
              className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 transition hover:border-[#7668ff]/60"
            >
              {copied === "all" ? ui.copied : ui.copyAll}
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
                      {ui.scene} {String(scene.index).padStart(2, "0")}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{formatSeconds(scene.start)}</p>
                  </div>
                  <div className="text-right md:text-left">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted-2)]">{ui.end}</p>
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
                    <SceneDetail label={ui.camera} value={scene.camera} />
                    <SceneDetail label={ui.transition} value={scene.transition} />
                  </div>

                  <div className="mt-4 rounded-[20px] border border-[var(--border)] bg-[var(--bg)] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
                        {ui.generationPrompt}
                      </p>
                      <button
                        type="button"
                        onClick={() => void copyText(scene.id, scene.generationPrompt)}
                        className="text-[11px] font-semibold text-[#9488ff] transition hover:text-[#b0a8ff]"
                      >
                        {copied === scene.id ? ui.copied : ui.copy}
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
  );
}
