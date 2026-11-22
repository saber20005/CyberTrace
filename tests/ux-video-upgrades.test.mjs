import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { paginateItems, LIBRARY_PAGE_SIZE } from "../src/utils/pagination.js";
const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("pagination respects boundaries, retains list order and never mutates results", () => {
  const cases = Array.from({ length: 28 }, (_, i) => 'INC-' + (1000 + i));
  const original = [...cases];
  const first = paginateItems(cases, 1);
  const fourth = paginateItems(cases, 4);
  assert.equal(LIBRARY_PAGE_SIZE, 9);
  assert.deepEqual(first.items, cases.slice(0, 9));
  assert.deepEqual(fourth.items, cases.slice(27));
  assert.equal(first.pageCount, 4);
  assert.equal(fourth.page, 4);
  assert.equal(paginateItems(cases, 999).page, 4);
  assert.equal(paginateItems(cases, -3).page, 1);
  assert.equal(paginateItems([], 5).page, 1);
  assert.equal(paginateItems("invalid", 5).total, 0);
  assert.deepEqual(cases, original);
});

test("filtered results are paginated, not just masked with CSS", () => {
  const cases = Array.from({ length: 28 }, (_, i) => ({ id: i, level: i % 2 ? "advanced" : "beginner" }));
  const advanced = cases.filter(item => item.level === "advanced");
  const one = paginateItems(advanced, 1);
  const two = paginateItems(advanced, 2);
  assert.equal(one.total, 14);
  assert.equal(one.pageCount, 2);
  assert.deepEqual([...one.items, ...two.items], advanced);
  const library = read("../src/pages/InvestigationLibrary.jsx");
  assert.match(library, /paged\.items\.map/);
  assert.match(library, /setPage\(1\)/);
  assert.match(library, /aria-label="صفحات مكتبة التحقيقات"/);
});

test("auth split design keeps real sign in, Google, signup and reset logic", () => {
  const auth = read("../src/pages/Auth.jsx");
  assert.match(auth, /className="auth-showcase"/);
  assert.match(auth, /data-mode=\{mode\}/);
  for (const flow of ["signInWithEmailAndPassword", "createUserWithEmailAndPassword",
     "sendPasswordResetEmail", "signInToCyberTraceWithGoogle", "BlackBoxAccountButton"]) {
    assert(auth.includes(flow), flow);
  }
  const css = read("../src/pages/Auth.css");
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /max-width:720px/);
});

test("quick dock only navigates and never signs users out or edits progress", () => {
  const dock = read("../src/components/QuickDock.jsx");
  assert.match(dock, /<details/);
  assert.match(dock, /<summary/);
  assert.match(dock, /aria-label="اختصارات CyberTrace"/);
  assert.doesNotMatch(dock, /firestore|localStorage|signOut|setDoc|runTransaction/);
});
