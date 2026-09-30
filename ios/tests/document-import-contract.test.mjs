import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("native shell exposes document intake bridge", () => {
  const app = read("../App.tsx");

  assert.match(app, /orbyven:native-documents/);
  assert.match(app, /onMessage=\{handleWebMessage\}/);
  assert.match(app, /orbyven:document-uploaded/);
  assert.match(app, /mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"/);
});

test("workspace routes native document intent to the existing document module", () => {
  const workspace = read("../../components/ClientWorkspace.tsx");

  assert.match(workspace, /orbyven:native-documents/);
  assert.match(workspace, /openModule\("documents", \{ create: true \}\)/);
});

test("document module uses browser session for Files and camera intake", () => {
  const documents = read("../../components/modules/DocumentsModule.tsx");

  assert.match(documents, /data-orbyven-document-picker="true"/);
  assert.match(documents, /data-orbyven-camera-picker="true"/);
  assert.match(documents, /capture="environment"/);
  assert.match(documents, /ReactNativeWebView/);
  assert.match(documents, /uploadDocument\(organizationId/);
  assert.doesNotMatch(documents, /service[_-]?role/i);
});

test("signed iOS build declares camera and photo permissions", () => {
  const config = JSON.parse(read("../app.json"));

  assert.match(config.expo.ios.infoPlist.NSCameraUsageDescription, /ORBYVEN/);
  assert.match(config.expo.ios.infoPlist.NSPhotoLibraryUsageDescription, /ORBYVEN/);
});
