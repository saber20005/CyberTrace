import test from 'node:test';
import assert from 'node:assert/strict';
import { setProgressOwner, progressKey } from '../src/utils/progressScope.js';
import { CASES } from '../src/data/cases.js';

test('commercial rollout retains scoped progress keys for guest and signed-in users', () => {
  setProgressOwner(null);
  assert.equal(progressKey('cybertrace_xp'), 'cybertrace_xp:v2:guest');
  setProgressOwner('student-1');
  assert.equal(progressKey('cybertrace_xp'), 'cybertrace_xp:v2:student-1');
  setProgressOwner(null);
});

test('commercial rollout does not rewrite existing case identifiers or action scores', () => {
  assert.ok(CASES.length > 0);
  assert.equal(new Set(CASES.map(item => item.id)).size, CASES.length);
  for (const item of CASES) {
    assert.ok(item.decisions.length > 0, item.id);
    for (const decision of item.decisions) {
      assert.ok(Number.isInteger(decision.points), item.id);
      assert.ok(decision.points >= 0 && decision.points <= 40, item.id);
    }
  }
});
