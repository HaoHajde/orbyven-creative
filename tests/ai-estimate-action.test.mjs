import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseMutationPrompt } from "../lib/ai/action-parser.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");
const fixedNow = new Date("2026-09-29T14:00:00.000Z");

test("Estimate action requires explicit line items and never invents prices", () => {
  const missing = parseMutationPrompt("Creează deviz Renovare baie; client: Exemplu SRL", {
    timeZone: "Europe/Bucharest",
    now: fixedNow,
  });
  assert.equal(missing.kind, "needs_details");
  if (missing.kind === "needs_details") assert.match(missing.message, /nu inventează prețuri/i);
});

test("Estimate action parses explicit items, totals and commercial context", () => {
  const result = parseMutationPrompt(
    "Creează deviz Renovare baie; client: Exemplu SRL; lucrare: Renovare apartament; " +
    "poziție: Montaj centrală, 1 x 1500 lei; poziție: Țeavă PPR, 12 x 25 lei; " +
    "discount: 100; tva: 21; manopera: 500; alte costuri: 80; valabil: 15.10.2026",
    { timeZone: "Europe/Bucharest", now: fixedNow }
  );

  assert.equal(result.kind, "proposal");
  if (result.kind !== "proposal") return;
  assert.equal(result.proposal.actionType, "create_estimate");
  assert.equal(result.proposal.targetModule, "estimates");
  assert.equal(result.proposal.payload.title, "Renovare baie");
  assert.equal(result.proposal.payload.clientName, "Exemplu SRL");
  assert.equal(result.proposal.payload.taskTitle, "Renovare apartament");
  assert.equal(result.proposal.payload.items.length, 2);
  assert.deepEqual(result.proposal.payload.items[0], {
    description: "Montaj centrală",
    quantity: 1,
    unitPriceLei: 1500,
  });
  assert.deepEqual(result.proposal.payload.items[1], {
    description: "Țeavă PPR",
    quantity: 12,
    unitPriceLei: 25,
  });
  assert.equal(result.proposal.payload.discountLei, 100);
  assert.equal(result.proposal.payload.taxRate, 21);
  assert.equal(result.proposal.payload.plannedLaborLei, 500);
  assert.equal(result.proposal.payload.otherCostLei, 80);
  assert.equal(result.proposal.payload.validUntil, "2026-10-15");
  assert.ok(result.proposal.facts.some((fact) => fact.label === "Status" && fact.value === "Draft"));
});

test("Estimate action accepts an order as operational context", () => {
  const result = parseMutationPrompt(
    "Creează deviz Comandă corporate; client: Exemplu SRL; comandă: Flori recepție; " +
    "poziție: Aranjament floral, 1 x 450 lei",
    { now: fixedNow }
  );
  assert.equal(result.kind, "proposal");
  if (result.kind !== "proposal") return;
  assert.equal(result.proposal.payload.taskTitle, "Flori recepție");
});

test("Estimate line parsing supports decimal quantities and prices", () => {
  const result = parseMutationPrompt(
    "Adaugă ofertă Materiale; item: Cablu, 2,5 x 19,90 lei",
    { now: fixedNow }
  );
  assert.equal(result.kind, "proposal");
  if (result.kind !== "proposal") return;
  assert.equal(result.proposal.payload.items[0].quantity, 2.5);
  assert.equal(result.proposal.payload.items[0].unitPriceLei, 19.9);
});

test("Estimate DB function is server-only, invoker mode and always creates draft", () => {
  const migration = read("supabase/migrations/20260929152500_ai_estimate_draft_action.sql");
  assert.match(migration, /security invoker/i);
  assert.match(migration, /'create_estimate'/);
  assert.match(migration, /'draft'/);
  assert.match(migration, /insert into public\.sales_estimates/);
  assert.match(migration, /insert into public\.sales_estimate_items/);
  assert.match(migration, /revoke execute[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute[\s\S]*to service_role/i);
});

test("Estimate execution resolves client and work in the authenticated organization", () => {
  const source = read("lib/ai/action-server.ts");
  assert.match(source, /resolveClientId\(actor\.organizationId, input\.clientName\)/);
  assert.match(source, /resolveWorkContext\(actor\.organizationId, input\.taskTitle, explicitClientId\)/);
  assert.match(source, /\.eq\("organization_id", organizationId\)/);
  assert.match(source, /\.in\("kind", \["work", "order"\]\)/);
  assert.match(source, /TASK_CLIENT_MISMATCH/);
  assert.match(source, /rpc\("ai_create_estimate_draft"/);
});

test("Estimate Agent Action cannot auto-send or auto-accept an estimate", () => {
  const parser = read("lib/ai/action-parser.ts");
  const server = read("lib/ai/action-server.ts");
  const migration = read("supabase/migrations/20260929152500_ai_estimate_draft_action.sql");
  assert.doesNotMatch(parser, /status:\s*"sent"/);
  assert.doesNotMatch(server, /status:\s*"sent"/);
  assert.doesNotMatch(server, /status:\s*"accepted"/);
  assert.match(migration, /'draft'/);
});
