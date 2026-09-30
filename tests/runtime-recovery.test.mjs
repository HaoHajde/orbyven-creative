import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("global runtime failures have an accessible recovery path", () => {
  const source = read("app/global-error.tsx");
  assert.match(source, /"use client"/);
  assert.match(source, /role="alert"/);
  assert.match(source, /aria-live="assertive"/);
  assert.match(source, /onClick=\{reset\}/);
  assert.match(source, /href="\/workspace"/);
  assert.match(source, /100dvh/);
  assert.match(source, /safe-area-inset-top/);
  assert.match(source, /error\.digest/);
});

test("offline fallback does not imply private workspace caching", () => {
  const offline = read("public/offline.html");
  const worker = read("public/sw.js");
  assert.match(offline, /Datele private ale workspace-ului nu sunt salvate în cache-ul offline/);
  assert.ok(!worker.match(/PRECACHE[\s\S]*?\/workspace/));
  assert.match(worker, /request\.mode === "navigate"/);
});
