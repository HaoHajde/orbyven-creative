import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  readSiteDraft,
  SITE_PRESETS,
  SECTION_IDS,
} from "../lib/ai/site-editor.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("Web Design schema migrates legacy four-section drafts into the bounded component system", () => {
  const legacy = {
    preset: "studio",
    layout: "split",
    headlineSize: "normal",
    sectionOrder: ["hero", "services", "about", "contact"],
    hiddenSections: ["about"],
    brand: "Test Studio",
    eyebrow: "TEST",
    headline: "Un site de test.",
    description: "Descriere reală furnizată de utilizator.",
    cta: "Contact",
    servicesTitle: "Servicii",
    aboutTitle: "Despre",
    aboutDescription: "Text despre firmă.",
    contactTitle: "Contact",
    contactDescription: "Scrie-ne.",
    accent: "#6058e8",
    background: "#f6f5f2",
    surface: "#ffffff",
    textColor: "#24242a",
  };

  const migrated = readSiteDraft(legacy);
  assert.ok(migrated);
  assert.deepEqual(migrated.sectionOrder, SECTION_IDS);
  assert.equal(migrated.hiddenSections.includes("hero"), false);
  assert.equal(migrated.hiddenSections.includes("about"), true);
  assert.equal(migrated.hiddenSections.includes("gallery"), true);
  assert.ok(migrated.services.length >= 3);
  assert.ok(migrated.faq.length >= 2);
});

test("Local Web Design engine remains deterministic for mechanical changes and routes creative work to AI", () => {
  const local = read("lib/ai/local-preview-commands.ts");

  assert.match(local, /Pure client-side logic: NO API call, NO provider credentials, NO AI quota/);
  assert.match(local, /patch\.background = "#101113"/);
  assert.match(local, /patch\.accent = item\.color/);
  assert.match(local, /patch\.layout = "editorial"/);
  assert.match(local, /export function shouldUseGenerativeWebDesign/);
  assert.match(local, /CREATIVE_TRIGGER/);
  assert.match(local, /applySectionCommand/);
  assert.doesNotMatch(local, /api\.openai\.com/);
});

test("Generative Web Design is server-side, structured, bounded and explicit opt-in", () => {
  const server = read("lib/ai/web-design-server.ts");
  const env = read(".env.example");

  assert.match(server, /https:\/\/api\.openai\.com\/v1\/responses/);
  assert.match(server, /store:\s*false/);
  assert.match(server, /text:\s*\{\s*format:\s*WEB_DESIGN_FORMAT/);
  assert.match(server, /type:\s*"json_schema"/);
  assert.match(server, /strict:\s*true/);
  assert.match(server, /max_output_tokens:\s*3600/);
  assert.match(server, /controller\.abort\(\).*30000|30000/);
  assert.match(server, /generatedCopyPreservesFacts/);
  assert.match(server, /readSiteDraft/);
  assert.match(server, /ai_web_design_claim/);
  assert.match(server, /ai_web_design_finish/);
  assert.match(server, /actor\.role === "viewer"/);

  assert.match(env, /ORBYVEN_WEB_DESIGN_AI_ENABLED=false/);
  assert.match(env, /ORBYVEN_WEB_DESIGN_PROVIDER=/);
  assert.match(env, /ORBYVEN_WEB_DESIGN_OPENAI_API_KEY=/);
  assert.match(env, /ORBYVEN_WEB_DESIGN_MODEL=/);
  assert.doesNotMatch(server, /NEXT_PUBLIC_.*OPENAI/i);
});

test("Web Design routes authenticate, validate and disable caching", () => {
  const generate = read("app/api/ai/web-design/generate/route.ts");
  const draft = read("app/api/ai/web-design/draft/route.ts");

  assert.match(generate, /authenticateBillingActor/);
  assert.match(generate, /prompt\.length < 2 \|\| prompt\.length > 2000/);
  assert.match(generate, /Cache-Control": "no-store"/);
  assert.match(generate, /generateOrchestratedWebDesign/);

  assert.match(draft, /authenticateBillingActor/);
  assert.match(draft, /loadWebDesignDraft/);
  assert.match(draft, /saveWebDesignDraft/);
  assert.match(draft, /Cache-Control": "no-store"/);
});

test("Web Design persistence is server-only with RLS and quota RPC lockdown", () => {
  const migration = read("supabase/migrations/20261001204542_ai_web_design_generative_core.sql");

  assert.match(migration, /alter table public\.ai_web_design_drafts enable row level security/);
  assert.match(migration, /alter table public\.ai_web_design_calls enable row level security/);
  assert.match(migration, /revoke all on table public\.ai_web_design_drafts from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.ai_web_design_drafts to service_role/);
  assert.match(migration, /ai_web_design_claim/);
  assert.match(migration, /for update/);
  assert.match(migration, /revoke all on function public\.ai_web_design_claim/);
  assert.match(migration, /grant execute on function public\.ai_web_design_claim[\s\S]*service_role/);
});

test("Web Design UI uses cloud drafts, generative route, alternatives and responsive preview", () => {
  const specialist = read("components/ai/WebDesignSpecialist.tsx");
  const preview = read("components/ai/WebDesignPreview.tsx");

  assert.match(specialist, /\/api\/ai\/web-design\/generate/);
  assert.match(specialist, /\/api\/ai\/web-design\/draft/);
  assert.match(specialist, /shouldUseGenerativeWebDesign/);
  assert.match(specialist, /Altă propunere/);
  assert.match(specialist, /WebDesignPreview/);
  assert.match(preview, /PreviewDevice/);
  assert.match(preview, /services/);
  assert.match(preview, /gallery/);
  assert.match(preview, /process/);
  assert.match(preview, /faq/);
});


test("Web Design orchestration separates compose, refine and alternative modes with bounded Design DNA", () => {
  const orchestrator = read("lib/ai/web-design-orchestrator.ts");

  assert.match(orchestrator, /WebDesignGenerationMode = "compose" \| "refine" \| "alternative"/);
  assert.match(orchestrator, /inferWebDesignGenerationMode/);
  assert.match(orchestrator, /chooseAlternativeBlueprint/);
  assert.match(orchestrator, /directionDistance/);
  assert.match(orchestrator, /designFingerprint/);
  assert.match(orchestrator, /guidanceForAlternative/);
  assert.match(orchestrator, /guidanceForRefine/);
  assert.match(orchestrator, /applyAlternativeBlueprint/);
  assert.match(orchestrator, /webDesignStructuralDistance/);
  assert.match(orchestrator, /generateOrchestratedWebDesign/);
  assert.match(orchestrator, /saveWebDesignDraft\(actor, draft, "ai", prompt\)/);
  assert.match(orchestrator, /Cererea utilizatorului:/);
  assert.doesNotMatch(orchestrator, /Math\.random/);
});
