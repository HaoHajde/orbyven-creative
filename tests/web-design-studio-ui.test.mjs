import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("authenticated AI Design uses the minimal multi-project studio", () => {
  const page = read("app/ai-web-design/page.tsx");
  const router = read("components/AiWebDesignRouter.tsx");
  const studio = read("components/ai/WebDesignStudio.tsx");

  assert.match(page, /AiWebDesignRouter/);
  assert.match(router, /WebDesignStudio/);
  assert.match(studio, /label: "Website"/);
  assert.match(studio, /label: "Nuntă"/);
  assert.match(studio, /label: "Botez"/);
  assert.match(studio, /label: "Eveniment"/);
  assert.match(studio, /promptForMode/);
  assert.match(studio, /invitație online de nuntă/);
  assert.match(studio, /invitație online de botez/);
  assert.match(studio, /invitație online pentru un eveniment/);
  assert.match(studio, /"Generează"/);
  assert.doesNotMatch(studio, /Generative Web Design Specialist/);
  assert.doesNotMatch(studio, /ORBYVEN folosește gratuit motorul local/);
});
