import assert from "node:assert/strict";
import test from "node:test";

import {
  ORBYVEN_PASSWORD_MIN_LENGTH,
  validateOrbyvenPassword,
} from "../lib/auth/password-policy.ts";

test("ORBYVEN password policy matches Supabase Auth settings", () => {
  assert.equal(ORBYVEN_PASSWORD_MIN_LENGTH, 12);
  assert.equal(validateOrbyvenPassword("Short1!").valid, false);
  assert.equal(validateOrbyvenPassword("alllowercase1!").valid, false);
  assert.equal(validateOrbyvenPassword("ALLUPPERCASE1!").valid, false);
  assert.equal(validateOrbyvenPassword("NoDigitsHere!").valid, false);
  assert.equal(validateOrbyvenPassword("NoSymbols123A").valid, false);
  assert.equal(validateOrbyvenPassword("OrbyvenSecure1!").valid, true);
});
