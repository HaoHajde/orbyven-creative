import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app/templates/page.tsx", import.meta.url), "utf8");
const preview = readFileSync(new URL("../components/FeaturedTemplatePreview.tsx", import.meta.url), "utf8");

test("real featured and catalog previews remain available while offscreen painting is deferred", () => {
  assert.match(source, /href=\{item\.href\}[\s\S]{0,160}contentVisibility: "auto", containIntrinsicSize: "auto 480px"/);
  assert.match(source, /href=\{`\/templates\/\$\{template\.slug\}`\}[\s\S]{0,160}contentVisibility: "auto", containIntrinsicSize: "auto 520px"/);
  assert.match(source, /<FeaturedTemplatePreview kind=\{item\.kind\} \/>/);
  assert.match(source, /<ClientTemplatePreview template=\{template\} compact \/>/);
  assert.doesNotMatch(source, /data:image\/|placeholder-preview|fake-preview/i);
});

test("iframe previews retain near-viewport activation rather than loading every embedded demo on entry", () => {
  assert.match(preview, /new IntersectionObserver/);
  assert.match(preview, /rootMargin: "420px 0px"/);
  assert.match(preview, /shouldMount && \(/);
  assert.match(preview, /sandbox="allow-scripts"/);
});

test("LCP-critical hero heading is visible in HTML without a hydration-gated opacity animation", () => {
  assert.match(source, /<h1 className="mt-6 max-w-\[1120px\]/);
  assert.match(source, /Vezi\.[\s\S]{0,160}Înțelegi\.[\s\S]{0,160}Alegi\./);
  assert.doesNotMatch(source, /<motion\.h1/);
});
