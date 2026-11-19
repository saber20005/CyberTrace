import test from "node:test";
import assert from "node:assert/strict";
import { CASES } from "../src/data/cases.js";
import { WORKSPACE_CASE_IDS, WORKSPACE_EVENTS, getWorkspaceCase, correlateWorkspaceEvents, filterWorkspaceEvents } from "../src/data/investigationWorkspace.js";
import { setProgressOwner, progressKey } from "../src/utils/progressScope.js";
import { notebookKey, loadWorkspaceNotebook, saveWorkspaceNotebook, createWorkspaceNotesReport, toggleWorkspacePin, normalizeWorkspaceNotebook } from "../src/utils/workspaceNotes.js";

function storage() {
  const data = new Map();
  return { data, getItem: key => data.get(key) ?? null, setItem: (key,value) => data.set(key,value) };
}

test("three supported workspaces reuse existing cases and canonical logs exactly", () => {
  assert.deepEqual(WORKSPACE_CASE_IDS, ["INC-0417", "INC-1207", "INC-1208"]);
  assert.equal(getWorkspaceCase("INC-0417").events, WORKSPACE_EVENTS);
  for (const id of ["INC-1207", "INC-1208"]) {
    const w = getWorkspaceCase(id);
    const original = CASES.find(row => row.id === id);
    assert(original, id);
    assert.equal(w.events.length, original.logLines.length);
    assert.deepEqual(w.events.map(row => row.raw), original.logLines);
    assert.deepEqual(w.events.map(row => row.time), [...w.events].map(row => row.time).sort());
    assert.equal(new Set(w.events.map(row => row.id)).size, w.events.length);
    assert(w.hypotheses.length >= 3);
    assert(w.filters.includes("الكل"));
    for (const event of w.events) {
      assert(w.filters.includes(event.category));
      assert(event.title.length > 5);
      assert(event.detail.length > 20);
      assert.equal(event.time, event.raw.slice(0, 8));
      assert(event.source.length > 0);
    }
    assert.equal(filterWorkspaceEvents(w.events, "الكل").length, w.events.length);
  }
  assert.equal(getWorkspaceCase("INC-9999"), null);
});
test("federation and supplier payment scenarios preserve evidence nuance", () => {
  const federation = getWorkspaceCase("INC-1207");
  assert.equal(filterWorkspaceEvents(federation.events, "تدقيق").length, 2);
  assert(filterWorkspaceEvents(federation.events, "الكل", "revision=82").length >= 3);
  assert(federation.events.some(e => e.raw.includes("signature=valid_for_configured_key")));
  assert(federation.events.some(e => e.raw.includes("approved_issuer=false")));
  const supplier = getWorkspaceCase("INC-1208");
  assert.equal(filterWorkspaceEvents(supplier.events, "مدفوعات").length, 3);
  assert(supplier.events.some(e => e.raw.includes("dmarc=pass")));
  assert(supplier.events.some(e => e.raw.includes("transfer_executed=false")));
  assert(supplier.events.some(e => e.raw.includes("supplier_denies_beneficiary_change=true")));
});
test("correlation compares distinct pinned events chronologically without computing a score", () => {
  const federation = correlateWorkspaceEvents("INC-1207", "evt-05", "evt-02");
  assert.equal(federation.first.id, "evt-02");
  assert.equal(federation.second.id, "evt-05");
  assert.equal(federation.secondsApart, 99);
  const supplier = correlateWorkspaceEvents("INC-1208", "evt-03", "evt-05");
  assert.equal(supplier.secondsApart, 208);
  assert.equal("score" in supplier, false);
  assert.equal(correlateWorkspaceEvents("INC-1208", "evt-01", "evt-01"), null);
  assert.equal(correlateWorkspaceEvents("INC-1208", "evt-01", "invalid"), null);
  assert.equal(correlateWorkspaceEvents("INC-9999", "evt-01", "evt-02"), null);
});
test("notes stay owner- and case-scoped and retain legacy pilot notebook unchanged", () => {
  const local = storage();
  setProgressOwner("owner-a");
  const oldPilotKey = progressKey("cybertrace_analyst_workspace:INC-0417");
  local.setItem(oldPilotKey, JSON.stringify({hypothesis:"اشتباه اختراق الحساب",notes:"ملاحظات قديمة",pinned:["evt-04","evt-09"]}));
  const pilot = loadWorkspaceNotebook("INC-0417",local);
  assert.equal(pilot.notes,"ملاحظات قديمة");
  assert.deepEqual(pilot.pinned,["evt-04","evt-09"]);
  const notes = {hypothesis:"الثقة الجديدة سمحت بوصول غير معتمد",notes:"راجع سبب إدخال revision=82",pinned:["evt-02","evt-05","evt-06"]};
  saveWorkspaceNotebook("INC-1207",notes,local);
  assert.equal(loadWorkspaceNotebook("INC-1207",local).hypothesis,notes.hypothesis);
  assert.equal(loadWorkspaceNotebook("INC-1208",local).notes,"");
  setProgressOwner("owner-b");
  assert.equal(loadWorkspaceNotebook("INC-1207",local).notes,"");
  assert.equal(loadWorkspaceNotebook("INC-0417",local).notes,"");
  setProgressOwner("owner-a");
  assert.equal(loadWorkspaceNotebook("INC-1207",local).notes,notes.notes);
  assert.equal(local.data.has(progressKey("cybertrace_xp")),false);
  assert.equal(local.data.has(progressKey("cybertrace_case_results")),false);
  assert.notEqual(notebookKey("INC-0417"),notebookKey("INC-1207"));
});
test("per-case pins and hypothesis allowlist and export never affect BlackBox receipts", () => {
  const row={hypothesis:"طلب دفع احتيالي غير معتمد",notes:"اختبر بيانات المستفيد",pinned:["evt-03","evt-05","evt-05","unknown"]};
  const data=normalizeWorkspaceNotebook(row,"INC-1208");
  assert.deepEqual(data.pinned,["evt-03","evt-05"]);
  assert.equal(data.hypothesis,row.hypothesis);
  assert.equal(normalizeWorkspaceNotebook({hypothesis:row.hypothesis},"INC-1207").hypothesis,"لم أحدد بعد");
  assert.equal(toggleWorkspacePin(data,"evt-05","INC-1208").pinned.length,1);
  const text=createWorkspaceNotesReport("INC-1208",data);
  assert(text.includes("INC-1208") && text.includes("TRAIN-BEN-NEW") && text.includes("208 ثانية"));
  assert(text.includes("محاكاة تعليمية") && text.includes("لا يثبت السببية"));
  assert(!text.includes("70 XP") && !text.includes("blackboxUsers"));
  assert.equal(createWorkspaceNotesReport("INC-9999",row),null);
  assert.throws(()=>notebookKey("INC-9999"));
});
