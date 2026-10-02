import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_SITE,
  SITE_PRESETS,
  readSiteDraft,
  SECTION_IDS,
} from "../lib/ai/site-editor.ts";
import {
  applyWebDesignStrategy,
  buildWebDesignStrategy,
  inferWebDesignRequestMode,
} from "../lib/ai/web-design-intent.ts";
import { critiqueWebDesign } from "../lib/ai/web-design-quality.ts";

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
  assert.match(generate, /generateWebDesignForActor/);

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


test("AI Web Design has a public route and authenticated editor handoff", () => {
  const page = read("app/ai-web-design/page.tsx");
  const entry = read("components/AiWebDesignEntry.tsx");
  const login = read("app/workspace/login/page.tsx");

  assert.match(page, /AiWebDesignEntry/);
  assert.match(page, /canonical: "\/ai-web-design"/);
  assert.match(entry, /WebDesignSpecialist/);
  assert.match(entry, /WebDesignPreview/);
  assert.match(entry, /activePage="webDesignAi"/);
  assert.match(entry, /\/workspace\/login\?next=ai-web-design/);
  assert.match(login, /requestedNext === "ai-web-design"/);
  assert.match(login, /return "\/ai-web-design"/);
});

test("AI Web Design is discoverable from primary navigation, Services and Dashboard", () => {
  const header = read("components/SiteHeader.tsx");
  const services = read("app/servicii/page.tsx");
  const workspace = read("components/WorkspaceShell.tsx");
  const sitemap = read("app/sitemap.ts");

  const templatesIndex = header.indexOf('label: "Templates"');
  const aiIndex = header.indexOf('label: "AI Web Design"');
  const servicesIndex = header.indexOf('label: "Servicii"');
  assert.ok(templatesIndex >= 0 && aiIndex > templatesIndex && servicesIndex > aiIndex);

  assert.match(header, /href: "\/ai-web-design"/);
  assert.match(services, /title: "AI Web Design"/);
  assert.match(services, /href: "\/ai-web-design"/);
  assert.match(services, /Deschide AI Web Design/);
  assert.match(workspace, /onOpenPath\("\/ai-web-design"\)/);
  assert.match(workspace, /AI Web Design/);
  assert.match(sitemap, /path: "\/ai-web-design"/);
});


test("Web Design intent architect maps business type and conversion goal into a bounded section strategy", () => {
  const localService = buildWebDesignStrategy(
    "Firmă de instalații termice. Vreau cereri de ofertă și un site foarte clar.",
    DEFAULT_SITE
  );
  assert.equal(localService.archetype, "local_service");
  assert.equal(localService.primaryGoal, "lead_generation");
  assert.equal(localService.primaryAction, "request_quote");
  assert.equal(localService.visibleSections.includes("process"), true);
  assert.equal(localService.hiddenSections.includes("gallery"), true);

  const retail = buildWebDesignStrategy(
    "Florărie cu produse, comenzi online și checkout. Vreau să vindem direct.",
    DEFAULT_SITE
  );
  assert.equal(retail.archetype, "retail");
  assert.equal(retail.primaryGoal, "direct_sale");
  assert.equal(retail.primaryAction, "buy");
  assert.equal(retail.visibleSections.includes("gallery"), true);
  assert.ok(retail.sectionOrder.indexOf("services") < retail.sectionOrder.indexOf("about"));

  const portfolio = buildWebDesignStrategy(
    "Sunt fotograf și vreau portofoliul și proiectele în centrul site-ului.",
    DEFAULT_SITE
  );
  assert.equal(portfolio.archetype, "creative");
  assert.equal(portfolio.primaryGoal, "showcase");
  assert.equal(portfolio.primaryAction, "view_work");
  assert.equal(portfolio.sectionOrder[1], "gallery");
});

test("Web Design intent architect preserves layout during targeted refinements", () => {
  const prompt = "Fă hero-ul mai premium și mai aerisit, păstrează restul.";
  assert.equal(inferWebDesignRequestMode(prompt), "refine");

  const strategy = buildWebDesignStrategy(prompt, DEFAULT_SITE);
  const candidate = {
    ...DEFAULT_SITE,
    sectionOrder: [...SECTION_IDS].reverse(),
    hiddenSections: ["faq"],
  };
  const applied = applyWebDesignStrategy(candidate, strategy);

  assert.deepEqual(applied.sectionOrder, candidate.sectionOrder);
  assert.deepEqual(applied.hiddenSections, candidate.hiddenSections);
});

test("Web Design intent architect respects explicit section instructions and alternative composition", () => {
  const explicit = buildWebDesignStrategy(
    "Site pentru instalații. Cere ofertă. Adaugă galerie și scoate FAQ.",
    DEFAULT_SITE
  );
  assert.equal(explicit.visibleSections.includes("gallery"), true);
  assert.equal(explicit.hiddenSections.includes("faq"), true);

  const alternative = buildWebDesignStrategy(
    "Propune o altă variantă completă pentru același business.",
    DEFAULT_SITE
  );
  assert.equal(alternative.mode, "alternative");
  assert.equal(alternative.sectionOrder[0], "hero");
  assert.equal(new Set(alternative.sectionOrder).size, SECTION_IDS.length);
});

