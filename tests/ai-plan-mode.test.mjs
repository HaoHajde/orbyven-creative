import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { splitPlanClauses, applyPlanBindings } from "../lib/ai/plan-core.ts";
import { parseMutationPrompt } from "../lib/ai/action-parser.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("Plan Mode splits only on action boundaries and keeps field separators inside a step", () => {
  const clauses = splitPlanClauses(
    "Creează client Ana Popescu; apoi creează lucrare Revizie centrală pentru el; apoi creează deviz Deviz revizie; poziție: Montaj, 1 x 1500 lei"
  );
  assert.equal(clauses.length, 3);
  assert.match(clauses[0], /client Ana Popescu/i);
  assert.match(clauses[1], /lucrare Revizie centrală/i);
  assert.match(clauses[2], /poziție: Montaj, 1 x 1500 lei/i);
});

test("Plan bindings propagate a just-created client without changing the explicit work title", () => {
  const bound = applyPlanBindings(
    "creează lucrare Revizie centrală pentru el",
    { clientName: "Ana Popescu", lastEntity: "client" }
  );
  assert.match(bound, /creează lucrare Revizie centrală/i);
  assert.match(bound, /client: Ana Popescu/i);
  assert.doesNotMatch(bound, /pentru el/i);

  const parsed = parseMutationPrompt(bound);
  assert.equal(parsed.kind, "proposal");
  if (parsed.kind === "proposal" && parsed.proposal.actionType === "create_task") {
    assert.equal(parsed.proposal.payload.title, "Revizie centrală");
    assert.equal(parsed.proposal.payload.clientName, "Ana Popescu");
  }
});

test("Plan bindings turn programeaz-o into a calendar action linked to the work", () => {
  const bound = applyPlanBindings(
    "programeaz-o mâine la 10:30",
    { clientName: "Ana Popescu", workTitle: "Revizie centrală", lastEntity: "work" }
  );
  assert.match(bound, /Programează programare Revizie centrală/i);
  assert.match(bound, /lucrare: Revizie centrală/i);
  assert.match(bound, /client: Ana Popescu/i);

  const parsed = parseMutationPrompt(bound, {
    timeZone: "Europe/Bucharest",
    now: new Date("2026-09-30T06:00:00.000Z"),
  });
  assert.equal(parsed.kind, "proposal");
  if (parsed.kind === "proposal" && parsed.proposal.actionType === "create_calendar_event") {
    assert.equal(parsed.proposal.payload.taskTitle, "Revizie centrală");
    assert.equal(parsed.proposal.payload.clientName, "Ana Popescu");
  }
});


test("Plan bindings also propagate a newly created universal order into scheduling", () => {
  const bound = applyPlanBindings(
    "programeaz-o mâine la 14:00",
    { clientName: "Client SRL", orderTitle: "Comandă flori #12", lastEntity: "order" }
  );
  assert.match(bound, /Programează programare Comandă flori #12/i);
  assert.match(bound, /comanda: Comandă flori #12/i);
  assert.match(bound, /client: Client SRL/i);

  const parsed = parseMutationPrompt(bound, {
    timeZone: "Europe/Bucharest",
    now: new Date("2026-09-30T06:00:00.000Z"),
  });
  assert.equal(parsed.kind, "proposal");
  if (parsed.kind === "proposal" && parsed.proposal.actionType === "create_calendar_event") {
    assert.equal(parsed.proposal.payload.taskTitle, "Comandă flori #12");
    assert.equal(parsed.proposal.payload.clientName, "Client SRL");
  }
});

test("Plan compiler creates separate server-only proposals with explicit sequential dependencies", () => {
  const source = read("lib/ai/plan-server.ts");
  assert.match(source, /randomUUID/);
  assert.match(source, /__orbyven_plan/);
  assert.match(source, /dependsOnProposalId: index > 0 \? proposalIds\[index - 1\] : null/);
  assert.match(source, /from\("ai_action_proposals"\)\.insert\(rows\)/);
  assert.match(source, /kind: "review_plan"/);
  assert.doesNotMatch(source, /decideMutationProposal/);
});

test("Plan confirmation checks the previous proposal before the atomic claim", () => {
  const source = read("lib/ai/action-server.ts");
  const dependency = source.indexOf("await assertPlanDependency");
  const claim = source.indexOf('.update({ status: "executing"');
  assert.ok(dependency >= 0);
  assert.ok(claim > dependency);
  assert.match(source, /PLAN_DEPENDENCY_REQUIRED/);
  assert.match(source, /dependencyMeta\.step !== meta\.step - 1/);
});

test("Calendar execution revalidates and writes the universal operation linkage", () => {
  const source = read("lib/ai/action-server.ts");
  const start = source.indexOf("async function executeCalendar");
  const end = source.indexOf("async function executeEstimate");
  const calendar = source.slice(start, end);
  assert.match(calendar, /resolveWorkContext/);
  assert.match(calendar, /client_id: operation\.clientId/);
  assert.match(calendar, /task_id: operation\.taskId/);
});

test("Persisted Plan Mode state is actor and organization scoped", () => {
  const source = read("lib/ai/plan-server.ts");
  const route = read("app/api/ai/plans/route.ts");
  assert.match(source, /\.eq\("organization_id", actor\.organizationId\)/);
  assert.match(source, /\.eq\("actor_id", actor\.userId\)/);
  assert.match(source, /\.eq\("conversation_id", conversationId\)/);
  assert.match(route, /authenticateBillingActor\(request, organizationId, false\)/);
});

test("Language layer cannot rewrite Plan Mode actions", () => {
  const source = read("lib/ai/language-policy.ts");
  assert.match(source, /action\.kind === "review_plan"/);
});

test("Workspace renders separate per-step confirmation instead of one bulk execution control", () => {
  const source = read("components/WorkspaceIntelligence.tsx");
  assert.match(source, /PLAN MODE/);
  assert.match(source, /Confirmă pasul/);
  assert.match(source, /Oprește planul/);
  assert.match(source, /Fiecare pas se confirmă separat/);
  assert.match(source, /loadPlanForConversation/);
});
