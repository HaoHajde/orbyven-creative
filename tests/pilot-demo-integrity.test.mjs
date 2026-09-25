import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const names = {
  "006": "pilot-006-barbershop", "007": "pilot-007-restaurant",
  "008": "pilot-008-real-estate", "009": "pilot-009-auto-service",
  "010": "pilot-010-dental-clinic", "011": "pilot-011-retreat",
  "012": "pilot-012-movement", "013": "pilot-013-construction",
};
const home = read("app/templates/page.tsx");
const preview = read("components/FeaturedTemplatePreview.tsx");
const manifest = JSON.parse(read("data/templates/demo-006-013.json"));

test("eight unique, searchable demos have complete HTML, routes and category cards", () => {
  assert.equal(Object.keys(names).length, 8);
  assert.equal(manifest.profiles.length, 8);
  for (const [id, slug] of Object.entries(names)) {
    const route = "/templates/" + slug;
    const file = "public/orbyven-demos/pilot-" + id + "/index.html";
    const page = read("app/templates/" + slug + "/page.tsx");
    const html = read(file);
    assert.match(html, /<html\b/i, file);
    assert.match(html, /<\/html>/i, file);
    assert.match(html, /<script\b/i, file);
    assert.ok(html.length > 10000, file);
    assert.ok(page.includes("/orbyven-demos/pilot-" + id + "/index.html"), slug);
    assert.ok(page.includes('index: false'), slug);
    assert.ok(home.includes('href: "' + route + '"'), slug + " missing card");
    assert.ok(home.includes('"' + route + '"'), slug + " missing category");
    assert.ok(preview.includes("demo" + id + ":"), slug + " missing thumbnail");
    const profile = manifest.profiles.find((item) => item.id === id);
    assert.equal(profile.slug, slug);
    assert.ok(profile.variants.length >= 4);
    assert.ok(profile.modules.length >= 4);
  }
});

test("catalog stays in current ORBYVEN category layout and keeps legacy templates", () => {
  for (const route of [
    "/templates/asfaltari-bucuresti", "/templates/haos-customs",
    "/templates/obsidian-moments", "/templates/florarie-bragadiru",
    "/templates/barbershop", "/templates/botez-fetita", "/templates/botez-baietel",
    "/templates/majorat"
  ]) assert.ok(home.includes(route), "Lost existing route " + route);
  assert.match(home, /function FeaturedCard/);
  assert.match(home, /templateCategories\.map/);
  assert.match(home, /FeaturedTemplatePreview kind=\{item.kind\}/);
});

test("demo media is local or self-embedded; no missing relative file dependencies", () => {
  for (const id of Object.keys(names)) {
    const html = read("public/orbyven-demos/pilot-" + id + "/index.html");
    const staticRefs = [...html.matchAll(/(?:src|href)=["'](?!data:|https?:|#|mailto:|tel:|javascript:|\$\{)([^"'#]+)["']/g)];
    assert.deepEqual(staticRefs.map((m) => m[1]), [], id + " references missing standalone asset");
  }
});

test("no Reverse shortcut is injected into templates or embedded demos", () => {
  const files = [
    "components/TemplateExperienceLayer.tsx",
    "app/demo/nunta",
    "app/templates",
    "public/orbyven-demos",
  ];
  while (files.length) {
    const path = files.pop();
    const absolute = join(root, path);
    if (!/\.(tsx|jsx|html)$/.test(path)) {
      for (const entry of readdirSync(absolute, { withFileTypes: true })) {
        files.push(join(path, entry.name));
      }
      continue;
    }
    assert.doesNotMatch(read(path), /\bReverse\b/, path + " still contains a Reverse button");
  }
});
