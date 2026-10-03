import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(process.cwd(), "components/WorkspaceIntelligence.tsx"),
  "utf8"
);
const workspaceSource = readFileSync(
  join(process.cwd(), "components/WorkspaceShell.tsx"),
  "utf8"
);

test("ORBYVEN Intelligence launcher is viewport-fixed and does not occupy workspace layout", () => {
  assert.match(source, /className="orbyven-intelligence-launcher fixed bottom-\[calc\(5\.35rem\+env\(safe-area-inset-bottom\)\)\] right-4/);
  assert.doesNotMatch(source, /return \(\s*<div className="relative">/);
  assert.match(source, /aria-controls="orbyven-intelligence-dialog"/);
  assert.match(source, /createPortal/);
  assert.match(source, /document\.body/);
});

test("ORBYVEN Intelligence opens as a modal overlay with mobile-safe scrolling", () => {
  assert.match(source, /id="orbyven-intelligence-dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /fixed inset-0 z-\[100\]/);
  assert.match(source, /fixed inset-x-3 bottom-\[calc\(5\.75rem\+env\(safe-area-inset-bottom\)\)\] top-\[max\(0\.75rem,env\(safe-area-inset-top\)\)\] z-\[101\]/);
  assert.match(source, /overscroll-contain/);
  assert.match(source, /document\.body\.style\.overflow = "hidden"/);
  assert.match(source, /event\.key === "Escape"/);
});


test("ORBYVEN Intelligence portal keeps workspace theme variables and launcher toggles closed/open", () => {
  assert.match(source, /themeVars: CSSProperties/);
  assert.match(workspaceSource, /themeVars=\{vars\}/);
  assert.match(source, /style=\{themeVars\}/);
  assert.match(source, /data-orbyven-intelligence-theme-scope="true"/);
  assert.match(source, /text-\[var\(--text\)\]/);
  assert.match(source, /setOpen\(\(current\) => !current\)/);
  assert.match(source, /open \? "Închide ORBYVEN Intelligence" : "Deschide ORBYVEN Intelligence"/);
  assert.match(source, /M7 7l10 10M17 7 7 17/);
});
