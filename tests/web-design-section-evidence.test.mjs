import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SITE_PRESETS } from "../lib/ai/site-editor.ts";
import { buildWebDesignStrategy } from "../lib/ai/web-design-intent.ts";
import { applyVerifiedSectionEvidence } from "../lib/ai/web-design-section-evidence.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("Verified Section Planner activates sections backed by real Smart Interview facts", () => {
  const base = buildWebDesignStrategy(
    "Firmă de instalații. Vreau cereri de ofertă.",
    SITE_PRESETS.instalatii
  );
  assert.equal(base.hiddenSections.includes("gallery"), true);

  const planned = applyVerifiedSectionEvidence(
    base,
    [
      {
        id: "gallery_real",
        question: "Ce proiecte reale ai?",
        answer: "Avem proiecte reale de centrale și încălzire în pardoseală.",
      },
    ],
    SITE_PRESETS.instalatii
  );

  assert.equal(planned.changed, true);
  assert.equal(planned.supportedSections.includes("gallery"), true);
  assert.equal(planned.strategy.visibleSections.includes("gallery"), true);
  assert.equal(planned.strategy.hiddenSections.includes("gallery"), false);
});

test("Verified Section Planner hides optional sections explicitly unavailable in real facts", () => {
  const base = buildWebDesignStrategy(
    "Sunt fotograf și vreau portofoliul în centrul site-ului.",
    SITE_PRESETS.studio
  );
  assert.equal(base.visibleSections.includes("gallery"), true);

  const planned = applyVerifiedSectionEvidence(
    base,
    [
      {
        id: "gallery_real",
        question: "Ce proiecte reale vrei în galerie?",
        answer: "Nu am portofoliu încă.",
      },
    ],
    SITE_PRESETS.studio
  );

  assert.equal(planned.unavailableSections.includes("gallery"), true);
  assert.equal(planned.strategy.visibleSections.includes("gallery"), false);
  assert.equal(planned.strategy.hiddenSections.includes("gallery"), true);
});

test("Verified conversion goal overrides low-confidence architecture without inventing business facts", () => {
  const base = buildWebDesignStrategy(
    "Creează un site pentru firma mea.",
    SITE_PRESETS.studio
  );

  const planned = applyVerifiedSectionEvidence(
    base,
    [
      {
        id: "conversion_goal",
        question: "Care este acțiunea principală dorită?",
        answer: "Vreau programări.",
      },
    ],
    SITE_PRESETS.studio
  );

  assert.equal(planned.strategy.primaryGoal, "booking");
  assert.equal(planned.strategy.primaryAction, "book");
  assert.notEqual(planned.strategy.confidence, "low");
  assert.ok(
    planned.strategy.sectionOrder.indexOf("services") <
      planned.strategy.sectionOrder.indexOf("contact")
  );
});

test("Verified Section Planner never restructures targeted refine requests", () => {
  const base = buildWebDesignStrategy(
    "Fă hero-ul mai premium și păstrează restul.",
    SITE_PRESETS.instalatii
  );

  const planned = applyVerifiedSectionEvidence(
    base,
    [
      {
        id: "gallery_real",
        question: "Ai proiecte reale?",
        answer: "Da, avem proiecte reale.",
      },
      {
        id: "conversion_goal",
        question: "Care este obiectivul?",
        answer: "Programări.",
      },
    ],
    SITE_PRESETS.instalatii
  );

  assert.equal(base.mode, "refine");
  assert.equal(planned.changed, false);
  assert.deepEqual(planned.strategy, base);
});

test("Generative Web Design prepares verified architecture before downstream stages", () => {
  const server = read("lib/ai/web-design-server.ts");
  const planner = read("lib/ai/web-design-section-evidence.ts");
  const context = read("lib/ai/web-design-generation-context.ts");

  assert.match(server, /prepareWebDesignGenerationContext\(/);
  assert.match(context, /applyVerifiedSectionEvidence\(/);
  assert.match(context, /webDesignStrategyInstruction\(strategy\)/);
  assert.match(context, /designDnaInstruction\(current, strategy, prompt\)/);
  assert.match(context, /resolveWebDesignRefineScope\(prompt, strategy\)/);
  assert.match(server, /site_strategy: strategy/);
  assert.ok(
    server.indexOf("prepareWebDesignGenerationContext(") <
      server.indexOf("selectBestWebDesignCandidate(")
  );
  assert.match(planner, /OPTIONAL_NEGATIVE_SECTIONS/);
  assert.match(planner, /conversion_goal/);
  assert.doesNotMatch(planner, /fetch\(/);
  assert.doesNotMatch(planner, /Math\.random/);
  assert.doesNotMatch(context, /fetch\(/);
});