test("Generative Web Design consumes the deterministic Site Strategy before rendering", () => {
  const server = read("lib/ai/web-design-server.ts");
  const intent = read("lib/ai/web-design-intent.ts");

  assert.match(server, /buildWebDesignStrategy\(prompt, current\)/);
  assert.match(server, /webDesignStrategyInstruction\(strategy\)/);
  assert.match(server, /site_strategy: strategy/);
  assert.match(server, /applyWebDesignStrategy\(parsedDraft, strategy\)/);
  assert.match(intent, /primaryGoal/);
  assert.match(intent, /primaryAction/);
  assert.match(intent, /visibleSections/);
  assert.match(intent, /hiddenSections/);
  assert.doesNotMatch(intent, /Math\.random/);
});


test("Web Design follow-ups keep business and conversion context from the current draft", () => {
  const installations = buildWebDesignStrategy(
    "Fă-l mai premium și mai aerisit.",
    SITE_PRESETS.instalatii
  );
  assert.equal(installations.mode, "refine");
  assert.equal(installations.archetype, "local_service");
  assert.equal(installations.primaryGoal, "lead_generation");
  assert.equal(installations.primaryAction, "request_quote");

  const florist = buildWebDesignStrategy(
    "Schimbă hero-ul, vreau să fie mai elegant.",
    SITE_PRESETS.florarie
  );
  assert.equal(florist.mode, "refine");
  assert.equal(florist.archetype, "retail");
  assert.equal(florist.primaryGoal, "direct_sale");
  assert.equal(florist.primaryAction, "buy");
});

test("Explicit new business context overrides the previous draft context", () => {
  const strategy = buildWebDesignStrategy(
    "Transformă direcția pentru un fotograf cu portofoliu și proiecte vizuale.",
    SITE_PRESETS.instalatii
  );

  assert.equal(strategy.archetype, "creative");
  assert.equal(strategy.primaryGoal, "showcase");
  assert.equal(strategy.primaryAction, "view_work");
});


test("Web Design quality critic fixes objective visual and conversion issues without another AI call", () => {
  const strategy = buildWebDesignStrategy(
    "Florărie cu produse și comenzi online. Vreau să vindem direct.",
    SITE_PRESETS.florarie
  );
  const poorDraft = {
    ...SITE_PRESETS.florarie,
    headline: "O colecție foarte lungă care explică în prea multe cuvinte exact tot ce poate cumpăra clientul de la florăria noastră online",
    headlineSize: "large",
    cta: "Află mai mult",
    background: "#ffffff",
    textColor: "#d9d9d9",
    density: "compact",
    hiddenSections: [],
  };

  const result = critiqueWebDesign(poorDraft, strategy);

  assert.equal(result.draft.cta, "Vezi produsele");
  assert.equal(result.draft.headlineSize, "normal");
  assert.equal(result.draft.density, "balanced");
  assert.equal(result.draft.textColor, "#17171b");
  assert.ok(result.report.fixesApplied >= 4);
  assert.ok(result.report.score < 100);
  assert.ok(result.report.issues.some((issue) => issue.code === "LOW_TEXT_CONTRAST"));
  assert.ok(result.report.issues.some((issue) => issue.code === "GENERIC_CTA"));
});

test("Web Design quality critic does not override an explicit CTA during refine", () => {
  const strategy = buildWebDesignStrategy(
    "Schimbă CTA-ul în Află mai mult și păstrează restul.",
    SITE_PRESETS.instalatii
  );
  const draft = {
    ...SITE_PRESETS.instalatii,
    cta: "Află mai mult",
  };

  const result = critiqueWebDesign(draft, strategy);
  assert.equal(strategy.mode, "refine");
  assert.equal(result.draft.cta, "Află mai mult");
  assert.equal(result.report.issues.some((issue) => issue.code === "GENERIC_CTA"), false);
});

test("Generative Web Design runs quality critic before cloud persistence", () => {
  const server = read("lib/ai/web-design-server.ts");
  const specialist = read("components/ai/WebDesignSpecialist.tsx");
  const quality = read("lib/ai/web-design-quality.ts");

  assert.match(server, /critiqueWebDesign\(strategicDraft, strategy\)/);
  assert.match(server, /quality: qualityResult\.report/);
  assert.match(server, /saveWebDesignDraft\(actor, nextDraft, "ai", prompt\)/);
  assert.match(specialist, /Quality \{qualityScore\}/);
  assert.match(specialist, /corecții automate/);
  assert.match(quality, /contrastRatio/);
  assert.match(quality, /visibleSectionCount/);
  assert.match(quality, /repeatedCopy/);
  assert.doesNotMatch(quality, /fetch\(/);
});
