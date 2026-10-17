import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const studio = fs.readFileSync("components/video-ai/ProductFilmStudio.tsx", "utf8");
const roRoute = fs.readFileSync("app/video-ai/product-film/page.tsx", "utf8");
const enRoute = fs.readFileSync("app/en/video-ai/product-film/page.tsx", "utf8");

test("Product Film uses live ORBYVEN pages instead of screenshot assets", () => {
  assert.match(studio, /src:\s*"\/"/);
  assert.match(studio, /src:\s*"\/ai-web-design"/);
  assert.match(studio, /src:\s*"\/workspace"/);
  assert.match(studio, /<iframe/);
  assert.doesNotMatch(studio, /\.png|\.jpg|\.jpeg/);
});

test("Product Film records a native vertical 60fps canvas stream", () => {
  assert.match(studio, /const FPS = 60/);
  assert.match(studio, /const OUTPUT_WIDTH = 1080/);
  assert.match(studio, /const OUTPUT_HEIGHT = 1920/);
  assert.match(studio, /getDisplayMedia/);
  assert.match(studio, /canvas\.captureStream\(FPS\)/);
  assert.match(studio, /new MediaRecorder/);
  assert.match(studio, /videoBitsPerSecond:\s*18_000_000/);
});

test("Product Film keeps camera motion deterministic and continuous", () => {
  assert.match(studio, /requestAnimationFrame/);
  assert.match(studio, /easeInOutSine/);
  assert.match(studio, /sceneProgress/);
  assert.doesNotMatch(studio, /setInterval/);
});

test("Product Film is available in Romanian and English", () => {
  assert.match(roRoute, /ProductFilmStudio locale="ro"/);
  assert.match(enRoute, /ProductFilmStudio locale="en"/);
});
