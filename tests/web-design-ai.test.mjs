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
import {
  applyDesignDna,
  designDnaDistance,
  getAlternativeDesignDnaCandidates,
  selectAlternativeDesignDna,
} from "../lib/ai/web-design-variation.ts";
import { selectBestWebDesignCandidate } from "../lib/ai/web-design-candidate-selection.ts";
import { evaluateWebDesignReadiness } from "../lib/ai/web-design-readiness.ts";
import { autonomouslyRefineWebDesign } from "../lib/ai/web-design-autorefine.ts";
import {
  applyWebDesignRefineScope,
  resolveWebDesignRefineScope,
} from "../lib/ai/web-design-refine-locks.ts";
import { guardWebDesignEvidence } from "../lib/ai/web-design-evidence.ts";
import { deriveWebDesignBriefGaps } from "../lib/ai/web-design-brief-gaps.ts";

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
  const services = read("lib/public-service-catalog.ts");
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

test("Generative Web Design runs candidate selection and autonomous refinement before cloud persistence", () => {
  const server = read("lib/ai/web-design-server.ts");
  const specialist = read("components/ai/WebDesignSpecialist.tsx");
  const quality = read("lib/ai/web-design-quality.ts");
  const autorefine = read("lib/ai/web-design-autorefine.ts");
  const selector = read("lib/ai/web-design-candidate-selection.ts");

  assert.match(server, /selectBestWebDesignCandidate/);
  assert.match(server, /quality: selectedResult\.quality/);
  assert.match(server, /refinement: selectedResult\.refinement/);
  assert.match(server, /selection: selectedResult\.selection/);
  assert.match(server, /saveWebDesignDraft\(actor, nextDraft, "ai", prompt\)/);
  assert.match(specialist, /Quality \{qualityScore\}/);
  assert.match(specialist, /rafinată automat/);
  assert.match(specialist, /selectată din/);
  assert.match(quality, /contrastRatio/);
  assert.match(autorefine, /MAX_PASSES = 2/);
  assert.match(selector, /autonomouslyRefineWebDesign/);
  assert.doesNotMatch(selector, /fetch\(/);
});


test("Alternative Web Design uses a deterministic Design DNA that is structurally distant from the current draft", () => {
  const strategy = buildWebDesignStrategy(
    "Propune o altă variantă completă pentru același business.",
    SITE_PRESETS.florarie
  );
  const dna = selectAlternativeDesignDna(
    SITE_PRESETS.florarie,
    "Propune o altă variantă completă pentru același business."
  );
  const candidate = applyDesignDna(
    SITE_PRESETS.florarie,
    SITE_PRESETS.florarie,
    strategy,
    "Propune o altă variantă completă pentru același business."
  );

  assert.equal(strategy.mode, "alternative");
  assert.ok(dna.id.length > 0);
  assert.ok(designDnaDistance(SITE_PRESETS.florarie, candidate) >= 6);

  const repeated = selectAlternativeDesignDna(
    SITE_PRESETS.florarie,
    "Propune o altă variantă completă pentru același business."
  );
  assert.equal(repeated.id, dna.id);
});

test("Design DNA leaves compose and refine drafts untouched", () => {
  const refine = buildWebDesignStrategy(
    "Fă hero-ul mai premium.",
    SITE_PRESETS.instalatii
  );
  const result = applyDesignDna(
    SITE_PRESETS.instalatii,
    SITE_PRESETS.instalatii,
    refine,
    "Fă hero-ul mai premium."
  );

  assert.deepEqual(result, SITE_PRESETS.instalatii);
});

test("Generative Web Design evaluates Design DNA candidates before persistence", () => {
  const server = read("lib/ai/web-design-server.ts");
  const variation = read("lib/ai/web-design-variation.ts");
  const selector = read("lib/ai/web-design-candidate-selection.ts");

  assert.match(server, /designDnaInstruction\(current, strategy, prompt\)/);
  assert.match(server, /selectBestWebDesignCandidate\(/);
  assert.match(selector, /getAlternativeDesignDnaCandidates\(current, prompt, 3\)/);
  assert.match(selector, /applySpecificDesignDna/);
  assert.match(selector, /weightedScore/);
  assert.match(variation, /distanceFromCurrent/);
  assert.match(variation, /currentFingerprint/);
  assert.doesNotMatch(variation, /Math\.random/);
  assert.doesNotMatch(selector, /Math\.random/);
});


test("Publish Readiness flags demo content without blocking draft generation", () => {
  const strategy = buildWebDesignStrategy(
    "Creează un site pentru o firmă de servicii.",
    SITE_PRESETS.studio
  );
  const quality = critiqueWebDesign(SITE_PRESETS.studio, strategy).report;
  const readiness = evaluateWebDesignReadiness(
    SITE_PRESETS.studio,
    strategy,
    quality
  );

  assert.ok(readiness.score < 90);
  assert.notEqual(readiness.status, "ready");
  assert.ok(readiness.placeholderCount > 0);
  assert.ok(readiness.blockers.some((item) => item.code === "PLACEHOLDER_COPY"));
  assert.ok(readiness.blockers.some((item) => item.code === "DEMO_BRAND"));
});

test("Publish Readiness reaches ready when real copy replaces placeholders and technical quality is strong", () => {
  const draft = {
    ...SITE_PRESETS.florarie,
    brand: "Flora Nova",
    headline: "Flori create pentru momentele care contează.",
    description: "Buchete și aranjamente florale pregătite pentru comenzi și ocazii speciale.",
    services: [
      { title: "Buchete", description: "Selecții florale pentru cadouri și ocazii speciale." },
      { title: "Aranjamente", description: "Compoziții florale pentru evenimente și spații." },
      { title: "Personalizare", description: "Comenzi adaptate preferințelor și contextului oferit." },
    ],
    gallery: [
      { title: "Buchet sezonier", description: "Selecție florală din colecția curentă." },
      { title: "Aranjament floral", description: "Compoziție pentru ocazii speciale." },
      { title: "Colecție cadou", description: "Selecție pregătită pentru a fi oferită." },
    ],
    hiddenSections: ["process", "faq"],
  };
  const strategy = buildWebDesignStrategy(
    "Florărie cu produse și comenzi online.",
    draft
  );
  const quality = critiqueWebDesign(draft, strategy).report;
  const readiness = evaluateWebDesignReadiness(draft, strategy, quality);

  assert.equal(readiness.status, "ready");
  assert.equal(readiness.blockers.length, 0);
  assert.equal(readiness.placeholderCount, 0);
  assert.ok(readiness.score >= 90);
});

test("Generative Web Design returns publish readiness beside technical quality", () => {
  const server = read("lib/ai/web-design-server.ts");
  const specialist = read("components/ai/WebDesignSpecialist.tsx");
  const readiness = read("lib/ai/web-design-readiness.ts");
  const autorefine = read("lib/ai/web-design-autorefine.ts");

  assert.match(server, /readiness: selectedResult\.readiness/);
  assert.match(autorefine, /evaluateWebDesignReadiness/);
  assert.match(specialist, /Ready \{readinessScore\}/);
  assert.match(specialist, /elemente de completat înainte de publicare/);
  assert.match(readiness, /PLACEHOLDER_COPY/);
  assert.match(readiness, /DEMO_BRAND/);
  assert.doesNotMatch(readiness, /fetch\(/);
});


test("Autonomous refinement rechecks deterministic fixes until quality stabilizes", () => {
  const strategy = buildWebDesignStrategy(
    "Florărie cu produse și comenzi online. Vreau să vindem direct.",
    SITE_PRESETS.florarie
  );
  const draft = {
    ...SITE_PRESETS.florarie,
    brand: "Flora Nova",
    headline: "O colecție foarte lungă care explică în prea multe cuvinte toate produsele și serviciile disponibile pentru fiecare ocazie specială",
    headlineSize: "large",
    cta: "Află mai mult",
    background: "#ffffff",
    surface: "#ffffff",
    textColor: "#d9d9d9",
    density: "compact",
    hiddenSections: [],
  };

  const result = autonomouslyRefineWebDesign(draft, strategy);

  assert.equal(result.refinement.attempted, true);
  assert.ok(result.refinement.passes >= 1);
  assert.equal(result.refinement.improved, true);
  assert.ok(result.refinement.finalQuality > result.refinement.initialQuality);
  assert.equal(result.draft.cta, "Vezi produsele");
  assert.equal(result.draft.headlineSize, "normal");
  assert.equal(result.draft.textColor, "#17171b");
  assert.ok(result.quality.score >= 90);
});

test("Autonomous refinement restores strategy structure only for compose or alternative", () => {
  const composeStrategy = buildWebDesignStrategy(
    "Firmă de instalații. Vreau cereri de ofertă.",
    SITE_PRESETS.instalatii
  );
  const tooThin = {
    ...SITE_PRESETS.instalatii,
    hiddenSections: ["services", "benefits", "about", "gallery", "process", "faq", "contact"],
  };

  const composed = autonomouslyRefineWebDesign(tooThin, composeStrategy);
  assert.equal(
    composed.readiness.blockers.some((item) => item.code === "TOO_FEW_READY_SECTIONS"),
    false
  );
  assert.ok(composed.refinement.changes.includes("restored_strategy_structure"));

  const refineStrategy = buildWebDesignStrategy(
    "Fă hero-ul mai premium și păstrează restul.",
    tooThin
  );
  const refined = autonomouslyRefineWebDesign(tooThin, refineStrategy);
  assert.deepEqual(refined.draft.hiddenSections, tooThin.hiddenSections);
});

test("Autonomous refinement never fabricates facts to clear publish blockers", () => {
  const strategy = buildWebDesignStrategy(
    "Creează un site pentru o firmă de servicii.",
    SITE_PRESETS.studio
  );
  const result = autonomouslyRefineWebDesign(SITE_PRESETS.studio, strategy);

  assert.ok(result.readiness.blockers.some((item) => item.code === "DEMO_BRAND"));
  assert.ok(result.readiness.blockers.some((item) => item.code === "PLACEHOLDER_COPY"));
  assert.ok(result.refinement.remainingActions.length > 0);
  assert.equal(result.draft.brand, SITE_PRESETS.studio.brand);
});


test("Alternative candidate selection evaluates three distant Design DNA families and is deterministic", () => {
  const prompt = "Propune o altă variantă completă, premium și editorială.";
  const strategy = buildWebDesignStrategy(prompt, SITE_PRESETS.florarie);
  const candidates = getAlternativeDesignDnaCandidates(
    SITE_PRESETS.florarie,
    prompt,
    3
  );

  assert.equal(strategy.mode, "alternative");
  assert.equal(candidates.length, 3);
  assert.equal(new Set(candidates.map((item) => item.id)).size, 3);

  const first = selectBestWebDesignCandidate(
    SITE_PRESETS.florarie,
    SITE_PRESETS.florarie,
    strategy,
    prompt
  );
  const second = selectBestWebDesignCandidate(
    SITE_PRESETS.florarie,
    SITE_PRESETS.florarie,
    strategy,
    prompt
  );

  assert.equal(first.selection.evaluatedCandidates, 3);
  assert.ok(first.selection.selectedDna);
  assert.ok(first.selection.selectedDistance >= 6);
  assert.equal(first.selection.selectedDna, second.selection.selectedDna);
  assert.equal(first.selection.selectedScore, second.selection.selectedScore);
  assert.deepEqual(first.draft, second.draft);
});

test("Candidate selection does not alter compose or refine through hidden style competition", () => {
  const prompt = "Fă hero-ul mai premium și păstrează restul.";
  const strategy = buildWebDesignStrategy(prompt, SITE_PRESETS.instalatii);
  const result = selectBestWebDesignCandidate(
    SITE_PRESETS.instalatii,
    SITE_PRESETS.instalatii,
    strategy,
    prompt
  );

  assert.equal(strategy.mode, "refine");
  assert.equal(result.selection.evaluatedCandidates, 1);
  assert.equal(result.selection.selectedDna, null);
  assert.equal(result.draft.layout, SITE_PRESETS.instalatii.layout);
  assert.deepEqual(result.draft.variants, SITE_PRESETS.instalatii.variants);
});


test("Web Design Visual Memory is bounded, validated and sent only as recent drafts", () => {
  const route = read("app/api/ai/web-design/generate/route.ts");
  const specialist = read("components/ai/WebDesignSpecialist.tsx");
  const server = read("lib/ai/web-design-server.ts");

  assert.match(route, /Array\.isArray\(body\.recentDrafts\)/);
  assert.match(route, /\.slice\(-4\)/);
  assert.match(route, /readSiteDraft\(item\)/);
  assert.match(server, /recentDrafts: EditableSite\[\] = \[\]/);
  assert.match(server, /recentDrafts\.slice\(-4\)/);
  assert.match(specialist, /VISUAL_MEMORY_KEY/);
  assert.match(specialist, /recentDrafts: visualMemory\.slice\(-4\)/);
  assert.match(specialist, /setVisualMemory/);
  assert.match(specialist, /removeItem\(VISUAL_MEMORY_KEY\)/);
});

test("Alternative candidate selection penalizes recently used visual directions", () => {
  const prompt = "Propune o altă variantă completă și coerentă pentru același business.";
  const strategy = buildWebDesignStrategy(prompt, SITE_PRESETS.florarie);

  const first = selectBestWebDesignCandidate(
    SITE_PRESETS.florarie,
    SITE_PRESETS.florarie,
    strategy,
    prompt
  );
  const second = selectBestWebDesignCandidate(
    SITE_PRESETS.florarie,
    SITE_PRESETS.florarie,
    strategy,
    prompt,
    [first.draft]
  );

  assert.equal(second.selection.visualMemoryCompared, 1);
  assert.ok(second.selection.noveltyPenalty >= 0);
  assert.ok(
    second.selection.selectedDna !== first.selection.selectedDna ||
      second.selection.noveltyPenalty > 0
  );
});

test("Visual Memory novelty logic remains deterministic and network-free", () => {
  const selector = read("lib/ai/web-design-candidate-selection.ts");

  assert.match(selector, /function noveltyPenalty/);
  assert.match(selector, /closest <= 2/);
  assert.match(selector, /recentDrafts\.slice\(-4\)/);
  assert.match(selector, /visualMemoryCompared/);
  assert.doesNotMatch(selector, /fetch\(/);
  assert.doesNotMatch(selector, /Math\.random/);
});


test("Refine Locks isolate explicit section and palette edits from unrelated AI changes", () => {
  const current = SITE_PRESETS.florarie;
  const prompt = "Schimbă doar hero-ul și culorile. Păstrează restul.";
  const strategy = buildWebDesignStrategy(prompt, current);
  const scope = resolveWebDesignRefineScope(prompt, strategy);

  const noisyCandidate = {
    ...current,
    brand: "NU SCHIMBA BRANDUL",
    headline: "Un hero nou, mai clar.",
    description: "Descriere nouă pentru hero.",
    cta: "Comandă acum",
    servicesTitle: "SERVICII SCHIMBATE GREȘIT",
    services: current.services.map((item) => ({
      ...item,
      title: `MODIFICAT ${item.title}`,
    })),
    contactTitle: "CONTACT SCHIMBAT GREȘIT",
    accent: "#112233",
    background: "#fefefe",
    surface: "#eeeeee",
    textColor: "#111111",
    layout: "split",
  };

  const locked = applyWebDesignRefineScope(noisyCandidate, current, scope);

  assert.equal(scope.strict, true);
  assert.ok(scope.targets.includes("hero"));
  assert.ok(scope.targets.includes("palette"));
  assert.equal(locked.headline, noisyCandidate.headline);
  assert.equal(locked.description, noisyCandidate.description);
  assert.equal(locked.cta, noisyCandidate.cta);
  assert.equal(locked.accent, noisyCandidate.accent);
  assert.equal(locked.background, noisyCandidate.background);
  assert.equal(locked.servicesTitle, current.servicesTitle);
  assert.deepEqual(locked.services, current.services);
  assert.equal(locked.contactTitle, current.contactTitle);
  assert.equal(locked.brand, current.brand);
  assert.equal(locked.layout, current.layout);
});

test("Refine Locks allow targeted visibility changes without leaking unrelated edits", () => {
  const current = SITE_PRESETS.instalatii;
  const prompt = "Ascunde FAQ și păstrează restul.";
  const strategy = buildWebDesignStrategy(prompt, current);
  const scope = resolveWebDesignRefineScope(prompt, strategy);
  const candidate = {
    ...current,
    headline: "NU TREBUIE SCHIMBAT",
    hiddenSections: [...new Set([...current.hiddenSections, "faq"])],
  };

  const locked = applyWebDesignRefineScope(candidate, current, scope);

  assert.equal(scope.strict, true);
  assert.deepEqual(scope.targets, ["faq"]);
  assert.equal(locked.hiddenSections.includes("faq"), true);
  assert.equal(locked.headline, current.headline);
});

test("Broad visual refinement remains flexible when no explicit field is targeted", () => {
  const current = SITE_PRESETS.studio;
  const prompt = "Fă-l mai premium, mai elegant și mai aerisit.";
  const strategy = buildWebDesignStrategy(prompt, current);
  const scope = resolveWebDesignRefineScope(prompt, strategy);
  const candidate = {
    ...current,
    headline: "Direcție nouă",
    visualTone: "luxury",
    density: "airy",
  };

  const result = applyWebDesignRefineScope(candidate, current, scope);

  assert.equal(strategy.mode, "refine");
  assert.equal(scope.strict, false);
  assert.deepEqual(result, candidate);
});

test("Generative Web Design applies Refine Locks before candidate selection", () => {
  const server = read("lib/ai/web-design-server.ts");
  const locks = read("lib/ai/web-design-refine-locks.ts");
  const specialist = read("components/ai/WebDesignSpecialist.tsx");

  assert.match(server, /resolveWebDesignRefineScope\(prompt, strategy\)/);
  assert.match(server, /webDesignRefineScopeInstruction\(refineScope\)/);
  assert.match(server, /applyWebDesignRefineScope\(strategicDraft, current, refineScope\)/);
  assert.ok(
    server.indexOf("applyWebDesignRefineScope(strategicDraft") <
      server.indexOf("selectBestWebDesignCandidate")
  );
  assert.match(server, /refineScope,/);
  assert.match(locks, /mergeTargetVisibility/);
  assert.match(specialist, /editare izolată/);
  assert.doesNotMatch(locks, /fetch\(/);
});


test("Evidence Guard retracts unsupported commercial claims without discarding the whole draft", () => {
  const current = SITE_PRESETS.instalatii;
  const candidate = {
    ...current,
    headline: "Instalații autorizate cu garanție completă.",
    services: current.services.map((item, index) => ({
      ...item,
      description:
        index === 0
          ? "Intervenții autorizate, cu garanție și serviciu non-stop."
          : item.description,
    })),
  };

  const result = guardWebDesignEvidence(
    candidate,
    current,
    "Fă site-ul mai premium și mai clar."
  );

  assert.equal(result.draft.headline, current.headline);
  assert.equal(
    result.draft.services[0].description,
    current.services[0].description
  );
  assert.ok(result.report.revertedFields.includes("hero.headline"));
  assert.ok(
    result.report.unsupportedConcepts.includes("credentials")
  );
  assert.ok(result.report.unsupportedConcepts.includes("guarantee"));
  assert.ok(result.report.unsupportedConcepts.includes("nonstop"));
});

test("Evidence Guard preserves claims explicitly supplied by the user", () => {
  const current = SITE_PRESETS.instalatii;
  const candidate = {
    ...current,
    headline: "Echipă autorizată, cu garanție pentru lucrările executate.",
    contactDescription:
      "Suntem disponibili pentru intervenții de urgență.",
  };

  const result = guardWebDesignEvidence(
    candidate,
    current,
    "Firma este autorizată, oferim garanție pentru lucrări și intervenții de urgență."
  );

  assert.equal(result.draft.headline, candidate.headline);
  assert.equal(result.draft.contactDescription, candidate.contactDescription);
  assert.equal(result.report.revertedFields.length, 0);
  assert.equal(result.report.unsupportedConcepts.length, 0);
});

test("Evidence Guard catches non-numeric risky offers that numeric fact guard cannot", () => {
  const current = SITE_PRESETS.florarie;
  const candidate = {
    ...current,
    description:
      "Comandă acum cu livrare gratuită și livrare în aceeași zi.",
    contactDescription:
      "Consultanță gratuită pentru alegerea aranjamentului.",
  };

  const result = guardWebDesignEvidence(
    candidate,
    current,
    "Vreau un site elegant pentru florărie."
  );

  assert.equal(result.draft.description, current.description);
  assert.equal(result.draft.contactDescription, current.contactDescription);
  assert.ok(result.report.unsupportedConcepts.includes("free_delivery"));
  assert.ok(result.report.unsupportedConcepts.includes("same_day"));
  assert.ok(result.report.unsupportedConcepts.includes("free_consultation"));
});

test("Generative Web Design runs Evidence Guard before candidate selection", () => {
  const server = read("lib/ai/web-design-server.ts");
  const evidence = read("lib/ai/web-design-evidence.ts");
  const specialist = read("components/ai/WebDesignSpecialist.tsx");

  assert.match(server, /guardWebDesignEvidence\(/);
  assert.ok(
    server.indexOf("guardWebDesignEvidence(") <
      server.indexOf("selectBestWebDesignCandidate")
  );
  assert.match(server, /evidence: evidenceResult\.report/);
  assert.match(evidence, /unsupportedConcepts/);
  assert.match(evidence, /free_delivery/);
  assert.match(evidence, /official_partner/);
  assert.match(specialist, /afirmații neverificate retrase/);
  assert.doesNotMatch(evidence, /fetch\(/);
});


test("Brief Gap Planner asks only for real missing information on demo drafts", () => {
  const draft = SITE_PRESETS.studio;
  const strategy = buildWebDesignStrategy(
    "Creează un site pentru firma mea.",
    draft
  );
  const quality = critiqueWebDesign(draft, strategy).report;
  const readiness = evaluateWebDesignReadiness(draft, strategy, quality);
  const evidence = guardWebDesignEvidence(
    draft,
    draft,
    "Creează un site pentru firma mea."
  ).report;

  const gaps = deriveWebDesignBriefGaps(
    draft,
    strategy,
    readiness,
    evidence
  );

  assert.ok(gaps.count > 0);
  assert.ok(gaps.gaps.some((gap) => gap.id === "brand_name"));
  assert.ok(gaps.gaps.some((gap) => gap.id === "conversion_goal"));
  assert.ok(gaps.labels.includes("nume brand real"));
  assert.ok(gaps.completionScore < 100);
});

test("Brief Gap Planner returns zero gaps for a ready, high-confidence real draft", () => {
  const draft = {
    ...SITE_PRESETS.florarie,
    brand: "Flora Nova",
    headline: "Flori pentru momente care contează.",
    description: "Buchete și aranjamente florale pentru comenzi și ocazii speciale.",
    services: [
      { title: "Buchete", description: "Selecții florale pentru cadouri." },
      { title: "Aranjamente", description: "Compoziții florale pentru evenimente." },
      { title: "Personalizare", description: "Comenzi adaptate preferințelor tale." },
    ],
    gallery: [
      { title: "Buchet sezonier", description: "Selecție florală din colecția curentă." },
      { title: "Aranjament floral", description: "Compoziție pentru ocazii speciale." },
      { title: "Colecție cadou", description: "Selecție pregătită pentru a fi oferită." },
    ],
    hiddenSections: ["process", "faq"],
  };
  const prompt =
    "Florărie cu produse, comenzi online și checkout. Vreau vânzare directă.";
  const strategy = buildWebDesignStrategy(prompt, draft);
  const quality = critiqueWebDesign(draft, strategy).report;
  const readiness = evaluateWebDesignReadiness(draft, strategy, quality);
  const evidence = guardWebDesignEvidence(draft, draft, prompt).report;

  const gaps = deriveWebDesignBriefGaps(
    draft,
    strategy,
    readiness,
    evidence
  );

  assert.equal(readiness.status, "ready");
  assert.equal(strategy.confidence, "high");
  assert.equal(gaps.count, 0);
  assert.equal(gaps.completionScore, 100);
});

test("Brief Gap Planner converts unsupported claims into evidence questions", () => {
  const draft = SITE_PRESETS.instalatii;
  const prompt = "Vreau un site modern pentru instalații.";
  const strategy = buildWebDesignStrategy(prompt, draft);
  const quality = critiqueWebDesign(draft, strategy).report;
  const readiness = evaluateWebDesignReadiness(draft, strategy, quality);
  const evidence = guardWebDesignEvidence(
    {
      ...draft,
      headline: "Instalații autorizate cu garanție.",
    },
    draft,
    prompt
  ).report;

  const gaps = deriveWebDesignBriefGaps(
    draft,
    strategy,
    readiness,
    evidence
  );

  const claimGap = gaps.gaps.find((gap) => gap.id === "claim_evidence");
  assert.ok(claimGap);
  assert.match(claimGap.question, /autorizări\/certificări|garanție/);
});

test("Generative Web Design derives Brief Gaps from the final selected draft", () => {
  const server = read("lib/ai/web-design-server.ts");
  const planner = read("lib/ai/web-design-brief-gaps.ts");
  const specialist = read("components/ai/WebDesignSpecialist.tsx");

  assert.match(server, /deriveWebDesignBriefGaps\(/);
  assert.ok(
    server.indexOf("const nextDraft = readSiteDraft") <
      server.indexOf("deriveWebDesignBriefGaps(")
  );
  assert.match(server, /briefGaps,/);
  assert.match(planner, /conversion_goal/);
  assert.match(planner, /claim_evidence/);
  assert.match(specialist, /lipsesc:/);
  assert.doesNotMatch(planner, /fetch\(/);
});
