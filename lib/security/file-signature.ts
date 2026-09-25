/**
 * Lightweight client-side file signature checks.
 * This is defense in depth, NOT malware/antivirus scanning. Supabase Storage's
 * MIME allowlist and tenant RLS remain the authoritative upload gate.
 */
export function hasExpectedFileSignature(
  mimeType: string,
  bytes: Uint8Array,
): boolean {
  const starts = (...magic: number[]) =>
    bytes.length >= magic.length && magic.every((value, i) => bytes[i] === value);
  const ascii = (start: number, length: number) =>
    Array.from(bytes.slice(start, start + length), (b) => String.fromCharCode(b)).join("");

  if (mimeType === "application/pdf") {
    return ascii(0, 5) === "%PDF-";
  }
  if (mimeType === "image/jpeg") {
    return starts(0xff, 0xd8, 0xff);
  }
  if (mimeType === "image/png") {
    return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  }
  if (mimeType === "image/webp") {
    return ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP";
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return starts(0x50, 0x4b, 0x03, 0x04);
  }
  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.ms-powerpoint"
  ) {
    return starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
  }
  if (mimeType === "text/plain" || mimeType === "text/csv") {
    return !bytes.includes(0);
  }
  // HEIC/HEIF has multiple brands; Storage's MIME policy still applies.
  return true;
}
