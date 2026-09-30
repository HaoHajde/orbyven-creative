import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(process.cwd(), "components/WorkspaceIntelligence.tsx"),
  "utf8"
);

test("ORBYVEN Intelligence launcher is viewport-fixed and does not occupy workspace layout", () => {
  assert.match(source, /className="fixed bottom-\\[calc\\(1rem\\+env\\(safe-area-inset-bottom\\)\\)\\] right-4/);
  assert.doesNotMatch(source, /return \(\s*<div className="relative">/);
  assert.match(source, /aria-controls="orbyven-intelligence-dialog"/);
  assert.match(source, /createPortal/);
  assert.match(source, /document\.body/);
});

test("ORBYVEN Intelligence opens as a modal overlay with mobile-safe scrolling", () => {
  assert.match(source, /id="orbyven-intelligence-dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /fixed inset-0 z-\[100\]/);
  assert.match(source, /fixed inset-x-3 bottom-3 top-3 z-\[101\]/);
  assert.match(source, /overscroll-contain/);
  assert.match(source, /document\.body\.style\.overflow = "hidden"/);
  assert.match(source, /event\.key === "Escape"/);
});
