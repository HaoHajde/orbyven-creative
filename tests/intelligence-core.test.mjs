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
  assert.equal(detectOperationalQuery("Ce opțiuni am pentru Focus #1?"), "decision_support");
  assert.equal(detectOperationalQuery("Compară variantele pentru prioritatea de acum"), "decision_support");
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


test("Focus explainability is structured, compact and persisted without a schema change", () => {
  const types = read("lib/ai/intelligence-types.ts");
  const brief = read("lib/ai/business-briefing.ts");
  const conversation = read("lib/ai/conversation-server.ts");
  const panel = read("components/WorkspaceIntelligence.tsx");

  assert.match(types, /export type IntelligenceFocusInsight/);
  assert.match(types, /focus\?: IntelligenceFocusInsight/);
  assert.match(brief, /function focusInsight/);
  assert.match(brief, /reason: "blocked"/);
  assert.match(brief, /reason: "overdue"/);
  assert.match(brief, /reason: "lead_followup"/);
  assert.match(brief, /consequence:/);
  assert.match(brief, /nextStep:/);
  assert.match(conversation, /Focus · De ce/);
  assert.match(conversation, /Focus · Risc/);
  assert.match(conversation, /Focus · Pas/);
  assert.match(panel, /data-orbyven-focus-explanation="true"/);
  assert.match(panel, />De ce</);
  assert.match(panel, />Risc</);
  assert.match(panel, />Următor</);
  assert.match(panel, /ORBYVEN INTELLIGENCE · 0\.8\.25/);
});


test("Decision Support compares options without choosing or mutating", () => {
  const types = read("lib/ai/intelligence-types.ts");
  const support = read("lib/ai/business-decision-support.ts");
  const query = read("lib/ai/operational-query.ts");
  const conversation = read("lib/ai/conversation-server.ts");
  const panel = read("components/WorkspaceIntelligence.tsx");

  assert.match(types, /export type IntelligenceDecisionOption/);
  assert.match(types, /export type IntelligenceDecisionSupport/);
  assert.match(types, /decision\?: IntelligenceDecisionSupport/);
  assert.match(support, /const OPTIONS: Record<IntelligenceFocusReason, IntelligenceDecisionOption\[]>/);
  assert.match(support, /alegerea rămâne la tine/);
  assert.match(support, /options: OPTIONS\[focus\.reason\]/);
  assert.doesNotMatch(support, /\.(insert|update|delete|upsert)\s*\(/);
  assert.match(query, /kind === "decision_support"/);
  assert.match(query, /answerDecisionSupport\(actor, available\)/);
  assert.match(conversation, /Decision · Context/);
  assert.match(conversation, /Decision · \$\{index \+ 1\}/);
  assert.match(panel, /data-orbyven-decision-support="true"/);
  assert.match(panel, /Compromis:/);
  assert.match(panel, /Potrivit când:/);
  assert.match(panel, /ORBYVEN INTELLIGENCE · 0\.8\.25/);
});


test("Decision Action handoff recalculates context and creates only confirmable proposals", () => {
  const types = read("lib/ai/intelligence-types.ts");
  const support = read("lib/ai/business-decision-support.ts");
  const route = read("app/api/ai/decisions/handoff/route.ts");
  const desktop = read("app/api/desktop/ai/decisions/handoff/route.ts");
  const panel = read("components/WorkspaceIntelligence.tsx");

  assert.match(types, /handoffPrompt\?: string/);
  assert.match(types, /handoffAvailable\?: boolean/);
  assert.match(support, /function handoffPlanPrompt/);
  assert.match(support, /Creează task/);
  assert.match(support, /apoi creează task/);
  assert.match(support, /HANDOFF_ROLES/);
  assert.match(support, /available\.has\("tasks"\)/);
  assert.match(support, /HANDOFF_ROLES\.has\(actor\.role\)/);
  assert.match(route, /Compară opțiunile pentru Focus #1/);
  assert.match(route, /DECISION_STALE/);
  assert.match(route, /decision\.subject !== expectedSubject/);
  assert.match(route, /option\.label !== expectedOptionLabel/);
  assert.match(route, /answerIntelligenceForActor\(\s*actor,\s*option\.handoffPrompt/);
  assert.match(route, /review_plan/);
  assert.match(route, /confirm_proposal/);
  assert.match(route, /proposal_only_explicit_confirmation_required/);
  assert.match(route, /appendUserConversationMessage/);
  assert.match(route, /persistAssistantResponse/);
  assert.match(desktop, /withDesktopCors/);
  assert.match(desktop, /desktopOptionsResponse/);
  assert.match(panel, /\/api\/ai\/decisions\/handoff/);
  assert.match(panel, /Pregătește planul/);
  assert.match(panel, /handoffAvailable/);
  assert.match(panel, /expectedSubject: decision\.subject/);
  assert.match(panel, /expectedOptionLabel:/);
  assert.match(panel, /ORBYVEN INTELLIGENCE · 0\.8\.25/);
});


test("Action Outcome Loop rechecks only completed plans and remains read-only", () => {
  const types = read("lib/ai/intelligence-types.ts");
  const outcome = read("lib/ai/action-outcome.ts");
  const route = read("app/api/ai/outcomes/recheck/route.ts");
  const desktop = read("app/api/desktop/ai/outcomes/recheck/route.ts");
  const conversation = read("lib/ai/conversation-server.ts");
  const panel = read("components/WorkspaceIntelligence.tsx");

  assert.match(types, /export type IntelligenceOutcome/);
  assert.match(types, /status: "no_longer_primary" \| "shifted" \| "still_priority"/);
  assert.match(types, /outcome\?: IntelligenceOutcome/);
  assert.match(outcome, /loadLatestPlanAction/);
  assert.match(outcome, /every\(\(step\) => step\.status === "executed"\)/);
  assert.match(outcome, /OUTCOME_PLAN_NOT_COMPLETE/);
  assert.match(outcome, /Fă-mi briefingul zilei/);
  assert.match(outcome, /outcomeAlreadyRecorded/);
  assert.match(outcome, /persistAssistantResponse/);
  assert.doesNotMatch(outcome, /\.(insert|update|delete|upsert)\s*\(/);
  assert.match(route, /recheckActionOutcome/);
  assert.match(route, /Cache-Control": "no-store"/);
  assert.match(desktop, /withDesktopCors/);
  assert.match(desktop, /desktopOptionsResponse/);
  assert.match(conversation, /Outcome · Plan/);
  assert.match(conversation, /Outcome · Status/);
  assert.match(panel, /\/api\/ai\/outcomes\/recheck/);
  assert.match(panel, /data-orbyven-outcome="true"/);
  assert.match(panel, /latestPlan\.steps\.every/);
  assert.match(panel, /ORBYVEN INTELLIGENCE · 0\.8\.25/);
});


test("Adaptive Follow-up routes Outcome states back into read-only analysis", () => {
  const panel = read("components/WorkspaceIntelligence.tsx");

  assert.match(panel, /function outcomeFollowUp/);
  assert.match(panel, /outcome\.status === "no_longer_primary"/);
  assert.match(panel, /Vezi briefingul actual/);
  assert.match(panel, /Fă-mi briefingul zilei/);
  assert.match(panel, /Compară noul Focus/);
  assert.match(panel, /Compară din nou/);
  assert.match(panel, /Compară opțiunile pentru Focus #1/);
  assert.match(panel, /void ask\(followUp\.prompt\)/);
  assert.match(panel, /ORBYVEN INTELLIGENCE · 0\.8\.25/);
});
