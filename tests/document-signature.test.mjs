import assert from "node:assert/strict";
import test from "node:test";
import { hasExpectedFileSignature } from "../lib/security/file-signature.ts";

const bytes = (...values) => Uint8Array.from(values);
const ascii = (value) => Uint8Array.from([...value].map((char) => char.charCodeAt(0)));

test("accepts canonical PDF/JPEG/PNG and WebP signatures", () => {
  assert.equal(hasExpectedFileSignature("application/pdf", ascii("%PDF-1.7")), true);
  assert.equal(hasExpectedFileSignature("image/jpeg", bytes(0xff, 0xd8, 0xff)), true);
  assert.equal(hasExpectedFileSignature("image/png", bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), true);
  assert.equal(hasExpectedFileSignature("image/webp", ascii("RIFF____WEBP")), true);
});
test("rejects mismatched signatures rather than trusting the browser MIME label", () => {
  assert.equal(hasExpectedFileSignature("application/pdf", ascii("<html>")), false);
  assert.equal(hasExpectedFileSignature("image/jpeg", ascii("not a jpeg")), false);
  assert.equal(hasExpectedFileSignature("image/webp", ascii("RIFF____AVIF")), false);
  assert.equal(hasExpectedFileSignature("text/plain", bytes(0x68, 0x69, 0)), false);
});
test("checks ZIP-based Office and legacy OLE Office containers", () => {
  const officeZip = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  assert.equal(hasExpectedFileSignature(officeZip, bytes(0x50, 0x4b, 0x03, 0x04)), true);
  assert.equal(hasExpectedFileSignature(officeZip, ascii("not office")), false);
  assert.equal(hasExpectedFileSignature("application/msword", bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)), true);
  assert.equal(hasExpectedFileSignature("application/msword", ascii("danger")), false);
});
