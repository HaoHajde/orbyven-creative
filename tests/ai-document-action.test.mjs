import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseMutationPrompt } from "../lib/ai/action-parser.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");
const fixedNow = new Date("2026-09-29T14:00:00.000Z");

test("Document action requires explicit content and never invents a draft body", () => {
  const result = parseMutationPrompt(
    "Creează document Raport intervenție; client: Exemplu SRL",
    { timeZone: "Europe/Bucharest", now: fixedNow }
  );
  assert.equal(result.kind, "needs_details");
  if (result.kind === "needs_details") {
    assert.equal(result.targetModule, "documents");
    assert.match(result.message, /nu inventează/i);
  }
});

test("Document action parses bounded explicit draft context", () => {
  const result = parseMutationPrompt(
    "Creează document Raport intervenție; categorie: contract; client: Exemplu SRL; " +
    "lucrare: Revizie centrală; conținut: S-a verificat instalația și nu s-au identificat pierderi.; " +
    "notă: draft pentru verificare internă",
    { timeZone: "Europe/Bucharest", now: fixedNow }
  );

  assert.equal(result.kind, "proposal");
  if (result.kind !== "proposal") return;
  assert.equal(result.proposal.actionType, "create_document_draft");
  assert.equal(result.proposal.targetModule, "documents");
  assert.equal(result.proposal.payload.title, "Raport intervenție");
  assert.equal(result.proposal.payload.category, "contract");
  assert.equal(result.proposal.payload.clientName, "Exemplu SRL");
  assert.equal(result.proposal.payload.taskTitle, "Revizie centrală");
  assert.equal(
    result.proposal.payload.content,
    "S-a verificat instalația și nu s-au identificat pierderi."
  );
  assert.ok(result.proposal.facts.some((fact) => fact.label === "Status" && fact.value === "Draft intern"));
});

test("Document action database history is mirrored and proposal constraint allows only the named action", () => {
  const migration = read("supabase/migrations/20260929152916_ai_document_draft_action.sql");
  assert.match(migration, /create_document_draft/);
  assert.match(migration, /ai_action_proposals_action_type_check/);
});

test("Document executor stores a tenant-scoped private text file and rolls back orphan storage", () => {
  const source = read("lib/ai/action-server.ts");
  assert.match(source, /actionType === "create_document_draft"\) return "documents"/);
  assert.match(source, /from\("orbyven-documents"\)/);
  assert.match(source, /actor\.organizationId \+ "\/ai\/" \+ globalThis\.crypto\.randomUUID\(\)/);
  assert.match(source, /contentType: "text\/plain"/);
  assert.match(source, /from\("ops_documents"\)[\s\S]*\.insert\(/);
  assert.match(source, /remove\(\[storagePath\]\)/);
  assert.match(source, /type: "ops_document", moduleId: "documents"/);
});

test("Document executor revalidates exact tenant context before creating metadata", () => {
  const source = read("lib/ai/action-server.ts");
  assert.match(source, /resolveClientId\(actor, input\.clientName\)/);
  assert.match(source, /resolveWorkContext\(actor, input\.taskTitle, explicitClientId\)/);
  assert.match(source, /TASK_CLIENT_MISMATCH/);
  assert.match(source, /organization_id: actor\.organizationId/);
  assert.match(source, /created_by: actor\.userId/);
});

test("Generated document is explicitly an internal unsigned, unvalidated draft", () => {
  const source = read("lib/ai/action-server.ts");
  assert.match(source, /ORBYVEN — DRAFT INTERN/);
  assert.match(source, /Nesemnat și nevalidat juridic automat/);
  assert.doesNotMatch(source, /signDocument|qualifiedSignature|eIDAS/);
});

test("Document draft failures are bounded at the confirmation endpoint", () => {
  const route = read("app/api/ai/actions/confirm/route.ts");
  assert.match(route, /INVALID_DOCUMENT_TITLE/);
  assert.match(route, /INVALID_DOCUMENT_CONTENT/);
  assert.match(route, /INVALID_DOCUMENT_SIZE/);
  assert.match(route, /Documentul draft conține date invalide/);
});
