import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const css = read("app/globals.css");
const shell = read("components/WorkspaceShell.tsx");

test("touch devices use focus-safe form control sizing", () => {
  assert.match(css, /@media \(pointer: coarse\)/);
  assert.match(css, /font-size: 16px/);
});

test("workspace fixed mobile controls respect dynamic viewport and safe area", () => {
  assert.match(shell, /env\(safe-area-inset-bottom/);
  assert.match(shell, /100dvh/);
});

test("mobile overlays remain scrollable on short and landscape screens", () => {
  assert.match(css, /max-height: calc\(100dvh/);
  assert.match(css, /overflow-y: auto/);
});

test("iOS native shell defers visible chrome to the trusted ORBYVEN web app", () => {
  const ios = read("ios/Orbyven/Orbyven/ContentView.swift");
  assert.match(ios, /WKWebView/);
  assert.match(ios, /orbyven\.ro\/workspace/);
});

test("dashboard text scaling has an explicit visual-integrity contract", () => {
  assert.match(css, /--workspace-scale/);
  assert.match(css, /transform: scale\(var\(--workspace-scale\)\)/);
});

test("workspace light theme uses a low-glare violet visual system", () => {
  assert.match(css, /caret-color: var\(--violet\)/);
  assert.match(css, /background: rgba\(116, 88, 215, 0\.20\)/);
});


test("Intelligence and public pages follow the active light theme", () => {
  const shell = read("components/WorkspaceShell.tsx");
  const intelligence = read("components/WorkspaceIntelligence.tsx");
  const home = read("components/HomePageClient.tsx");
  // Services was intentionally split into a thin route and a reusable client component.
  // Assert the visual contract on the component that actually owns the public shell.
  const servicesRoute = read("app/servicii/page.tsx");
  const services = read("components/PublicServicesPage.tsx");
  const contact = read("app/contact/page.tsx");
  const templates = read("app/templates/page.tsx");
  const aiWeb = read("components/AiWebDesignEntry.tsx");
  const header = read("components/SiteHeader.tsx");
  const css = read("app/globals.css");

  assert.match(servicesRoute, /PublicServicesPage/);
  assert.match(shell, /theme=\{theme\}/);
  assert.match(intelligence, /theme: "light" \| "dark"/);
  assert.match(intelligence, /data-orbyven-theme=\{theme\}/);
  assert.match(intelligence, /orbyven-intelligence-panel/);
  assert.match(intelligence, /orbyven-intelligence-composer-field/);

  for (const source of [home, services, contact, templates, aiWeb]) {
    assert.match(source, /data-orbyven-public-theme=\{theme\}/);
    assert.match(source, /orbyven-public-shell/);
    assert.match(source, /#e7e8f3/);
  }

  assert.match(header, /orbyven-public-header-surface/);
  assert.match(header, /orbyven-public-mobile-menu/);
  assert.match(css, /ORBYVEN INTELLIGENCE LIGHT THEME/);
  assert.match(css, /orbyven-intelligence-shell\[data-orbyven-theme="light"\]/);
  assert.match(css, /ORBYVEN PUBLIC LIGHT THEME/);
  assert.match(css, /orbyven-public-shell\[data-orbyven-public-theme="light"\]/);
});
