import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildStoryboard } from "../lib/video-ai-director.ts";
import { buildVideoProviderPayload } from "../lib/video-ai-render.ts";

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
  const copy = read("lib/video-ai-copy.ts");
  assert.match(copy, /Prepare render package/);
  assert.match(copy, /Generate final video/);
  assert.match(copy, /Download render package/);
  assert.match(ui, /\/workspace\/login\?next=video-ai/);
  assert.match(login, /requestedNext === "video-ai"/);
  assert.match(login, /return "\/video-ai"/);
});

test("Video AI is discoverable across the public site and workspace", () => {
  const header = read("components/SiteHeader.tsx");
  const services = read("app/servicii/page.tsx");
  const workspace = read("components/WorkspaceShell.tsx");
  const sitemap = read("app/sitemap.ts");

  assert.match(header, /href: "\/video-ai"/);
  assert.match(header, /label: "Video AI"/);
  assert.match(services, /title: "Video AI"/);
  assert.match(services, /href: "\/video-ai"/);
  assert.match(workspace, /onOpenPath\("\/video-ai"\)/);
  assert.match(sitemap, /path: "\/video-ai"/);
});


test("Video AI persists jobs server-side and exposes authenticated status only", () => {
  const jobs = read("lib/video-ai-jobs.ts");
  const status = read("app/api/video-ai/jobs/[id]/route.ts");
  const callback = read("app/api/video-ai/render/callback/route.ts");
  const render = read("app/api/video-ai/render/route.ts");

  assert.match(jobs, /from\("video_ai_jobs"\)/);
  assert.match(jobs, /organization_id/);
  assert.match(jobs, /actor_id/);
  assert.match(render, /createVideoJob/);
  assert.match(render, /updateVideoJob/);
  assert.match(status, /authenticateBillingActor/);
  assert.match(status, /getVideoJob/);
  assert.match(callback, /timingSafeEqual/);
  assert.match(callback, /ORBYVEN_VIDEO_RENDER_TOKEN/);
  assert.match(callback, /updateVideoJobFromWorker/);
  assert.doesNotMatch(read("components/VideoAiStudio.tsx"), /SUPABASE_SERVICE_ROLE_KEY/);
});

