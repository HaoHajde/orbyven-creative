import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/BrandLogo.tsx", import.meta.url), "utf8");

test("desktop brand adapter does not bundle the large web PNG variants", () => {
  assert.doesNotMatch(source, /public\/branding\/orbyven-(?:logo|icon)-(?:dark|light)\.png/);
  assert.match(source, /app\/icon\.svg\?url/);
});
