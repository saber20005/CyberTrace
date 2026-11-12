import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlackBoxBridge } from '../src/blackbox/controller.js';

const now = '2026-11-11T12:00:00.000Z';
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const receipt = (caseId, bestScore) => ({ schemaVersion: 1, source: 'cybertrace', caseId, bestScore, firstSyncedAt: now, updatedAt: now });
function storage() {
  const data = new Map();
  return { data, get length() { return data.size; }, key: index => [...data.keys()][index], getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}
function service(initialUid = null) {
  const documents = new Map(), subscriptions = [], writes = [];
  let listener, uid = initialUid;
  const result = {
    documents, subscriptions, writes,
    onUserChanged(callback) { listener = callback; callback(uid ? { uid, email: `${uid}@example.test` } : null); return () => { listener = null; }; },
    setUser(next) { uid = next; listener?.(next ? { uid: next, email: `${next}@example.test` } : null); },
    signInEmail: async () => { result.setUser('A'); },
    signInGoogle: async () => { result.setUser('A'); },
    signOut: async () => { result.setUser(null); },
    watchReceipts(owner, next, error) {
      const subscription = { owner, next, error, stopped: false };
      subscriptions.push(subscription);
      next({ receipts: Object.fromEntries(documents.get(owner) ?? []), fromCache: false });
      return () => { subscription.stopped = true; };
    },
    async writeReceipt(owner, caseId, score) {
      writes.push({ owner, caseId, score });
      if (result.beforeWrite) await result.beforeWrite(owner, caseId, score);
      const rows = documents.get(owner) ?? new Map();
      const bestScore = Math.max(rows.get(caseId)?.bestScore ?? 0, score);
      rows.set(caseId, receipt(caseId, bestScore)); documents.set(owner, rows);
      for (const subscription of subscriptions) if (!subscription.stopped && subscription.owner === owner) subscription.next({ receipts: Object.fromEntries(rows), fromCache: false });
      return { caseId, bestScore };
    },
  };
  return result;
}
async function setup(t, options = {}) {
  const backend = options.backend ?? service();
  const store = options.store ?? storage(), statuses = [];
  const bridge = createBlackBoxBridge({ config: { enabled: true }, storage: store, backendFactory: async () => backend, onStatus: status => statuses.push(status) });
  t.after(() => bridge.dispose());
  await bridge.start(); await tick();
  return { bridge, backend, store, statuses };
}

test('disabled and guest bridges never invent an account or enqueue guest results', async t => {
  let initialized = false;
  const disabled = createBlackBoxBridge({ config: { enabled: false }, backendFactory: () => { initialized = true; } });
  t.after(() => disabled.dispose());
  await disabled.start();
  assert.equal(await disabled.recordCompletion('INC-0417', 70), false);
  assert.equal(initialized, false);
  const { bridge, backend, store } = await setup(t);
  assert.equal(await bridge.recordCompletion('INC-0417', 70), false);
  backend.setUser('A'); await tick();
  assert.equal(store.length, 0); assert.equal(backend.writes.length, 0);
});

test('completions contribute one best score and historical import is explicit and scored only', async t => {
  const { bridge, backend } = await setup(t);
  backend.setUser('A');
  assert.equal(await bridge.recordCompletion('INC-0417', 30), true);
  assert.equal(await bridge.recordCompletion('INC-0417', 70), true);
  assert.equal(await bridge.recordCompletion('INC-0417', 30), true);
  assert.equal(await bridge.recordCompletion('INC-0417', 70), true);
  assert.equal(backend.writes.length, 2);
  const imported = await bridge.importHistory({
    'INC-0512': { attempts: 1, lastScore: 50, bestScore: 50, lastCompletedAt: now },
    'INC-0633': { completed: true },
    unknown: { attempts: 1, lastScore: 70, bestScore: 70, lastCompletedAt: now },
  });
  assert.deepEqual(imported, { imported: 1, skipped: 2, pending: 0 });
  assert.equal(backend.documents.get('A').get('INC-0512').bestScore, 50);
  await assert.rejects(bridge.recordCompletion('unknown', 70));
  await assert.rejects(bridge.recordCompletion('INC-0417', 71));
});

test('offline queued results survive a new controller and clear only after confirmed upload', async t => {
  const store = storage(), backend = service('A');
  backend.beforeWrite = async () => { throw Object.assign(new Error('Offline'), { code: 'unavailable' }); };
  const first = await setup(t, { store, backend });
  assert.equal(await first.bridge.recordCompletion('INC-0417', 60), false);
  assert.equal(first.bridge.getStatus().pending, 1);
  assert.equal(first.bridge.getStatus().memoryOnly, false);
  first.bridge.dispose();
  const secondBackend = service('A');
  const second = await setup(t, { store, backend: secondBackend });
  await second.bridge.retryPending();
  assert.equal(secondBackend.documents.get('A').get('INC-0417').bestScore, 60);
  assert.equal(second.bridge.getStatus().pending, 0); assert.equal(store.length, 0);
});

test('a newer higher pending score survives completion of an older in-flight write', async t => {
  const { bridge, backend } = await setup(t);
  backend.setUser('A'); await tick();
  const gate = deferred(); let first = true;
  backend.beforeWrite = async () => { if (first) { first = false; await gate.promise; } };
  const oldWrite = bridge.recordCompletion('INC-0417', 30); await tick();
  const newWrite = bridge.recordCompletion('INC-0417', 70); await tick();
  gate.resolve(); await Promise.all([oldWrite, newWrite]);
  assert.deepEqual(backend.writes.map(write => write.score), [30, 70]);
  assert.equal(backend.documents.get('A').get('INC-0417').bestScore, 70);
  assert.equal(bridge.getStatus().pending, 0);
});

test('another tab cannot replace a higher immutable offline queue entry', async t => {
  const store = storage(), backend = service('A');
  backend.beforeWrite = async () => { throw new Error('Offline'); };
  const first = await setup(t, { store, backend });
  await first.bridge.recordCompletion('INC-0417', 70);
  const secondBackend = service('A'); secondBackend.beforeWrite = backend.beforeWrite;
  const second = await setup(t, { store, backend: secondBackend });
  await second.bridge.recordCompletion('INC-0417', 30);
  assert.equal(store.length, 2);
  backend.beforeWrite = undefined;
  await first.bridge.retryPending();
  assert.equal(backend.documents.get('A').get('INC-0417').bestScore, 70);
  assert.equal(store.length, 0);
});

test('stale reads and writes cannot expose or credit the next linked account', async t => {
  const { bridge, backend } = await setup(t);
  backend.setUser('A'); await tick();
  const oldSubscription = backend.subscriptions.at(-1), gate = deferred();
  backend.beforeWrite = () => gate.promise;
  const pending = bridge.recordCompletion('INC-0417', 70); await tick();
  backend.setUser('B');
  assert.deepEqual(bridge.getStatus().receipts, {});
  oldSubscription.next({ receipts: { 'INC-0417': receipt('INC-0417', 70) }, fromCache: false });
  assert.deepEqual(bridge.getStatus().receipts, {});
  gate.resolve(); assert.equal(await pending, false);
  assert.equal(backend.documents.has('B'), false);
  assert(backend.writes.every(write => write.owner === 'A'));
  assert.equal(bridge.getStatus().pending, 0);
});

test('disconnect invalidates a delayed sign-in before its auth callback can relink the old identity', async t => {
  const { bridge, backend } = await setup(t);
  const gate = deferred();
  backend.signInEmail = async () => { await gate.promise; backend.setUser('A'); };
  const attempt = bridge.signInEmail('A@example.test', 'password');
  const rejection = assert.rejects(attempt, { code: 'bridge/session-changed' });
  await tick(); await bridge.disconnect(); gate.resolve(); await rejection;
  await tick(); assert.equal(bridge.getStatus().user, null);
  assert.equal(await bridge.recordCompletion('INC-0417', 70), false);
  assert.equal(backend.writes.length, 0);
});

test('quota failures are reported as memory-only for new results and explicit history import', async t => {
  const store = storage(); store.setItem = () => { throw new Error('Quota'); };
  const { bridge, backend } = await setup(t, { store }); backend.setUser('A');
  backend.beforeWrite = async () => { throw new Error('Offline'); };
  assert.equal(await bridge.recordCompletion('INC-0417', 30), false);
  assert.equal(bridge.getStatus().memoryOnly, true);
  assert.match(bridge.getStatus().message, /ذاكرة التبويب/);
  await bridge.importHistory({ 'INC-0512': { attempts: 1, bestScore: 70, lastScore: 70, lastCompletedAt: now } });
  assert.equal(bridge.getStatus().pending, 2); assert.equal(store.length, 0);
  backend.beforeWrite = undefined; await bridge.retryPending();
  assert.equal(bridge.getStatus().memoryOnly, false); assert.equal(bridge.getStatus().pending, 0);
});

test('a failed optional unsubscribe cannot block clearing the old account', async t => {
  const backend = service();
  backend.watchReceipts = () => () => { throw new Error('Broken cleanup'); };
  const { bridge } = await setup(t, { backend });
  backend.setUser('A'); await bridge.disconnect();
  assert.equal(bridge.getStatus().user, null);
});

test('manual retry replaces a failed receipt subscription without writing or changing accounts', async t => {
  const { bridge, backend } = await setup(t);
  backend.setUser('A'); await tick(); const first = backend.subscriptions.at(-1);
  first.error({ code: 'permission-denied' });
  assert.equal(bridge.getStatus().error, 'permission-denied');
  assert.equal(await bridge.retryPending(), true);
  assert.equal(first.stopped, true);
  assert.equal(backend.subscriptions.at(-1).owner, 'A');
  assert.equal(bridge.getStatus().error, null);
  assert.equal(bridge.getStatus().user.uid, 'A');
  assert.equal(backend.writes.length, 0);
});

test('late callbacks from a replaced subscription cannot regress the same linked account', async t => {
  const { bridge, backend } = await setup(t);
  backend.setUser('A'); await tick(); const old = backend.subscriptions.at(-1);
  old.error({ code: 'unavailable' }); await bridge.retryPending();
  backend.subscriptions.at(-1).next({ receipts: { 'INC-0417': receipt('INC-0417', 70) }, fromCache: false });
  old.next({ receipts: { 'INC-0417': receipt('INC-0417', 30) }, fromCache: false });
  old.error({ code: 'permission-denied' });
  assert.equal(bridge.getStatus().receipts['INC-0417'].bestScore, 70);
  assert.equal(bridge.getStatus().error, null);
});
