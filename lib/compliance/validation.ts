// Internal-only legal operations. Pure validation shared by API and offline tests.
// A staff-recorded hash/reference is NOT a verified signature or consent.
export type ContractKind = "contract" | "order_form" | "dpa" | "amendment" | "other";
export type PrivacyKind = "access" | "rectification" | "erasure" | "portability" | "restriction" | "objection" | "other";
export type PrivacyRole = "undetermined" | "controller" | "processor";
export type PrivacyStatus = "received" | "identity_check" | "triage" | "in_progress" | "responded" | "closed";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/;
const CONTRACT_TYPES = new Set<ContractKind>(["contract","order_form","dpa","amendment","other"]);
const REQUEST_TYPES = new Set<PrivacyKind>(["access","rectification","erasure","portability","restriction","objection","other"]);
const PROCESSING_ROLES = new Set<PrivacyRole>(["undetermined","controller","processor"]);
const CHANNELS = new Set(["email","form","other"]);
const TRANSITIONS: Record<PrivacyStatus, PrivacyStatus[]> = {
  received: ["identity_check","triage"],
  identity_check: ["triage"],
  triage: ["in_progress"],
  in_progress: ["responded"],
  responded: ["closed"],
  closed: [],
};

export class ComplianceValidationError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}

function fail(code: string, message: string): never {
  throw new ComplianceValidationError(code,message);
}

export function requireUuid(value: unknown, field = "organizationId"): string {
  if (typeof value !== "string" || !UUID.test(value)) fail("invalid_uuid", field + " must be a UUID.");
  return value;
}

function text(value: unknown, name: string, min: number, max: number): string {
  if (typeof value !== "string") fail("invalid_" + name, name + " is required.");
  const v = value.trim();
  if (v.length < min || v.length > max) fail("invalid_" + name, name + " length is invalid.");
  if (/[\u0000-\u001f\u007f]/.test(v)) fail("invalid_" + name, name + " has control characters.");
  return v;
}

export function parseContractRecord(body: Record<string, unknown>) {
  const organization_id = requireUuid(body.organizationId);
  const document_type = text(body.documentType,"documentType",1,24) as ContractKind;
  if (!CONTRACT_TYPES.has(document_type)) fail("invalid_document_type","Unknown contract type.");
  const title = text(body.title,"title",4,160);
  const document_version = text(body.documentVersion,"documentVersion",1,80);
  const sha256 = text(body.sha256,"sha256",64,64).toLowerCase();
  if (!SHA256.test(sha256)) fail("invalid_hash","Expected a 64-character SHA-256 digest.");
  const evidence_reference = text(body.evidenceReference,"evidenceReference",4,450);
  // Internal opaque reference or private storage path, not an arbitrary external URL.
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(evidence_reference) ||
      evidence_reference.includes("..") || evidence_reference.includes("://")) {
    fail("invalid_reference","Use a private document identifier or storage path, not a public URL.");
  }
  return {organization_id,document_type,title,document_version,sha256,evidence_reference};
}

export function parsePrivacyCase(body: Record<string, unknown>) {
  const organization_id = body.organizationId === null || body.organizationId === ""
    ? null : requireUuid(body.organizationId);
  const subject_reference = text(body.subjectReference,"subjectReference",4,120);
  if (subject_reference.includes("@") || /\b[0-9]{12,}\b/.test(subject_reference)) {
    fail("subject_reference_sensitive","Use an internal pseudonymous reference, not email or personal identification number.");
  }
  const request_type = text(body.requestType,"requestType",1,32) as PrivacyKind;
  const processing_role = text(body.processingRole,"processingRole",1,32) as PrivacyRole;
  const channel = text(body.channel,"channel",1,32);
  if (!REQUEST_TYPES.has(request_type) || !PROCESSING_ROLES.has(processing_role) || !CHANNELS.has(channel)) {
    fail("invalid_case_type","Unknown case category, processing role or channel.");
  }
  return {organization_id,subject_reference,request_type,processing_role,channel};
}

export function parsePrivacyTransition(body: Record<string, unknown>, previous: PrivacyStatus) {
  const id = requireUuid(body.id,"id");
  const status = text(body.status,"status",1,32) as PrivacyStatus;
  if (!TRANSITIONS[previous]?.includes(status)) fail("invalid_transition","Invalid privacy-case state transition.");
  const note = text(body.actionNote,"actionNote",status === "responded" || status === "closed" ? 8 : 4,500);
  return {id,status,last_action:note};
}

/** GDPR Art 12 baseline is a calendar month, not always 30 days. No automatic extensions. */
export function oneMonthDeadline(receivedAt: Date): string {
  if (Number.isNaN(receivedAt.getTime())) fail("invalid_date","Received date is invalid.");
  const nextMonthLastDay = new Date(Date.UTC(
    receivedAt.getUTCFullYear(), receivedAt.getUTCMonth()+2, 0
  )).getUTCDate();
  const next = new Date(receivedAt);
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth()+1);
  next.setUTCDate(Math.min(receivedAt.getUTCDate(),nextMonthLastDay));
  return next.toISOString();
}