test("Video AI client follows queued and rendering jobs until terminal status", () => {
  const ui = read("components/VideoAiStudio.tsx");

  assert.match(ui, /\/api\/video-ai\/jobs\//);
  assert.match(ui, /renderJob\.status !== "queued"/);
  assert.match(ui, /renderJob\.status !== "rendering"/);
  assert.match(ui, /setTimeout\(refresh, 2500\)/);
});


test("Video AI keeps Romanian display direction separate from English provider prompts", () => {
  const ro = buildStoryboard({
    brief: "Prezintă ORBYVEN ca produs premium.",
    duration: 30,
    aspect: "16:9",
    style: "product",
    locale: "ro",
  });

  assert.match(ro.title, /Direcție ORBYVEN/);
  assert.match(ro.scenes[0].title, /Dezvăluirea brandului/);
  assert.match(ro.scenes[0].purpose, /brandul/);
  assert.match(ro.scenes[0].generationPrompt, /Establish the brand/);
  assert.doesNotMatch(ro.scenes[0].generationPrompt, /Dezvăluirea brandului/);
});

test("Video AI is bilingual across domain routing, navigation and Services", () => {
  const domain = read("lib/domain-locale.ts");
  const proxy = read("proxy.ts");
  const headerEn = read("components/SiteHeaderEn.tsx");
  const servicesEn = read("lib/services-page-en-content.ts");
  const enPage = read("app/en/video-ai/page.tsx");
  const roPage = read("app/video-ai/page.tsx");
  const copy = read("lib/video-ai-copy.ts");

  assert.match(domain, /"\/video-ai"/);
  assert.match(proxy, /"\/video-ai"/);
  assert.match(headerEn, /href: "\/video-ai"/);
  assert.match(headerEn, /videoAi/);
  assert.match(servicesEn, /title: "Video AI"/);
  assert.match(enPage, /locale="en"/);
  assert.match(enPage, /orbyven\.com\/video-ai/);
  assert.match(roPage, /locale="ro"/);
  assert.match(copy, /Construiește filmul/);
  assert.match(copy, /Build the film/);
});


test("Video AI worker callbacks are signed and status transitions cannot move backwards", () => {
  const callback = read("app/api/video-ai/render/callback/route.ts");
  const jobs = read("lib/video-ai-jobs.ts");
  const render = read("lib/video-ai-render.ts");
  const env = read(".env.example");

  assert.match(callback, /createHmac/);
  assert.match(callback, /x-orbyven-video-signature/);
  assert.match(callback, /timingSafeEqual/);
  assert.match(callback, /VIDEO_JOB_INVALID_TRANSITION/);
  assert.match(jobs, /workerTransitions/);
  assert.match(jobs, /complete: new Set\(\["complete"\]\)/);
  assert.match(jobs, /failed: new Set\(\["failed"\]\)/);
  assert.match(jobs, /VIDEO_JOB_OUTPUT_REQUIRED/);
  assert.match(render, /signatureAlgorithm: "hmac-sha256"/);
  assert.match(env, /ORBYVEN_VIDEO_CALLBACK_SECRET=/);
  assert.doesNotMatch(env, /ORBYVEN_VIDEO_CALLBACK_SECRET=\S+/);
});


test("Video AI worker contract derives deterministic output and scene batches", () => {
  const storyboard = buildStoryboard({
    brief: "Launch ORBYVEN.",
    duration: 30,
    aspect: "9:16",
    style: "social",
    locale: "en",
  });
  const payload = buildVideoProviderPayload(
    "video_test_contract_123",
    { userId: "user-test", organizationId: "org-test" },
    { storyboard },
    "https://orbyven.ro/api/video-ai/render/callback",
    "wan",
  );

  assert.equal(payload.version, 2);
  assert.equal(payload.provider, "wan");
  assert.equal(payload.output.width, 1080);
  assert.equal(payload.output.height, 1920);
  assert.equal(payload.output.fps, 30);
  assert.equal(payload.output.codec, "h264");
  assert.equal(payload.renderPlan.mode, "scene-batch");
  assert.equal(payload.renderPlan.scenes.length, storyboard.scenes.length);
  assert.equal(payload.renderPlan.scenes[0].prompt, storyboard.scenes[0].generationPrompt);
  assert.equal(payload.callback?.signatureHeader, "x-orbyven-video-signature");
});


test("Video AI render retries are idempotent and do not duplicate uncertain GPU work", () => {
  const route = read("app/api/video-ai/render/route.ts");
  const ui = read("components/VideoAiStudio.tsx");

  assert.match(route, /x-orbyven-render-id/i);
  assert.match(route, /Idempotency-Key/);
  assert.match(route, /deduplicated: true/);
  assert.match(route, /PROVIDER_TIMEOUT_PENDING/);
  assert.match(route, /providerHttpFailure \? "failed" : "queued"/);
  assert.match(ui, /renderRequestRef/);
  assert.match(ui, /fingerprint/);
  assert.match(ui, /X-Orbyven-Render-Id/);
});


test("Video AI blocks duplicate active renders and restores active jobs after refresh", () => {
  const ui = read("components/VideoAiStudio.tsx");

  assert.match(ui, /renderPending/);
  assert.match(ui, /disabled=\{renderBusy \|\| renderPending\}/);
  assert.match(ui, /payload\.jobs\.find/);
  assert.match(ui, /job\.status === "queued" \|\| job\.status === "rendering"/);
  assert.match(ui, /renderRequestRef\.current\?\.id === payload\.job\.id/);
  assert.match(ui, /placeholder=\{ui\.briefPlaceholder\}/);
  assert.match(ui, /ControlGroup label=\{ui\.duration\}/);
  assert.match(ui, /ControlGroup label=\{ui\.direction\}/);
});

test("Video AI callback authentication supports bearer or HMAC but never anonymous callbacks", () => {
  const callback = read("app/api/video-ai/render/callback/route.ts");
  const route = read("app/api/video-ai/render/route.ts");

  assert.match(callback, /bearerConfigured/);
  assert.match(callback, /signatureConfigured/);
  assert.match(callback, /!validBearer\(request\) && !validSignature\(request, rawBody\)/);
  assert.match(callback, /callback auth not configured/);
  assert.match(route, /error\.name === "AbortError"/);
  assert.match(route, /aborted \? 504/);
});
