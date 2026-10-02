import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("offer feature scenes keep narrow-screen content inside the preview frame", () => {
  const scenes = read("components/offer/OfferFeatureScene.tsx");

  assert.match(scenes, /grid-cols-2 gap-2 px-4 sm:grid-cols-4/);
  assert.match(scenes, /h-20 min-w-0[^"]*sm:h-28/);
  assert.match(scenes, /grid-cols-1 gap-2 sm:grid-cols-\[1\.1fr_\.9fr\]/);
  assert.match(scenes, /hidden p-4 sm:block/);
  assert.match(scenes, /h-20 w-20 shrink-0[^"]*sm:h-28 sm:w-28/);
  assert.match(scenes, /grid-cols-2 gap-1\.5 sm:grid-cols-4/);
  assert.match(scenes, /inset-\[2%\][^"]*p-3[^"]*sm:inset-\[3%\]/);
  assert.match(scenes, /truncate text-\[12px\][^"]*sm:text-\[14px\]/);

  assert.doesNotMatch(scenes, /relative grid grid-cols-4 gap-3/);
  assert.doesNotMatch(scenes, /grid h-28 w-24 place-items-center/);
});

test("advanced offer hero compresses dashboard chrome instead of overflowing mobile", () => {
  const hero = read("components/offer/OfferHeroVisuals.tsx");

  assert.match(hero, /grid-cols-\[72px_minmax\(0,1fr\)\]/);
  assert.match(hero, /grid-cols-2 gap-1\.5 sm:mt-4 sm:grid-cols-4/);
  assert.match(hero, /grid-cols-\[minmax\(0,1fr\)_68px\]/);
  assert.match(hero, /h-12 w-12[^"]*sm:h-20 sm:w-20/);
  assert.match(hero, /min-w-0 truncate rounded-\[9px\]/);
  assert.match(hero, /function InteractiveHeroStage/);
  assert.match(hero, /event\.pointerType === "touch"/);
  assert.match(hero, /<InteractiveHeroStage/);
});
