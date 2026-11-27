import { progressKey, progressReady } from "./progressScope.js";
import { getCaseResults } from "./caseProgress.js";
import { shuffleArray } from "./shuffle.js";

const VERSION = 1;
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const memory = new Map();
const pendingWrites = new Set();
const own = (object, key) => Object.hasOwn(object, key);
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
function signature(data) {
  const text = JSON.stringify([data.id, data.logLines, data.evidenceQuestion,
    data.evidenceOptions.map(option => [option.id, option.label, option.correct]),
    data.decisions.map(option => [option.id, option.label, option.points])]);
  // This is a compatibility marker, not a security proof. Hashing keeps public
  // answer labels and complete log lines out of the saved pending payload.
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16);
}

export function pendingAttemptKey(caseId) {
  if (!/^INC-\d{4}$/.test(caseId)) throw new Error("Unknown investigation identifier");
  return progressKey("cybertrace_pending_attempt:" + caseId);
}

export function createPendingAttempt(caseData) {
  return {
    step: 0,
    selectedEvidenceId: null,
    evidenceChecked: false,
    selectedDecisionId: null,
    wrongEvidenceIds: [],
    evidenceOrder: shuffleArray(caseData.evidenceOptions).map(option => option.id),
    decisionOrder: shuffleArray(caseData.decisions).map(option => option.id),
  };
}

// Only canonical option IDs and pending stages are persisted. No answer labels,
// scores, notebook contents, account profile, or completed result are hydrated.
export function validatePendingAttempt(value, caseData) {
  if (!object(value) || ![0, 1, 2].includes(value.step) || typeof value.evidenceChecked !== "boolean") return null;
  const evidence = new Map(caseData.evidenceOptions.map(option => [option.id, option]));
  const decisions = new Set(caseData.decisions.map(option => option.id));
  const exactOrder = (input, ids) => Array.isArray(input) && input.length === ids.size &&
    new Set(input).size === ids.size && input.every(id => ids.has(id));
  if (!exactOrder(value.evidenceOrder, evidence) || !exactOrder(value.decisionOrder, decisions)) return null;
  if (value.selectedEvidenceId !== null && !evidence.has(value.selectedEvidenceId)) return null;
  if (value.selectedDecisionId !== null && !decisions.has(value.selectedDecisionId)) return null;
  if (value.evidenceChecked && value.selectedEvidenceId === null) return null;
  if (!Array.isArray(value.wrongEvidenceIds) || value.wrongEvidenceIds.length > evidence.size ||
    new Set(value.wrongEvidenceIds).size !== value.wrongEvidenceIds.length ||
    value.wrongEvidenceIds.some(id => !evidence.has(id) || evidence.get(id).correct)) return null;
  if (value.step === 0 && (value.selectedEvidenceId !== null || value.evidenceChecked || value.wrongEvidenceIds.length)) return null;
  if (value.step < 2 && value.selectedDecisionId !== null) return null;
  if (value.step === 2 && (!value.evidenceChecked || !evidence.get(value.selectedEvidenceId)?.correct)) return null;
  return {
    step: value.step,
    selectedEvidenceId: value.selectedEvidenceId,
    evidenceChecked: value.evidenceChecked,
    selectedDecisionId: value.selectedDecisionId,
    wrongEvidenceIds: [...value.wrongEvidenceIds],
    evidenceOrder: [...value.evidenceOrder],
    decisionOrder: [...value.decisionOrder],
  };
}

function browserStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function createPendingAttemptStore(caseData, options = {}) {
  const key = pendingAttemptKey(caseData.id);
  const storage = own(options, "storage") ? options.storage : browserStorage();
  const now = options.now ?? Date.now;
  const completionStamp = options.completionStamp ?? (() => {
    const result = getCaseResults()[caseData.id];
    return result ? result.attempts + ":" + result.lastCompletedAt : null;
  });
  let baselineStamp = progressReady() ? completionStamp() : null;
  const isCurrent = () => progressReady() && pendingAttemptKey(caseData.id) === key;
  const write = raw => {
    memory.set(key, raw);
    try {
      if (!storage) throw new Error("Storage unavailable");
      if (raw === null) storage.removeItem(key); else storage.setItem(key, raw);
      pendingWrites.delete(key);
      return true;
    } catch {
      // A tombstone also prevents failed deletion from reviving an old attempt
      // within this app session. The completion stamp protects a later reload.
      pendingWrites.add(key);
      return false;
    }
  };
  const clear = () => {
    if (!isCurrent()) return false;
    baselineStamp = completionStamp();
    return write(null);
  };
  return {
    key,
    isCurrent,
    clear,
    load() {
      if (!isCurrent()) return null;
      let raw;
      if (pendingWrites.has(key)) raw = memory.get(key);
      else {
        try { raw = storage?.getItem(key) ?? null; }
        catch { raw = memory.get(key) ?? null; }
      }
      if (!raw) return null;
      try {
        const saved = JSON.parse(raw);
        if (!object(saved) || saved.schemaVersion !== VERSION || saved.caseId !== caseData.id ||
          saved.signature !== signature(caseData) || saved.completionStamp !== baselineStamp ||
          !Number.isSafeInteger(saved.updatedAt) || now() - saved.updatedAt > MAX_AGE ||
          saved.updatedAt > now() + 5 * 60 * 1000) throw new Error("Stale attempt");
        const value = validatePendingAttempt(saved.attempt, caseData);
        if (!value) throw new Error("Invalid attempt");
        return value;
      } catch {
        clear();
        return null;
      }
    },
    save(value) {
      if (!isCurrent() || completionStamp() !== baselineStamp) return false;
      const attempt = validatePendingAttempt(value, caseData);
      if (!attempt) return false;
      return write(JSON.stringify({ schemaVersion: VERSION, caseId: caseData.id,
        signature: signature(caseData), completionStamp: baselineStamp, updatedAt: now(), attempt }));
    },
  };
}
