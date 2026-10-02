import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const shell = readFileSync(join(process.cwd(), "components/WorkspaceShell.tsx"), "utf8");
const overview = readFileSync(join(process.cwd(), "components/modules/OverviewModule.tsx"), "utf8");
const intelligence = readFileSync(join(process.cwd(), "components/WorkspaceIntelligence.tsx"), "utf8");
const activity = readFileSync(join(process.cwd(), "components/WorkspaceActivityCenter.tsx"), "utf8");
const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const nativeIos = readFileSync(join(process.cwd(), "ios/App.tsx"), "utf8");

test("mobile workspace uses a five-action app dock instead of the floating active-module pill", () => {
  assert.match(shell, /aria-label="Navigare mobilă ORBYVEN"/);
  assert.match(shell, /grid-cols-5/);
  assert.match(shell, />Overview</);
  assert.match(shell, />Lucrări</);
  assert.match(shell, />Clienți</);
  assert.match(shell, />Mai multe</);
  assert.doesNotMatch(shell, /mobileModuleMenuOpen \? "Închide" : activeDefinition\.shortName/);
  assert.match(shell, /data-workspace-mobile-dock="true"/);
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


test("iPhone keyboard and secondary overlays do not fight the fixed app chrome", () => {
  assert.match(intelligence, /data-workspace-mobile-float="true"/);
  assert.match(css, /:has\(input:focus, textarea:focus, select:focus\)/);
  assert.match(css, /visibility: hidden/);
  assert.match(activity, /safe-area-inset-top/);
  assert.match(activity, /safe-area-inset-bottom/);
});

test("native iOS wrapper preserves the approved web workspace chrome", () => {
  assert.match(nativeIos, /const webAppOwnsChrome = isTrustedOrbyvenUrl\(currentUrl\)/);
  assert.match(nativeIos, /!webAppOwnsChrome \? \(/);
});


test("workspace restores the last enabled module across app sessions", () => {
  assert.match(shell, /LAST_WORKSPACE_MODULE_KEY/);
  assert.match(shell, /orbyven-workspace-last-module/);
  assert.match(shell, /localStorage\.setItem\(LAST_WORKSPACE_MODULE_KEY, id\)/);
  assert.match(shell, /localStorage\.getItem\([\s\S]*LAST_WORKSPACE_MODULE_KEY/);
  assert.match(shell, /enabledModules\.includes\(savedModule\)/);
  assert.match(shell, /setActiveModule\(savedModule\)/);
});


test("workspace signals native readiness only after its runtime is mounted", () => {
  assert.match(shell, /type: "orbyven:workspace-ready"/);
  assert.match(shell, /workspace\?\.organization\.id/);
  assert.match(shell, /ReactNativeWebView/);
});
