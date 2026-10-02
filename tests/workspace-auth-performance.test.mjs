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


test("public offer cards preserve the selected product through confirmation and checkout", () => {
  const contact = read("app/contact/page.tsx");
  const confirmation = read("app/porneste/oferta/page.tsx");
  const payment = read("app/porneste/plata/page.tsx");
  const offers = read("lib/commerce/public-offers.ts");

  assert.match(contact, /href="\/porneste\/oferta\?offer=invitation"/);
  assert.match(contact, /href="\/porneste\/oferta\?offer=web"/);
  assert.match(contact, /href="\/porneste\/oferta\?offer=advanced"/);
  assert.match(contact, /PUBLIC_OFFERS\.invitation\.priceLei/);
  assert.match(contact, /PUBLIC_OFFERS\.web\.priceLei/);
  assert.match(contact, /PUBLIC_OFFERS\.advanced\.priceLei/);

  assert.match(confirmation, /isPublicOfferId\(rawOffer\)/);
  assert.match(confirmation, /PUBLIC_OFFERS\[offerId\]/);
  assert.match(confirmation, /\/porneste\/plata\?offer=\$\{offerId\}/);
  assert.match(confirmation, /Confirm selecția/);

  assert.match(payment, /isPublicOfferId\(rawOffer\)/);
  assert.match(payment, /fetch\("\/api\/public-checkout"/);
  assert.match(payment, /JSON\.stringify\(\{ offer: offerId \}\)/);
  assert.match(payment, /SANDBOX_PAYMENT_LINKS/);
  assert.match(payment, /payload\.code === "SANDBOX_FALLBACK"/);
  assert.match(offers, /invitation:/);
  assert.match(offers, /web:/);
  assert.match(offers, /advanced:/);
});
