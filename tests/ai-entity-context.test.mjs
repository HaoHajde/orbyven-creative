import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  detectContextEntityReferences,
  detectImplicitEntityFollowUp,
  findLatestContextEntityCandidate,
} from "../lib/ai/context-entity-core.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");
const now = new Date("2026-09-30T06:00:00.000Z");
const at = (minutesAgo) => new Date(now.getTime() - minutesAgo * 60000).toISOString();

function assistant(facts, minutesAgo = 2) {
  return {
    id: "a-" + minutesAgo,
    role: "assistant",
    specialist: "operations",
    content: "Context ORBYVEN",
    facts,
    createdAt: at(minutesAgo),
  };
}

test("Entity reference detection supports bounded Romanian forms and respects explicit fields", () => {
  assert.deepEqual(
    detectContextEntityReferences("Creează lucrare nouă pentru clientul acela"),
    { client: true, work: false }
  );
  assert.deepEqual(
    detectContextEntityReferences("Creează document pentru lucrarea aceea; conținut: test"),
    { client: false, work: true }
  );
  assert.deepEqual(
    detectContextEntityReferences("Creează document pentru lucrării de mai sus; conținut: test"),
    { client: false, work: true }
  );
  assert.deepEqual(
    detectContextEntityReferences("Creează lucrare; client: Exemplu SRL"),
    { client: false, work: false }
  );
});

test("Latest client candidate can come from a confirmed client proposal fact set", () => {
  const result = findLatestContextEntityCandidate([
    assistant([
      { label: "Tip", value: "Client" },
      { label: "Nume", value: "Exemplu SRL" },
    ]),
  ], "client", now);
  assert.deepEqual(result, { value: "Exemplu SRL", stale: false });
});

test("Latest work candidate can come from a work proposal title", () => {
  const result = findLatestContextEntityCandidate([
    assistant([
      { label: "Tip", value: "Lucrare" },
      { label: "Titlu", value: "Revizie centrală" },
    ]),
  ], "work", now);
  assert.deepEqual(result, { value: "Revizie centrală", stale: false });
});

test("Direct Client and Lucrare facts are preferred from the latest relevant assistant message", () => {
  const messages = [
    assistant([{ label: "Client", value: "Client vechi" }], 10),
    assistant([{ label: "Client", value: "Client recent" }], 2),
  ];
  assert.deepEqual(
    findLatestContextEntityCandidate(messages, "client", now),
    { value: "Client recent", stale: false }
  );
});

test("Entity context expires after the bounded recency window", () => {
  const result = findLatestContextEntityCandidate([
    assistant([{ label: "Lucrare", value: "Lucrare veche" }], 45),
  ], "work", now);
  assert.deepEqual(result, { value: "Lucrare veche", stale: true });
});

test("Resolver validates candidates inside the authenticated organization before augmentation", () => {
  const source = read("lib/ai/context-entity-resolver.ts");
  assert.match(source, /\.eq\("organization_id", actor\.organizationId\)/);
  assert.match(source, /\.eq\("kind", "work"\)/);
  assert.match(source, /if \(matches\.length === 1\) return "valid"/);
  assert.match(source, /clarificationFor/);
  assert.match(source, /client: \$\{candidate\.value\}/);
  assert.match(source, /lucrare: \$\{candidate\.value\}/);
});

test("Intelligence route clarifies unresolved references before Agent Action parsing", () => {
  const route = read("app/api/ai/intelligence/route.ts");
  assert.match(route, /resolveContextualEntityReferences/);
  assert.match(route, /if \(entityContext\.clarification\)/);
  assert.match(route, /Referință neconfirmată/);
  assert.match(route, /entityContext\.effectivePrompt/);
  assert.match(route, /entityContextUsed: entityContext\.usedContext/);
});


test("Implicit entity follow-up detection is conservative and topic-scoped", () => {
  assert.equal(detectImplicitEntityFollowUp("Și cât mai am de încasat?"), true);
  assert.equal(detectImplicitEntityFollowUp("Dar ce devize are?"), true);
  assert.equal(detectImplicitEntityFollowUp("Iar următoarea programare?"), true);
  assert.equal(detectImplicitEntityFollowUp("Și documentele?"), true);
  assert.equal(detectImplicitEntityFollowUp("Cât am de încasat?"), false);
  assert.equal(detectImplicitEntityFollowUp("Și creează un client nou"), false);
  assert.equal(detectImplicitEntityFollowUp("Și cât am încasat; client: Exemplu SRL"), false);
});

test("Resolver only inherits one recent implicit entity and keeps validation boundaries", () => {
  const source = read("lib/ai/context-entity-resolver.ts");
  assert.match(source, /detectImplicitEntityFollowUp\(cleanPrompt\)/);
  assert.match(source, /recent\.length === 1/);
  assert.match(source, /recent\.length > 1/);
  assert.match(source, /Follow-up-ul poate face referire atât la client, cât și la lucrare/);
  assert.match(source, /validateClient/);
  assert.match(source, /validateWork/);
});
