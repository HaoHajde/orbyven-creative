import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildStoryboard } from "../lib/video-ai-director.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("Video AI Director creates bounded scene plans for social durations", () => {
  const short = buildStoryboard({
    brief: "Launch ORBYVEN with Homepage, AI Web Design and Dashboard.",
    duration: 15,
    aspect: "9:16",
    style: "product",
  });
  const standard = buildStoryboard({
    brief: "Launch ORBYVEN with Homepage, AI Web Design and Dashboard.",
    duration: 30,
    aspect: "16:9",
    style: "cinematic",
  });

  assert.equal(short.scenes.length, 4);
  assert.equal(short.scenes.at(-1)?.end, 15);
  assert.equal(standard.scenes.length, 5);
  assert.equal(standard.scenes.at(-1)?.end, 30);
  assert.match(short.scenes[0].generationPrompt, /format 9:16/);
  assert.match(standard.scenes[0].generationPrompt, /Launch ORBYVEN/);
});

test("Video AI render gateway is authenticated, bounded and disabled by default", () => {
  const route = read("app/api/video-ai/render/route.ts");
  const env = read(".env.example");
  const contract = read("lib/video-ai-render.ts");

  assert.match(route, /authenticateBillingActor/);
  assert.match(route, /contentLength > 250_000/);
  assert.match(route, /Cache-Control": "no-store"/);
  assert.match(route, /ORBYVEN_VIDEO_RENDER_ENDPOINT/);
  assert.match(route, /ORBYVEN_VIDEO_RENDER_TOKEN/);
  assert.match(route, /controller\.abort\(\).*25_000|25_000/);
  assert.match(contract, /provider_required/);
  assert.match(contract, /generationPrompt\.length > 5000/);
  assert.match(env, /ORBYVEN_VIDEO_AI_ENABLED=false/);
  assert.match(env, /ORBYVEN_VIDEO_RENDER_PROVIDER=/);
  assert.match(env, /ORBYVEN_VIDEO_RENDER_ENDPOINT=/);
  assert.doesNotMatch(env, /ORBYVEN_VIDEO_RENDER_TOKEN=\S+/);
});

test("Video AI UI supports free render packages and authenticated provider rendering", () => {
  const ui = read("components/VideoAiStudio.tsx");
  const login = read("app/workspace/login/page.tsx");

  assert.match(ui, /\/api\/video-ai\/render/);
  assert.match(ui, /Prepare render package/);
  assert.match(ui, /Generate final video/);
  assert.match(ui, /Download render package/);
  assert.match(ui, /\/workspace\/login\?next=video-ai/);
  assert.match(login, /requestedNext === "video-ai"/);
  assert.match(login, /return "\/video-ai"/);
});

test("Video AI is discoverable across the public site and workspace", () => {
  const header = read("components/SiteHeader.tsx");
  const services = read("lib/public-service-catalog.ts");
  const workspace = read("components/WorkspaceShell.tsx");
  const sitemap = read("app/sitemap.ts");

  assert.match(header, /href: "\/video-ai"/);
  assert.match(header, /label: "Video AI"/);
  assert.match(services, /title: "Video AI"/);
  assert.match(services, /href: "\/video-ai"/);
  assert.match(workspace, /onOpenPath\("\/video-ai"\)/);
  assert.match(sitemap, /path: "\/video-ai"/);
});
