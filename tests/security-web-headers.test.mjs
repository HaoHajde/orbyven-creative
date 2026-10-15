import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");

test("response headers include hardened browser isolation controls", () => {
  for (const header of [
    "Cross-Origin-Opener-Policy",
    "X-DNS-Prefetch-Control",
    "X-Permitted-Cross-Domain-Policies",
    "Origin-Agent-Cluster",
  ]) {
    assert.ok(config.includes(header), header);
  }
});

test("CSP protects framing, base URLs, objects and form destinations", () => {
  assert.match(config, /frame-ancestors 'self'/);
  assert.match(config, /base-uri 'self'/);
  assert.match(config, /object-src 'none'/);
  assert.match(config, /form-action 'self' https:\/\/\*\.stripe\.com/);
});

test("mixed-content upgrading is production-only so local development stays usable", () => {
  assert.match(config, /process\.env\.NODE_ENV === "production"/);
  assert.match(config, /upgrade-insecure-requests/);
});
