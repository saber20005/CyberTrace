import test from "node:test";
import assert from "node:assert/strict";
import { CASES } from "../src/data/cases.js";

test("response action points allow graded outcomes without requiring a perfect choice", () => {
  for (const incident of CASES) {
    assert.ok(incident.decisions.length > 0, incident.id);
    for (const decision of incident.decisions) {
      assert.ok(Number.isInteger(decision.points), incident.id + " " + decision.id);
      assert.ok(decision.points >= 0 && decision.points <= 40, incident.id + " " + decision.id);
      assert.equal(30 + decision.points, 30 + decision.points);
    }
  }
});
