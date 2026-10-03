import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { routeIntelligencePrompt } from "../lib/ai/intelligence-router.ts";
import { detectOperationalQuery } from "../lib/ai/operational-query-core.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("Intelligence router sends business intents to the correct specialist", () => {
  assert.equal(routeIntelligencePrompt("Ce am de încasat?").specialist, "finance");
  assert.equal(routeIntelligencePrompt("Ce lucrări am azi?").specialist, "operations");
  assert.equal(routeIntelligencePrompt("Deschide documentele").specialist, "documents");
  assert.equal(routeIntelligencePrompt("Vreau site black & gold").specialist, "web_design");
  assert.equal(routeIntelligencePrompt("Salut ORBYVEN").specialist, "general");
});

test("Intelligence server authenticates tenant and keeps Core 0.8 read-only", () => {
  const source = read("lib/ai/intelligence-server.ts");
  assert.match(source, /authenticateBillingActor\(request, organizationId, false\)/);
  assert.match(source, /\.eq\("organization_id", actor\.organizationId\)/);
  assert.doesNotMatch(source, /\.(insert|update|delete|upsert)\s*\(/);
  assert.match(source, /FINANCE_ROLES = new Set\(\["owner", "admin", "manager"\]\)/);
  assert.match(source, /loadAvailableModules\(actor\)/);
  assert.match(source, /organization_entitlements/);
  assert.match(source, /available\.has\("expenses"\)/);
});

test("Finance specialist uses paged exact cashflow reads and does not expose finance to members", () => {
  const source = read("lib/ai/intelligence-server.ts");
  assert.match(source, /if \(!FINANCE_ROLES\.has\(actor\.role\)\)/);
  assert.match(source, /readAllPages<\{ amount_cents: number \}>/);
  assert.match(source, /finance_income_entries/);
  assert.match(source, /finance_expenses/);
  assert.match(source, /sales_commercial_documents/);
});

test("Global workspace mounts one ORBYVEN Intelligence entry point", () => {
  const workspace = read("components/WorkspaceShell.tsx");
  const panel = read("components/WorkspaceIntelligence.tsx");
  assert.match(workspace, /<WorkspaceIntelligence/);
  assert.match(panel, /\/api\/ai\/intelligence/);
  assert.match(panel, /ORBYVEN Intelligence/);
});

test("Web Design Specialist reuses the bounded validated design engine", () => {
  const specialist = read("components/ai/WebDesignSpecialist.tsx");
  const editor = read("lib/ai/site-editor.ts");
  const local = read("lib/ai/local-preview-commands.ts");
  assert.match(specialist, /applyLocalPreviewCommand/);
  assert.match(specialist, /getWorkspaceEntryPath/);
  assert.match(editor, /AI returns data, never executable code/);
  assert.match(editor, /applySitePatch/);
  assert.match(local, /Free, deterministic design interpretation/);
  assert.doesNotMatch(local, /fetch\s*\(/);
});

test("Intelligence API is no-store, authenticated and bounded", () => {
  const route = read("app/api/ai/intelligence/route.ts");
  assert.match(route, /prompt\.length < 2 \|\| prompt\.length > 1200/);
  assert.match(route, /Cache-Control": "no-store"/);
  assert.match(route, /answerIntelligenceForActor/);
  assert.match(route, /ensureConversation/);
  assert.match(route, /persistAssistantResponse/);
});


test("Operational Query Mode detects concrete read-only intents", () => {
  assert.equal(detectOperationalQuery("Ce lucrări sunt întârziate?"), "overdue_tasks");
  assert.equal(detectOperationalQuery("Arată-mi lucrările blocate"), "blocked_tasks");
  assert.equal(detectOperationalQuery("Ce lucrări sunt fără responsabil?"), "unassigned_tasks");
  assert.equal(detectOperationalQuery("Ce am de făcut azi?"), "today");
  assert.equal(detectOperationalQuery("Ce leaduri trebuie contactate azi?"), "lead_followups");
  assert.equal(detectOperationalQuery("Ce oferte expiră și trebuie urmărite?"), "estimate_followups");
  assert.equal(detectOperationalQuery("Fă-mi briefingul zilei"), "briefing");
  assert.equal(detectOperationalQuery("Compară opțiunile pentru Focus #1"), "decision_support");
  assert.equal(detectOperationalQuery("Salut ORBYVEN"), null);
});

test("Dashboard AI routes entity and operational intelligence before generic specialist fallback", () => {
  const source = read("lib/ai/intelligence-server.ts");
  assert.match(source, /answerEntityIntelligenceQuery/);
  assert.match(source, /answerOperationalQuery/);
  assert.ok(source.indexOf("answerEntityIntelligenceQuery") < source.indexOf("routeIntelligencePrompt(prompt)"));
  assert.ok(source.indexOf("answerOperationalQuery") < source.indexOf("routeIntelligencePrompt(prompt)"));
});

test("Focus Decision and Outcome loop remain bounded and confirmation-first", () => {
  const briefing = read("lib/ai/business-briefing.ts");
  const decision = read("lib/ai/business-decision-support.ts");
  const handoff = read("app/api/ai/decisions/handoff/route.ts");
  const outcome = read("lib/ai/action-outcome.ts");
  const panel = read("components/WorkspaceIntelligence.tsx");
  const renderer = read("components/intelligence/IntelligenceMessageList.tsx");

  assert.match(briefing, /focusInsight/);
  assert.match(decision, /handoffPlanPrompt/);
  assert.match(handoff, /DECISION_STALE/);
  assert.match(handoff, /proposal_only_explicit_confirmation_required/);
  assert.match(outcome, /OUTCOME_PLAN_NOT_COMPLETE/);
  assert.match(outcome, /no_longer_primary/);
  assert.doesNotMatch(outcome, /\.(insert|update|delete|upsert)\s*\(/);
  assert.match(panel, /\/api\/ai\/outcomes\/recheck/);
  assert.match(renderer, /data-orbyven-outcome="true"/);
  assert.match(renderer, /Vezi briefingul actual/);
  assert.match(renderer, /Compară noul Focus/);
  assert.match(panel, /ORBYVEN INTELLIGENCE · 0\.8\.25/);
});
