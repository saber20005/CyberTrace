import { SOC_SHIFT_ID, SOC_ALERTS, SOC_PRIORITIES, SOC_LINK_CHOICES, SOC_SHIFT_MAX_SCORE } from "../data/socShift.js";
import { progressKey } from "./progressScope.js";

const MAX_NOTE_LENGTH = 350;
const FALLBACK = () => ({ version: 1, responses: {}, correlationId: null });
const alertIds = new Set(SOC_ALERTS.map(item => item.id));
const priorityIds = new Set(SOC_PRIORITIES.map(item => item.id));

export function normalizeSocSession(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || raw.version !== 1) return FALLBACK();
  const responses = {};
  for (const alert of SOC_ALERTS) {
    const choice = raw.responses && typeof raw.responses === "object" ? raw.responses[alert.id] : null;
    if (!choice || !priorityIds.has(choice.priorityId) ||
        !alert.actions.some(action => action.id === choice.actionId)) continue;
    responses[alert.id] = {
      priorityId: choice.priorityId,
      actionId: choice.actionId,
      note: typeof choice.note === "string" ? choice.note.slice(0, MAX_NOTE_LENGTH) : "",
    };
  }
  const complete = SOC_ALERTS.every(alert => Object.hasOwn(responses, alert.id));
  return {
    version: 1,
    responses,
    correlationId: complete && SOC_LINK_CHOICES.some(row => row.id === raw.correlationId) ? raw.correlationId : null,
  };
}

export function commitSocAlert(current, alertId, priorityId, actionId, note = "") {
  const currentState = normalizeSocSession(current);
  const alert = SOC_ALERTS.find(row => row.id === alertId);
  if (!alert || !alertIds.has(alertId) || !priorityIds.has(priorityId) ||
      !alert.actions.some(action => action.id === actionId) ||
      Object.hasOwn(currentState.responses, alertId) || currentState.correlationId) return null;
  return normalizeSocSession({
    version: 1,
    responses: { ...currentState.responses, [alertId]: { priorityId, actionId, note } },
    correlationId: null,
  });
}

export function finalizeSocShift(current, correlationId) {
  const state = normalizeSocSession(current);
  if (!SOC_ALERTS.every(row => Object.hasOwn(state.responses, row.id)) ||
      state.correlationId || !SOC_LINK_CHOICES.some(choice => choice.id === correlationId)) return null;
  return normalizeSocSession({ ...state, correlationId });
}

export function gradeSocSession(input) {
  const state = normalizeSocSession(input);
  const assessments = SOC_ALERTS.map(alert => {
    const response = state.responses[alert.id];
    const chosenAction = alert.actions.find(action => action.id === response?.actionId);
    const priorityPoints = response?.priorityId === alert.priority ? 8 : 0;
    return {
      id: alert.id, title: alert.title,
      complete: Boolean(response),
      selectedPriority: response?.priorityId ?? null,
      expectedPriority: alert.priority,
      priorityPoints,
      actionId: response?.actionId ?? null,
      actionPoints: chosenAction?.points ?? 0,
      actionFeedback: chosenAction?.feedback ?? "",
      priorityExplanation: alert.priorityExplanation,
      total: priorityPoints + (chosenAction?.points ?? 0),
    };
  });
  const correlation = SOC_LINK_CHOICES.find(row => row.id === state.correlationId);
  const complete = assessments.every(row => row.complete) && Boolean(correlation);
  const score = complete ? assessments.reduce((sum, row) => sum + row.total, 0) + correlation.points : null;
  return {
    shiftId: SOC_SHIFT_ID,
    complete, score, maxScore: SOC_SHIFT_MAX_SCORE,
    handled: assessments.filter(item => item.complete).length,
    totalAlerts: SOC_ALERTS.length,
    assessments,
    correlationPoints: correlation?.points ?? 0,
    correlationFeedback: correlation?.feedback ?? "",
    level: !complete ? null : score >= 85 ? "ممتاز" : score >= 65 ? "جيد" : "يحتاج مراجعة",
  };
}

export function socSessionKey() {
  return progressKey("cybertrace_soc_shift:" + SOC_SHIFT_ID);
}

export function loadSocSession(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(socSessionKey());
    return raw ? normalizeSocSession(JSON.parse(raw)) : FALLBACK();
  } catch {
    return FALLBACK();
  }
}

export function saveSocSession(session, storage = globalThis.localStorage) {
  const cleaned = normalizeSocSession(session);
  storage.setItem(socSessionKey(), JSON.stringify(cleaned));
  return cleaned;
}

export function makeSocShiftReport(input) {
  const state = normalizeSocSession(input);
  const grade = gradeSocSession(state);
  if (!grade.complete) return null;
  const lines = [
    "# تقرير مناوبة SOC التدريبية — " + SOC_SHIFT_ID,
    "",
    "> محاكاة تعليمية. هذا التقرير ناتج محلي غير موثوق من خادم، وليس شهادة مهنية أو نتيجة رسمية أو تحقيقًا حقيقيًا.",
    "",
    "## النتيجة",
    grade.score + " / " + grade.maxScore + " — " + grade.level,
    "",
    "## تصنيف التنبيهات والإجراءات",
  ];
  for (const assessment of grade.assessments) {
    const alert = SOC_ALERTS.find(row => row.id === assessment.id);
    const response = state.responses[alert.id];
    const action = alert.actions.find(row => row.id === response.actionId);
    lines.push(
      "",
      "### " + alert.id + " — " + alert.title,
      "الأولوية المختارة: " + response.priorityId + " | المستحقة بحسب المحاكاة: " + alert.priority,
      "الإجراء: " + action.label,
      "الدرجة: " + assessment.total + " / 20",
      "التوضيح: " + assessment.priorityExplanation + " " + action.feedback,
      "ملاحظة المحلل: " + (response.note || "لم تُسجّل ملاحظة."),
    );
  }
  const link = SOC_LINK_CHOICES.find(row => row.id === state.correlationId);
  lines.push("", "## ربط التنبيهات", link.label, link.feedback,
    "درجة الربط: " + link.points + " / 20",
    "", "## متابعة تدريبية",
    "أعد المناوبة عند الحاجة لتجربة ترتيب أولويات مختلف. لا تُمنح XP أو إيصالات BLACKBOX من هذه المحاكاة.");
  return lines.join("\n");
}
