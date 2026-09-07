import process from "node:process";

const owner = process.env.ORBYVEN_OWNER ?? "";
const ownerCount = Number(process.env.ORBYVEN_OWNER_COUNT ?? "0");
const integrationCount = Number(process.env.ORBYVEN_INTEGRATION_COUNT ?? "0");
const changedFiles = JSON.parse(process.env.ORBYVEN_CHANGED_FILES ?? "[]");
const override = process.env.ORBYVEN_ARCHITECTURE_OVERRIDE === "true";

const ownerLabels = new Set([
  "chat-1-modules",
  "chat-2-platform",
  "chat-3-billing",
  "chat-4-public",
]);

if (ownerCount > 1) {
  console.error("ORBYVEN Architecture Guard: a PR may have only one chat ownership label.");
  process.exit(1);
}

if (integrationCount > 1) {
  console.error("ORBYVEN Architecture Guard: a PR may have only one integration-NN label.");
  process.exit(1);
}

if (integrationCount === 1 && ownerCount !== 1) {
  console.error("ORBYVEN Architecture Guard: every PR in the integration train must have exactly one chat ownership label.");
  process.exit(1);
}

if (!ownerLabels.has(owner)) {
  console.log("ORBYVEN Architecture Guard: no ownership label supplied; ownership path checks skipped.");
  process.exit(0);
}

const protectedByOwner = {
  "chat-1-modules": [
    [/^app\/control-center(?:\/|$)/, "Chat 2 · Platform Core / Control Center"],
    [/^app\/api\/control-center(?:\/|$)/, "Chat 2 · Platform Core / Control Center"],
    [/^lib\/orbyven-control-center(?:[-/.]|$)/, "Chat 2 · Platform Core / Control Center"],
    [/^app\/legal(?:\/|$)/, "Chat 3 · Legal / Billing"],
    [/^app\/api\/(?:billing|stripe|fiscal)(?:\/|$)/, "Chat 3 · Legal / Billing"],
    [/^lib\/(?:billing|legal)(?:\/|[-.]|$)/, "Chat 3 · Legal / Billing"],
    [/^components\/ClientTemplate/, "Chat 4 · Public Website / Templates"],
    [/^lib\/client-template-catalog\.ts$/, "Chat 4 · Public Website / Templates"],
  ],
  "chat-2-platform": [
    [/^app\/legal(?:\/|$)/, "Chat 3 · Legal / Billing"],
    [/^app\/api\/(?:billing|stripe|fiscal)(?:\/|$)/, "Chat 3 · Legal / Billing"],
    [/^lib\/(?:billing|legal)(?:\/|[-.]|$)/, "Chat 3 · Legal / Billing"],
    [/^components\/ClientTemplate/, "Chat 4 · Public Website / Templates"],
    [/^lib\/client-template-catalog\.ts$/, "Chat 4 · Public Website / Templates"],
    [/^lib\/orbyven-leads(?:[-/.]|$)/, "Chat 1 · Modules"],
    [/^components\/(?:Leads|ClientWorkspaceContent|ClientWorkspaceStore)/, "Chat 1 · Modules"],
  ],
  "chat-3-billing": [
    [/^app\/control-center(?:\/|$)/, "Chat 2 · Platform Core / Control Center"],
    [/^app\/api\/control-center(?:\/|$)/, "Chat 2 · Platform Core / Control Center"],
    [/^lib\/orbyven-control-center(?:[-/.]|$)/, "Chat 2 · Platform Core / Control Center"],
    [/^lib\/orbyven-leads(?:[-/.]|$)/, "Chat 1 · Modules"],
    [/^components\/(?:Leads|ClientWorkspaceContent|ClientWorkspaceStore)/, "Chat 1 · Modules"],
    [/^lib\/orbyven-modules\.ts$/, "Chat 1 · Module registry"],
    [/^components\/ClientTemplate/, "Chat 4 · Public Website / Templates"],
    [/^lib\/client-template-catalog\.ts$/, "Chat 4 · Public Website / Templates"],
  ],
  "chat-4-public": [
    [/^app\/workspace(?:\/|$)/, "Chat 1/2 · Client Workspace / Platform Core"],
    [/^app\/control-center(?:\/|$)/, "Chat 2 · Platform Core / Control Center"],
    [/^app\/api\/control-center(?:\/|$)/, "Chat 2 · Platform Core / Control Center"],
    [/^lib\/orbyven-(?:workspace|control-center|leads|modules)(?:[-/.]|$)/, "Chat 1/2 · Internal product"],
    [/^lib\/(?:billing|legal)(?:\/|[-.]|$)/, "Chat 3 · Legal / Billing"],
    [/^app\/api\/(?:billing|stripe|fiscal)(?:\/|$)/, "Chat 3 · Legal / Billing"],
    [/^supabase(?:\/|$)/, "Chat 1/2/3 · Backend-owned schema"],
  ],
};

const violations = [];
for (const file of changedFiles) {
  for (const [pattern, domain] of protectedByOwner[owner] ?? []) {
    if (pattern.test(file)) {
      violations.push({ file, domain });
      break;
    }
  }
}

if (violations.length === 0) {
  console.log(`ORBYVEN Architecture Guard: ${owner} stayed inside its ownership boundaries.`);
  process.exit(0);
}

console.log("ORBYVEN Architecture Guard detected cross-domain changes:");
for (const violation of violations) {
  console.log(`- ${violation.file} → owned by ${violation.domain}`);
}

if (override) {
  console.log("Cross-domain changes explicitly approved with architecture-cross-domain-approved; guard will not block this PR.");
  process.exit(0);
}

console.error("Add architecture-cross-domain-approved only after documenting why the cross-domain change is necessary in the PR.");
process.exit(1);
