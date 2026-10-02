import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const shell = readFileSync(join(process.cwd(), "components/WorkspaceShell.tsx"), "utf8");
const overview = readFileSync(join(process.cwd(), "components/modules/OverviewModule.tsx"), "utf8");
const intelligence = readFileSync(join(process.cwd(), "components/WorkspaceIntelligence.tsx"), "utf8");

test("mobile workspace uses a five-action app dock instead of the floating active-module pill", () => {
  assert.match(shell, /aria-label="Navigare mobilă ORBYVEN"/);
  assert.match(shell, /grid-cols-5/);
  assert.match(shell, />Overview</);
  assert.match(shell, />Lucrări</);
  assert.match(shell, />Clienți</);
  assert.match(shell, />Mai multe</);
  assert.doesNotMatch(shell, /mobileModuleMenuOpen \? "Închide" : activeDefinition\.shortName/);
});

test("mobile app chrome reserves iPhone safe areas and keeps Intelligence above navigation", () => {
  assert.match(shell, /orbyven-workspace-header/);
  assert.match(shell, /bottom-\[max\(0\.45rem,env\(safe-area-inset-bottom\)\)\]/);
  assert.match(intelligence, /bottom-\[calc\(5\.35rem\+env\(safe-area-inset-bottom\)\)\]/);
  assert.match(intelligence, /top-\[max\(0\.75rem,env\(safe-area-inset-top\)\)\]/);
});

test("overview metrics keep the two-column mobile layout with denser cards", () => {
  assert.match(overview, /grid-cols-2 gap-2 sm:gap-2\.5/);
  assert.match(overview, /h-\[38px\].*sm:h-\[48px\]/);
  assert.match(overview, /text-\[24px\].*sm:text-\[31px\]/);
});
