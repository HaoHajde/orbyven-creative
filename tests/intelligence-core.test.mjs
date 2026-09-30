import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { routeIntelligencePrompt } from "../lib/ai/intelligence-router.ts";
import { guidedResolutionForSignal } from "../lib/automation/resolution-playbooks.ts";

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
  const workspace = read("components/ClientWorkspace.tsx");
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


test("Guided Resolution playbooks explain a deterministic next step without executing it", () => {
  const blocked = guidedResolutionForSignal({
    rule: "operation_blocked",
    actionLabel: "Deblochează",
  });
  assert.equal(blocked.label, "Rezolvă blocajul");
  assert.match(blocked.rationale, /nu poate avansa/i);
  assert.equal(blocked.steps.length, 3);

  const resource = guidedResolutionForSignal({
    rule: "appointment_needs_resources",
    actionLabel: "Alocă resurse",
  });
  assert.equal(resource.label, "Pregătește resursele");
  assert.match(resource.steps.join(" "), /disponibil/i);
});

test("Operations AI turns ranked priorities into Guided Resolution actions", () => {
  const source = read("lib/ai/intelligence-server.ts");
  assert.match(source, /guidedResolutionForSignal/);
  assert.match(source, /kind: "guided_resolution"/);
  assert.match(source, /rationale: playbook\.rationale/);
  assert.match(source, /steps: playbook\.steps/);
  assert.doesNotMatch(source, /guided_resolution[\s\S]{0,1200}\.(insert|update|delete|upsert)\s*\(/);
});

test("Guided Resolution is rendered as guidance and only opens bounded workspace context", () => {
  const ui = read("components/WorkspaceIntelligence.tsx");
  assert.match(ui, /GUIDED RESOLUTION/);
  assert.match(ui, /action\.kind === "guided_resolution"/);
  assert.match(ui, /action\.steps\.map/);
  assert.match(ui, /onClick=\{\(\) => runAction\(action\)\}/);
  assert.match(ui, /0\.8\.14 Guided Resolution/);
});

test("Selective language layer cannot rewrite deterministic Guided Resolution actions", () => {
  const policy = read("lib/ai/language-policy.ts");
  assert.match(policy, /action\.kind === "guided_resolution"/);
});
