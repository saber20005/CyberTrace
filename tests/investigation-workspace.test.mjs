import test from "node:test";
import assert from "node:assert/strict";
import { CASES } from "../src/data/cases.js";
import { PILOT_CASE_ID, WORKSPACE_EVENTS, WORKSPACE_FILTERS, filterWorkspaceEvents } from "../src/data/investigationWorkspace.js";
import { setProgressOwner, progressKey } from "../src/utils/progressScope.js";
import { createWorkspaceNotesReport, loadWorkspaceNotebook, saveWorkspaceNotebook, normalizeWorkspaceNotebook, toggleWorkspacePin, notebookKey } from "../src/utils/workspaceNotes.js";

function storage() {
  const data = new Map();
  return {
    data,
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
  };
}
test("workspace is attached only to a known case with a coherent 12-event chronology", () => {
  assert(CASES.some(entry => entry.id === PILOT_CASE_ID));
  assert.equal(WORKSPACE_EVENTS.length, 12);
  assert.equal(new Set(WORKSPACE_EVENTS.map(event => event.id)).size, WORKSPACE_EVENTS.length);
  assert.deepEqual([...WORKSPACE_EVENTS].map(row => row.time), [...WORKSPACE_EVENTS].map(row => row.time).sort());
  assert(WORKSPACE_EVENTS.some(row => row.raw.includes("mfa_denied")));
  assert(WORKSPACE_EVENTS.some(row => row.raw.includes("mfa_success")));
  assert(WORKSPACE_EVENTS.some(row => row.raw.includes("download")));
  assert(WORKSPACE_EVENTS.some(row => row.detail.includes("فجوة دليل")));
  for (const row of WORKSPACE_EVENTS) {
    assert.equal(typeof row.title, "string");
    assert.ok(row.raw.length > 20);
    assert.ok(WORKSPACE_FILTERS.includes(row.category));
  }
  assert.equal(filterWorkspaceEvents(WORKSPACE_EVENTS, "دخول").length, 2);
  assert.equal(filterWorkspaceEvents(WORKSPACE_EVENTS, "الكل", "185.220.101.7").length >= 4, true);
  assert.equal(filterWorkspaceEvents(WORKSPACE_EVENTS, "ملفات", "payroll").length, 2);
  assert.deepEqual(filterWorkspaceEvents(WORKSPACE_EVENTS, "الكل", "not-a-log-entry"), []);
});
test("notebook is account scoped, persists locally, and cannot contaminate other owners or guest", () => {
  const db = storage();
  setProgressOwner("user-A");
  const keyA = notebookKey(PILOT_CASE_ID);
  saveWorkspaceNotebook(PILOT_CASE_ID, { hypothesis: "اشتباه اختراق الحساب", notes: "راجع MFA والجلسة", pinned: ["evt-04","evt-09"] }, db);
  assert.equal(loadWorkspaceNotebook(PILOT_CASE_ID, db).pinned.length, 2);
  assert.equal(db.data.has(keyA), true);
  setProgressOwner("user-B");
  assert.notEqual(notebookKey(PILOT_CASE_ID), keyA);
  assert.equal(loadWorkspaceNotebook(PILOT_CASE_ID, db).notes, "");
  saveWorkspaceNotebook(PILOT_CASE_ID, { hypothesis: "المعطيات غير كافية", notes: "حساب آخر", pinned: [] }, db);
  setProgressOwner(null);
  assert.equal(loadWorkspaceNotebook(PILOT_CASE_ID, db).notes, "");
  setProgressOwner("user-A");
  assert.equal(loadWorkspaceNotebook(PILOT_CASE_ID, db).notes, "راجع MFA والجلسة");
  assert.equal(db.data.has(progressKey("cybertrace_case_results")), false);
  assert.equal(db.data.has(progressKey("cybertrace_xp")), false);
});
test("normalize limits note length and pins, drops unknown ids and hypotheses", () => {
  const input = { notes: "س".repeat(5000), hypothesis: "<script>", pinned: ["evt-01", "evt-01", "evt-02", "evt-03", "evt-04", "evt-05", "evt-06", "evt-07", "evil"] };
  const data = normalizeWorkspaceNotebook(input);
  assert.equal(data.notes.length, 1200);
  assert.equal(data.hypothesis, "لم أحدد بعد");
  assert.deepEqual(data.pinned, ["evt-01", "evt-02", "evt-03", "evt-04", "evt-05", "evt-06"]);
  const removed = toggleWorkspacePin(data, "evt-01");
  assert.equal(removed.pinned.includes("evt-01"), false);
  const added = toggleWorkspacePin(removed, "evt-07");
  assert.equal(added.pinned.includes("evt-07"), true);
  assert.equal(toggleWorkspacePin(added, "malicious").pinned.length, added.pinned.length);
});
test("export includes selected simulated evidence, not invented XP or BlackBox receipts", () => {
  const data = { hypothesis: "المعطيات غير كافية", notes: "افحص الجهاز أولًا", pinned: ["evt-04", "evt-09"] };
  const report = createWorkspaceNotesReport(PILOT_CASE_ID, data);
  assert(report.includes("INC-0417"));
  assert(report.includes("10:41:55"));
  assert(report.includes("mfa_success"));
  assert(report.includes("افحص الجهاز أولًا"));
  assert(report.includes("محاكاة تعليمية"));
  assert(!report.includes("70 XP"));
  assert.equal(createWorkspaceNotesReport("INC-0512", data), null);
  assert.throws(() => notebookKey("INC-0512"));
});
test("corrupted or unavailable local storage never blocks reading the case", () => {
  setProgressOwner("broken");
  const broken = { getItem: () => "{invalid", setItem: () => { throw new Error("quota"); } };
  assert.deepEqual(loadWorkspaceNotebook(PILOT_CASE_ID, broken), { hypothesis: "لم أحدد بعد", notes: "", pinned: [] });
  assert.throws(() => saveWorkspaceNotebook(PILOT_CASE_ID, { notes: "safe" }, broken), /quota/);
});
