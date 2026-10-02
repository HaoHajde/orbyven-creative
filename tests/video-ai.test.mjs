import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildStoryboard } from "../lib/video-ai-director.ts";
import { buildRenderManifest, getVideoProviders } from "../lib/video-ai-render.ts";

test("Video AI builds deterministic bounded storyboards", () => {
  const storyboard = buildStoryboard({
    brief: "Launch ORBYVEN with homepage, AI Web Design and dashboard.",
    duration: 30,
    aspect: "9:16",
    style: "product",
  });

  assert.equal(storyboard.duration, 30);
  assert.equal(storyboard.aspect, "9:16");
  assert.equal(storyboard.style, "product");
  assert.equal(storyboard.scenes.length, 5);
  assert.equal(storyboard.scenes[0].start, 0);
  assert.equal(storyboard.scenes.at(-1)?.end, 30);
  assert.ok(storyboard.scenes.every((scene) => scene.generationPrompt.includes("ORBYVEN Creative")));
  assert.ok(storyboard.scenes.every((scene) => scene.generationPrompt.includes("no distorted text")));
});

test("Short social videos reduce scene count and switch to 30 FPS manifests", () => {
  const storyboard = buildStoryboard({
    brief: "Fast ORBYVEN social launch.",
    duration: 15,
    aspect: "9:16",
    style: "social",
  });

  const manifest = buildRenderManifest(storyboard, "wan");
  assert.equal(storyboard.scenes.length, 4);
  assert.equal(manifest.output.fps, 30);
  assert.equal(manifest.output.container, "mp4");
  assert.equal(manifest.scenes.length, storyboard.scenes.length);
});

test("Render manifests remain blocked until a provider is explicitly configured", () => {
  delete process.env.ORBYVEN_VIDEO_WAN_ENABLED;
  const storyboard = buildStoryboard({
    brief: "ORBYVEN product film.",
    duration: 30,
    aspect: "16:9",
    style: "cinematic",
  });

  const manifest = buildRenderManifest(storyboard, "wan");
  assert.equal(manifest.status, "blocked");
  assert.match(manifest.reason ?? "", /not configured yet/i);
});

test("Video provider registry exposes Wan, LTX and external adapters", () => {
  const providers = getVideoProviders();
  assert.deepEqual(
    providers.map((provider) => provider.id),
    ["wan", "ltx", "external"],
  );
  assert.ok(providers.every((provider) => provider.supports.textToVideo));
});


test("Video AI render route validates payloads and never embeds provider secrets", () => {
  const route = readFileSync(join(process.cwd(), "app/api/video-ai/render-plan/route.ts"), "utf8");
  assert.match(route, /Cache-Control": "no-store"/);
  assert.match(route, /allowedProviders/);
  assert.match(route, /buildRenderManifest/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_.*VIDEO/i);
});
