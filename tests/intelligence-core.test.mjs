import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { routeIntelligencePrompt } from "../lib/ai/intelligence-router.ts";
import { detectOperationalQuery } from "../lib/ai/operational-query-core.ts";
import {
  detectEntityIntelligenceQuery,
  detectEntityQuestionScope,
} from "../lib/ai/entity-intelligence-core.ts";

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


test("Operational Query Mode resolves concrete dashboard questions before generic overview", () => {
  assert.equal(detectOperationalQuery("Ce lucrări sunt întârziate?"), "overdue_tasks");
  assert.equal(detectOperationalQuery("Arată-mi lucrările blocate"), "blocked_tasks");
  assert.equal(detectOperationalQuery("Ce lucrări sunt fără responsabil?"), "unassigned_tasks");
  assert.equal(detectOperationalQuery("Ce am de făcut azi?"), "today");
  assert.equal(detectOperationalQuery("Ce leaduri trebuie contactate azi?"), "lead_followups");
  assert.equal(detectOperationalQuery("Ce oferte expiră și trebuie urmărite?"), "estimate_followups");
  assert.equal(detectOperationalQuery("Ce am de făcut mâine?"), "tomorrow");
  assert.equal(detectOperationalQuery("Ce am programat în următoarele 7 zile?"), "week");
  assert.equal(detectOperationalQuery("Ce lucrări sunt urgente?"), "urgent_tasks");
  assert.equal(detectOperationalQuery("Ce lucrări sunt neprogramate?"), "unscheduled_tasks");
  assert.equal(detectOperationalQuery("Fă-mi briefingul zilei"), "briefing");
  assert.equal(detectOperationalQuery("Care sunt prioritățile mele acum?"), "briefing");
  assert.equal(detectOperationalQuery("Cu ce încep?"), "briefing");
  assert.equal(detectOperationalQuery("Salut ORBYVEN"), null);

  const server = read("lib/ai/intelligence-server.ts");
  const query = read("lib/ai/operational-query.ts");
  assert.match(server, /answerOperationalQuery\(actor, available, prompt\)/);
  assert.match(query, /\.eq\("organization_id", actor\.organizationId\)/);
  assert.match(query, /\.limit\(120\)/);
  assert.doesNotMatch(query, /\.(insert|update|delete|upsert)\s*\(/);
  assert.match(query, /recordId: row\.id/);
});

test("Entity Intelligence detects named client/work queries and stays bounded read-only", () => {
  assert.deepEqual(
    detectEntityIntelligenceQuery("Ce se întâmplă cu clientul Popescu SRL?"),
    { kind: "client", value: "Popescu SRL" }
  );
  assert.deepEqual(
    detectEntityIntelligenceQuery("Arată-mi situația pentru lucrarea Revizie centrală"),
    { kind: "work", value: "Revizie centrală" }
  );
  assert.deepEqual(
    detectEntityIntelligenceQuery("Ce am făcut pentru clientul acela; client: Exemplu SRL"),
    { kind: "client", value: "Exemplu SRL" }
  );
  assert.equal(detectEntityIntelligenceQuery("Creează client: Exemplu SRL"), null);

  const server = read("lib/ai/intelligence-server.ts");
  const entity = read("lib/ai/entity-intelligence.ts");
  assert.match(server, /answerEntityIntelligenceQuery\(actor, available, prompt\)/);
  assert.match(entity, /\.eq\("organization_id", actor\.organizationId\)/);
  assert.match(entity, /crm_leads/);
  assert.match(entity, /ops_tasks/);
  assert.match(entity, /sales_estimates/);
  assert.match(entity, /calendar_events/);
  assert.match(entity, /ops_documents/);
  assert.match(entity, /FINANCE_ROLES/);
  assert.match(entity, /available\.has\("expenses"\)/);
  assert.doesNotMatch(entity, /\.(insert|update|delete|upsert)\s*\(/);
});


test("Scoped Entity Questions classifies finance, estimates, calendar, documents and history", () => {
  assert.equal(detectEntityQuestionScope("Cât am încasat de la clientul Popescu?"), "finance");
  assert.equal(detectEntityQuestionScope("Ce devize are clientul Popescu?"), "estimates");
  assert.equal(detectEntityQuestionScope("Când e următoarea programare pentru clientul Popescu?"), "calendar");
  assert.equal(detectEntityQuestionScope("Ce documente are lucrarea Revizie centrală?"), "documents");
  assert.equal(detectEntityQuestionScope("Ce am făcut pentru clientul Popescu?"), "history");
  assert.equal(detectEntityQuestionScope("Arată-mi clientul Popescu"), "overview");

  const entity = read("lib/ai/entity-intelligence.ts");
  const scopes = read("lib/ai/entity-intelligence-scopes.ts");
  assert.match(entity, /clientScopedResponse/);
  assert.match(entity, /workScopedResponse/);
  assert.match(entity, /EntityFinanceSummary/);
  assert.match(scopes, /moduleEnabled/);
  assert.match(scopes, /roleAllowed/);
  assert.match(scopes, /scope === "finance"/);
  assert.match(scopes, /scope === "estimates"/);
  assert.match(scopes, /scope === "calendar"/);
  assert.match(scopes, /scope === "documents"/);
  assert.doesNotMatch(scopes, /\.(insert|update|delete|upsert)\s*\(/);
});


test("Operational time and priority queries stay bounded and tenant-scoped", () => {
  const query = read("lib/ai/operational-query.ts");
  assert.match(query, /kind === "tomorrow"/);
  assert.match(query, /kind === "week"/);
  assert.match(query, /kind === "urgent_tasks"/);
  assert.match(query, /kind === "unscheduled_tasks"/);
  assert.match(query, /\.gte\("scheduled_at", startIso\)/);
  assert.match(query, /\.lt\("scheduled_at", endIso\)/);
  assert.match(query, /\.limit\(kind === "week" \? 80 : 40\)/);
  assert.match(query, /\.eq\("organization_id", actor\.organizationId\)/);
  assert.doesNotMatch(query, /\.(insert|update|delete|upsert)\s*\(/);
});


test("Business Brief Focus Mode stays bounded, tenant-scoped and read-only", () => {
  const query = read("lib/ai/operational-query.ts");
  const brief = read("lib/ai/business-briefing.ts");

  assert.match(query, /kind === "briefing"/);
  assert.match(query, /answerBusinessBriefing\(actor, available\)/);
  assert.match(brief, /\.eq\("organization_id", actor\.organizationId\)/);
  assert.match(brief, /\.limit\(120\)/);
  assert.match(brief, /\.limit\(80\)/);
  assert.match(brief, /\.limit\(40\)/);
  assert.match(brief, /Focus #1/);
  assert.match(brief, /rankCandidates/);
  assert.doesNotMatch(brief, /\.(insert|update|delete|upsert)\s*\(/);
});
