import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const modules = [
  "Overview", "Leads", "Tasks", "Calendar",
  "Estimates", "Documents", "Expenses", "Team",
];
const workspace = read("components/WorkspaceContent.tsx");
const preview = read("components/FeaturedTemplatePreview.tsx");
const client = read("components/ClientWorkspace.tsx");
const registry = read("lib/orbyven-modules.ts");

test("only the active workspace module is imported at runtime", () => {
  assert.match(workspace, /import dynamic from "next\/dynamic"/);
  assert.equal((workspace.match(/= dynamic\(\(\) => import\(/g) ?? []).length, modules.length);
  for (const name of modules) {
    assert.ok(
      workspace.includes(`const ${name}Module = dynamic(() => import("@/components/modules/${name}Module")`),
      `${name}: missing explicit lazy boundary`,
    );
    assert.ok(!workspace.includes(`import ${name}Module from`), `${name}: eager import has returned`);
  }
  assert.ok(!workspace.includes("ssr: false"), "Do not disable module SSR just to split the bundle");
  assert.match(workspace, /loading: WorkspaceModuleLoading/g);
  assert.match(workspace, /aria-live="polite"/);
  assert.match(workspace, /key=\{navigation\.token\}/);
});

test("module switching, deep-link creation and role props remain intact", () => {
  for (const id of ["overview", "leads", "tasks", "calendar", "estimates", "documents", "expenses"]) {
    assert.ok(workspace.includes(`activeModule === "${id}"`), `${id}: navigation branch removed`);
  }
  for (const arg of ["initialCreate", "initialRecordId", "initialClientId", "initialTaskId", "organizationId", "role", "onOpenModule"]) {
    assert.ok(workspace.includes(arg), `${arg}: existing module input removed`);
  }
  assert.match(client, /enabledModules\.includes\(id\)/);
  assert.match(client, /setMobileModuleMenuOpen\(false\)/);
  assert.match(registry, /id: "overview"/);
});

test("demo iframes wait near the viewport, then keep the existing safe iframe settings", () => {
  assert.match(preview, /function DeferredDemoIframe/);
  assert.match(preview, /new IntersectionObserver/);
  assert.match(preview, /rootMargin: "420px 0px"/);
  assert.match(preview, /observer\.disconnect\(\)/);
  assert.match(preview, /shouldMount && \(/);
  assert.match(preview, /loading="lazy"/);
  assert.match(preview, /sandbox="allow-scripts"/);
  assert.match(preview, /tabIndex=\{-1\}/);
  assert.match(preview, /h-\[338px\]/);
  assert.match(preview, /<DeferredDemoIframe number=\{demo\.number\}/);
  assert.match(preview, /requestAnimationFrame/);
});

test("existing template catalog, security and legal code are outside this performance patch", () => {
  const catalog = read("app/templates/page.tsx");
  for (let id = 6; id <= 13; id++) {
    const padded = String(id).padStart(3, "0");
    assert.ok(catalog.includes(`demo${padded}`), `pilot ${padded} lost catalog card`);
  }
  assert.match(read("package.json"), /"test:security":/);
  assert.match(read(".github/workflows/ci.yml"), /npm run test:security/);
});
