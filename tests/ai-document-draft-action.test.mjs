import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseMutationPrompt } from "../lib/ai/action-parser.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");
const fixedNow = new Date("2026-09-29T14:00:00.000Z");

test("Document Draft requires explicit content and never invents body text", () => {
  const result = parseMutationPrompt("Creează document Notă intervenție", {
    timeZone: "Europe/Bucharest",
    now: fixedNow,
  });
  assert.equal(result.kind, "needs_details");
  if (result.kind === "needs_details") assert.match(result.message, /nu inventează/i);
});

test("Document Draft parses explicit safe content and context", () => {
  const result = parseMutationPrompt(
    "Creează document Notă intervenție; conținut: Verificare finală realizată și predată clientului.; " +
    "categorie: general; client: Exemplu SRL; lucrare: Revizie centrală; deviz: DEV-2026-001",
    { timeZone: "Europe/Bucharest", now: fixedNow }
  );
  assert.equal(result.kind, "proposal");
  if (result.kind !== "proposal") return;
  assert.equal(result.proposal.actionType, "create_document_draft");
  assert.equal(result.proposal.targetModule, "documents");
  assert.equal(result.proposal.payload.title, "Notă intervenție");
  assert.equal(result.proposal.payload.content, "Verificare finală realizată și predată clientului.");
  assert.equal(result.proposal.payload.category, "general");
  assert.equal(result.proposal.payload.clientName, "Exemplu SRL");
  assert.equal(result.proposal.payload.taskTitle, "Revizie centrală");
  assert.equal(result.proposal.payload.estimateReference, "DEV-2026-001");
});

test("Document Draft refuses fiscal/media categories", () => {
  for (const category of ["factură", "bon", "chitanță", "foto"]) {
    const result = parseMutationPrompt(
      "Creează document Test; conținut: Text explicit.; categorie: " + category,
      { now: fixedNow }
    );
    assert.equal(result.kind, "needs_details");
  }
});

test("Document Draft supports only bounded draft categories", () => {
  const contract = parseMutationPrompt(
    "Creează document Contract draft; conținut: Text furnizat de utilizator.; categorie: contract",
    { now: fixedNow }
  );
  assert.equal(contract.kind, "proposal");
  if (contract.kind !== "proposal") return;
  assert.equal(contract.proposal.payload.category, "contract");
  assert.match(contract.proposal.summary, /DRAFT/);
});

test("Document action type is added without opening proposal table to browser roles", () => {
  const migration = read("supabase/migrations/20260929154500_ai_document_draft_action.sql");
  const base = read("supabase/migrations/20260929145800_ai_action_proposals.sql");
  assert.match(migration, /'create_document_draft'/);
  assert.match(base, /revoke all on table public\.ai_action_proposals from public, anon, authenticated/);
});

test("Document executor writes only to private ORBYVEN storage and ops_documents", () => {
  const source = read("lib/ai/action-server.ts");
  assert.match(source, /from\("orbyven-documents"\)/);
  assert.match(source, /actor\.organizationId \+ "\/generated\/"/);
  assert.match(source, /DRAFT — ORBYVEN/);
  assert.match(source, /Necesită verificare înainte de utilizare/);
  assert.match(source, /from\("ops_documents"\)/);
  assert.match(source, /mime_type: "text\/plain"/);
  assert.match(source, /remove\(\[storagePath\]\)/);
});

test("Document context is same-tenant and mismatch checks fail closed", () => {
  const source = read("lib/ai/action-server.ts");
  assert.match(source, /resolveClientId\(actor\.organizationId, input\.clientName\)/);
  assert.match(source, /resolveWorkContext\(actor\.organizationId, input\.taskTitle, explicitClientId\)/);
  assert.match(source, /resolveEstimateContext\(/);
  assert.match(source, /ESTIMATE_TASK_MISMATCH/);
  assert.match(source, /ESTIMATE_CLIENT_MISMATCH/);
  assert.match(source, /\.eq\("organization_id", organizationId\)/);
});

test("Document Draft cannot create invoice or receipt metadata", () => {
  const parser = read("lib/ai/action-parser.ts");
  const server = read("lib/ai/action-server.ts");
  assert.match(parser, /factura\|invoice\|bon\|chitanta\|receipt/);
  assert.doesNotMatch(server, /category:\s*"invoice"/);
  assert.doesNotMatch(server, /category:\s*"receipt"/);
});
