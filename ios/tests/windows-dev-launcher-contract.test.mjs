import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Windows iPhone launcher keeps Expo Go development one-command and local-first", () => {
  const launcher = read("start-iphone.cmd");
  const tunnel = read("start-iphone-tunnel.cmd");

  assert.match(launcher, /Node\.js 22\.13\+/);
  assert.match(launcher, /npm install --no-audit --no-fund/);
  assert.match(launcher, /npm run start:go/);
  assert.match(launcher, /npm run start:tunnel/);
  assert.match(launcher, /Expo Go/);
  assert.match(launcher, /aceeasi retea Wi-Fi/);
  assert.match(tunnel, /start-iphone\.cmd tunnel/);

  assert.doesNotMatch(launcher, /apple.*password|certificate|provisioning|service[_-]?role/i);
});
