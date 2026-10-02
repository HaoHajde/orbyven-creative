import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("offer checkout keeps all three progress steps visible on narrow screens", () => {
  const page = read("app/porneste/oferta/page.tsx");

  assert.match(page, /gap-1 overflow-hidden sm:gap-2 sm:overflow-x-auto/);
  assert.match(page, /min-w-0 flex-1 items-center sm:flex-none/);
  assert.match(page, /h-\[70px\][^"]*flex-1[^"]*sm:h-\[82px\][^"]*sm:w-\[168px\]/);
  assert.match(page, /hidden transition sm:inline-flex/);
  assert.match(page, /truncate text-\[9px\][^"]*sm:text-\[11px\]/);
  assert.match(page, /hidden shrink-0[^"]*sm:inline-flex[^"]*>MOD TEST \/ DEMO/);
});

test("checkout progress remains state-derived and payment stays gated by confirmation", () => {
  const page = read("app/porneste/oferta/page.tsx");

  assert.match(page, /const completed = index === 0 \|\| \(confirmed && index === 1\)/);
  assert.match(page, /const active = \(!confirmed && index === 1\) \|\| \(confirmed && index === 2\)/);
  assert.match(page, /href=\{confirmed \? `\/porneste\/plata\?offer=\$\{offerId\}` : "#"\}/);
  assert.match(page, /if \(!confirmed\) event\.preventDefault\(\)/);
  assert.doesNotMatch(page, /setInterval\(/);
});
