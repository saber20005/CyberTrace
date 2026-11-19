import { PILOT_CASE_ID, WORKSPACE_EVENTS, WORKSPACE_HYPOTHESES } from "../data/investigationWorkspace.js";
import { progressKey } from "./progressScope.js";

const MAX_NOTE_LENGTH = 1200;
const MAX_PINS = 6;
const validIds = new Set(WORKSPACE_EVENTS.map(event => event.id));
const fallback = () => ({ hypothesis: "لم أحدد بعد", notes: "", pinned: [] });

export function normalizeWorkspaceNotebook(input) {
  const data = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  return {
    hypothesis: WORKSPACE_HYPOTHESES.includes(data.hypothesis) ? data.hypothesis : "لم أحدد بعد",
    notes: typeof data.notes === "string" ? data.notes.slice(0, MAX_NOTE_LENGTH) : "",
    pinned: Array.isArray(data.pinned)
      ? [...new Set(data.pinned.filter(id => typeof id === "string" && validIds.has(id)))].slice(0, MAX_PINS)
      : [],
  };
}

export function notebookKey(caseId) {
  if (caseId !== PILOT_CASE_ID) throw new Error("مساحة التحقيق غير متاحة لهذه القضية.");
  return progressKey("cybertrace_analyst_workspace:" + caseId);
}

export function loadWorkspaceNotebook(caseId, storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(notebookKey(caseId));
    return raw ? normalizeWorkspaceNotebook(JSON.parse(raw)) : fallback();
  } catch {
    return fallback();
  }
}

export function saveWorkspaceNotebook(caseId, notebook, storage = globalThis.localStorage) {
  const cleaned = normalizeWorkspaceNotebook(notebook);
  storage.setItem(notebookKey(caseId), JSON.stringify(cleaned));
  return cleaned;
}

export function toggleWorkspacePin(notebook, id) {
  const current = normalizeWorkspaceNotebook(notebook);
  if (!validIds.has(id)) return current;
  const pinned = current.pinned.includes(id)
    ? current.pinned.filter(value => value !== id)
    : [...current.pinned, id].slice(-MAX_PINS);
  return { ...current, pinned };
}

export function createWorkspaceNotesReport(caseId, notebook) {
  if (caseId !== PILOT_CASE_ID) return null;
  const data = normalizeWorkspaceNotebook(notebook);
  const lines = [
    "# سجل فرضيات المحلل — " + caseId,
    "",
    "> بيانات محاكاة تعليمية. هذه الملاحظات شخصية وغير متحقّق منها، وليست تقرير إغلاق رسميًا.",
    "",
    "## الفرضية",
    data.hypothesis,
    "",
    "## الأدلة المحفوظة",
    ...data.pinned.map(id => {
      const event = WORKSPACE_EVENTS.find(item => item.id === id);
      return "- [" + event.time + "] " + event.title + " — " + event.raw;
    }),
    ...(data.pinned.length ? [] : ["لا توجد أدلة مثبتة."]),
    "",
    "## ملاحظات المحلل",
    data.notes || "لم تسجّل ملاحظات.",
    "",
    "## المتابعة",
    "حدّد ما يمكن إثباته من السجلات وما يحتاج إلى تحقق إضافي قبل اتخاذ قرار الاستجابة.",
  ];
  return lines.join("\n");
}
