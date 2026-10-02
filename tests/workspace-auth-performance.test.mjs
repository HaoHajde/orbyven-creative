import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("login and recovery fail closed but always restore an interactive form on network failures", () => {
  const login = read("app/workspace/login/page.tsx");
  const forgot = read("app/workspace/forgot-password/page.tsx");
  assert.match(login, /if \(loading\) return/);
  assert.match(login, /catch \(error\) \{\s*console\.error\("Workspace sign-in request failed"/);
  assert.match(login, /setLoading\(false\)/);
  assert.match(login, /getWorkspaceEntryPath\(\)/);
  const signup = read("app/workspace/register/page.tsx");
  for (const entry of [login, signup]) {
    assert.match(entry, /const \{ data \} = await orbyvenSupabase\.auth\.getSession\(\)/);
    assert.match(entry, /if \(cancelled \|\| !data\.session\) return/);
    assert.match(entry, /const destination = await getWorkspaceEntryPath\(\)/);
  }
  assert.match(forgot, /try \{[\s\S]*?resetPasswordForEmail/);
  assert.match(forgot, /catch \(error\) \{/);
  assert.match(forgot, /finally \{\s*setLoading\(false\)/);
  assert.match(forgot, /Dacă există un cont pentru această adresă/);
});

test("auth shell allows compact mobile viewports to scroll when the keyboard opens", () => {
  const shell = read("components/WorkspaceAuthShell.tsx");
  assert.match(shell, /min-h-\[100svh\] overflow-x-hidden/);
  assert.doesNotMatch(shell, /min-h-\[100svh\] overflow-hidden/);
});

test("access state screen never reveals organization data when identity check fails", () => {
  const page = read("app/workspace/access/page.tsx");
  assert.match(page, /try \{\s*const nextState = await getWorkspaceAccessState\(\)/);
  assert.match(page, /setState\(null\);\s*setLoadError\(true\)/);
  assert.match(page, /Reîncearcă verificarea/);
  assert.match(page, /Datele companiei rămân izolate/);
});

test("normal authenticated workspace load does not verify the same session twice", () => {
  const page = read("components/WorkspaceShell.tsx");
  const firstLookup = page.indexOf("const nextWorkspace = await getCurrentWorkspace()");
  const recheck = page.indexOf("await orbyvenSupabase.auth.getUser()");
  assert.ok(firstLookup > 0 && recheck > firstLookup, "getUser must only disambiguate a missing workspace");
  assert.match(page, /if \(!nextWorkspace\) \{[\s\S]*?auth\.getUser\(\)/);
  assert.match(page, /if \(!authData\.user\) \{\s*await onUnauthenticated\(\)/);
});

test("performance audits include login, signup, recovery and both admin entry pages", () => {
  const workflow = read(".github/workflows/performance-audit.yml");
  for (const slug of ["workspace-login", "workspace-register", "workspace-forgot", "workspace-reset", "admin-login", "control-center-login"]) {
    assert.ok(workflow.includes(slug), `${slug} absent from Lighthouse matrix`);
  }
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\s+push:/);
});

test("real-auth QA requires dedicated secrets and never uploads private screenshots or traces", () => {
  const workflow = read(".github/workflows/authenticated-workspace-qa.yml");
  const script = read("scripts/audit-authenticated-workspace.mjs");
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request:|\s+push:/);
  assert.match(workflow, /secrets\.ORBYVEN_QA_EMAIL/);
  assert.match(workflow, /secrets\.ORBYVEN_QA_PASSWORD/);
  assert.match(script, /https:\/\/orbyven\.ro\/workspace\/login/);
  assert.match(script, /loginToWorkspaceMs/);
  assert.match(script, /390, height: 844/);
  assert.match(script, /1366, height: 900/);
  assert.doesNotMatch(script, /screenshot\(|tracing\.|storageState\(|console\.log\(email|console\.log\(password/);
});


test("dedicated web checkout preserves the selected plan through auth and onboarding", () => {
  const home = read("components/HomePageClient.tsx");
  const contact = read("app/contact/page.tsx");
  const webStart = read("app/porneste/web-design/page.tsx");
  const register = read("app/workspace/register/page.tsx");
  const login = read("app/workspace/login/page.tsx");
  const callback = read("app/workspace/auth/callback/page.tsx");
  const onboarding = read("app/workspace/onboarding/page.tsx");

  assert.match(home, /href=\{\`\/porneste\/web-design\?mode=ecosystem&plan=\$\{plan\.id\}&source=homepage\`\}/);
  assert.match(contact, /href="\/porneste\/web-design\?mode=web"/);
  assert.match(contact, /href="\/porneste\/web-design\?mode=ecosystem"/);
  assert.match(webStart, /\/api\/billing\/checkout/);
  assert.match(webStart, /Apple Pay/);
  assert.match(webStart, /Google Pay/);
  assert.match(webStart, /LEGAL_DOCUMENT_VERSION/);
  assert.match(webStart, /Creează cont și continuă/);
  assert.match(webStart, /isBillingPlanId\(requestedPlan\)/);
  assert.match(webStart, /product=web-design-dashboard&mode=\$\{mode\}/);

  for (const source of [register, login, callback, onboarding]) {
    assert.match(source, /checkoutQuery/);
    assert.match(source, /checkoutProduct/);
    assert.match(source, /\/porneste\/web-design\$\{checkoutQuery\}/);
  }
  assert.match(onboarding, /BILLING_PLANS\[checkoutPlan\]\.entitlements/);
  assert.match(onboarding, /Plan selectat/);
});
