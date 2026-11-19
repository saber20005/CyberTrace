import { PILOT_CASE_ID, getWorkspaceCase, correlateWorkspaceEvents } from "../data/investigationWorkspace.js";
import { progressKey } from "./progressScope.js";

const MAX_NOTE_LENGTH = 1200;
const MAX_PINS = 6;
const fallback = () => ({ hypothesis: "لم أحدد بعد", notes: "", pinned: [] });

export function normalizeWorkspaceNotebook(input, caseId = PILOT_CASE_ID) {
  const data = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const workspace = getWorkspaceCase(caseId);
  const validIds = new Set(workspace?.events.map(event => event.id) || []);
  return {
    hypothesis: workspace?.hypotheses.includes(data.hypothesis) ? data.hypothesis : "لم أحدد بعد",
    notes: typeof data.notes === "string" ? data.notes.slice(0, MAX_NOTE_LENGTH) : "",
    pinned: Array.isArray(data.pinned)
      ? [...new Set(data.pinned.filter(id => typeof id === "string" && validIds.has(id)))].slice(0, MAX_PINS)
      : [],
  };
}

export function notebookKey(caseId) {
  if (!getWorkspaceCase(caseId)) throw new Error("مساحة التحقيق غير متاحة لهذه القضية.");
  // Existing pilot keys are retained verbatim; saved evidence and notes need no migration.
  return progressKey("cybertrace_analyst_workspace:" + caseId);
}

export function loadWorkspaceNotebook(caseId, storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(notebookKey(caseId));
    return raw ? normalizeWorkspaceNotebook(JSON.parse(raw), caseId) : fallback();
  } catch { return fallback(); }
}

export function saveWorkspaceNotebook(caseId, notebook, storage = globalThis.localStorage) {
  const cleaned = normalizeWorkspaceNotebook(notebook, caseId);
  storage.setItem(notebookKey(caseId), JSON.stringify(cleaned));
  return cleaned;
}

export function toggleWorkspacePin(notebook, id, caseId = PILOT_CASE_ID) {
  const current = normalizeWorkspaceNotebook(notebook, caseId);
  if (!getWorkspaceCase(caseId)?.events.some(event => event.id === id)) return current;
  const pinned = current.pinned.includes(id)
    ? current.pinned.filter(value => value !== id)
    : [...current.pinned, id].slice(-MAX_PINS);
  return { ...current, pinned };
}

export function createWorkspaceNotesReport(caseId, notebook) {
  const workspace = getWorkspaceCase(caseId);
  if (!workspace) return null;
  const data = normalizeWorkspaceNotebook(notebook, caseId);
  const pinnedEvents = data.pinned.map(id => workspace.events.find(item => item.id === id)).filter(Boolean);
  const comparison = correlateWorkspaceEvents(caseId, pinnedEvents[0]?.id, pinnedEvents[1]?.id);
  const lines = [
    "# سجل فرضيات المحلل — " + caseId,
    "",
    "> بيانات محاكاة تعليمية. هذه الملاحظات شخصية وغير متحقّق منها، وليست تقرير إغلاق رسميًا.",
    "",
    "## الفرضية", data.hypothesis,
    "",
    "## الأدلة المحفوظة",
    ...pinnedEvents.map(event => "- [" + event.time + "] " + event.title + " — " + event.raw),
    ...(pinnedEvents.length ? [] : ["لا توجد أدلة مثبتة."]),
    "",
    "## الارتباط الزمني",
    comparison ? "الفاصل بين " + comparison.first.id + " و" + comparison.second.id + ": " + comparison.secondsApart + " ثانية." : "ثبّت حدثين على الأقل لإظهار المقارنة الزمنية.",
    "هذا التقارب الزمني لا يثبت السببية أو هوية المنفّذ.",
    "",
    "## ملاحظات المحلل",
    data.notes || "لم تسجّل ملاحظات.",
    "",
    "## المتابعة",
    "حدّد ما يمكن إثباته من السجلات وما يحتاج إلى تحقق إضافي قبل اتخاذ قرار الاستجابة.",
  ];
  return lines.join("\n");
}
