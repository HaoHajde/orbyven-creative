import assert from "node:assert/strict";
import test from "node:test";

import { inferWebDesignRequestMode } from "../lib/ai/web-design-intent.ts";
import {
  buildWebDesignProjectPrompt,
  detectWebDesignProjectMode,
  isInvitationProjectMode,
} from "../lib/ai/web-design-project-mode.ts";

test("Web Design project mode keeps normal website briefs unchanged", () => {
  const source = "Creează un site premium pentru o florărie din Bragadiru";
  const result = buildWebDesignProjectPrompt(source);

  assert.equal(result.mode, "website");
  assert.equal(result.prompt, source);
  assert.equal(isInvitationProjectMode(result.mode), false);
});

test("Web Design project mode detects wedding and baptism invitations", () => {
  assert.equal(
    detectWebDesignProjectMode("Vreau o invitație online de nuntă elegantă"),
    "wedding_invitation"
  );
  assert.equal(
    detectWebDesignProjectMode("Fă-mi o invitație de botez pentru telefon"),
    "baptism_invitation"
  );
});

test("Web Design project mode detects general event invitations", () => {
  assert.equal(
    detectWebDesignProjectMode("Creează o invitație pentru majorat, stil dark"),
    "event_invitation"
  );
  assert.equal(
    detectWebDesignProjectMode("Online invitation for a launch event"),
    "event_invitation"
  );
});

test("Invitation prompt maps the bounded website schema to event semantics", () => {
  const result = buildWebDesignProjectPrompt(
    "Vreau o invitație online de nuntă minimalistă pentru Ana și Vlad"
  );

  assert.equal(result.mode, "wedding_invitation");
  assert.equal(isInvitationProjectMode(result.mode), true);
  assert.equal(inferWebDesignRequestMode(result.prompt), "compose");
  assert.match(result.prompt, /invitație online premium/i);
  assert.match(result.prompt, /services=detalii eveniment/i);
  assert.match(result.prompt, /contact=RSVP/i);
  assert.match(result.prompt, /include servicii/i);
  assert.match(result.prompt, /include proces/i);
  assert.match(result.prompt, /Nu inventa nume, dată, oră, locație/i);
  assert.match(result.prompt, /Ana și Vlad/);
  assert.ok(result.prompt.length <= 2000);
});
