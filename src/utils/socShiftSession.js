import { SOC_SHIFT_ID } from "../data/socShift.js";
import { getSocShift, SOC_PRIORITIES, socShiftMaxScore } from "../data/socShiftCatalog.js";
import { progressKey } from "./progressScope.js";

const MAX_NOTE_LENGTH = 350;
const FALLBACK = () => ({ version: 1, responses: {}, correlationId: null });
const priorityIds = new Set(SOC_PRIORITIES.map(item => item.id));

export function normalizeSocSession(raw, shiftId = SOC_SHIFT_ID) {
  const shift = getSocShift(shiftId);
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || raw.version !== 1) return FALLBACK();
  const responses = {};
  for (const alert of shift.alerts) {
    const choice = raw.responses && typeof raw.responses === "object" ? raw.responses[alert.id] : null;
    if (!choice || !priorityIds.has(choice.priorityId) ||
        !alert.actions.some(action => action.id === choice.actionId)) continue;
    responses[alert.id] = {
      priorityId: choice.priorityId,
      actionId: choice.actionId,
      note: typeof choice.note === "string" ? choice.note.slice(0, MAX_NOTE_LENGTH) : "",
    };
  }
  const complete = shift.alerts.every(alert => Object.hasOwn(responses, alert.id));
  return {
    version: 1,
    responses,
    correlationId: complete && shift.links.some(row => row.id === raw.correlationId) ? raw.correlationId : null,
  };
}

export function commitSocAlert(current, alertId, priorityId, actionId, note = "", shiftId = SOC_SHIFT_ID) {
  const shift = getSocShift(shiftId);
  const currentState = normalizeSocSession(current, shift.id);
  const alert = shift.alerts.find(row => row.id === alertId);
  if (!alert || !priorityIds.has(priorityId) ||
      !alert.actions.some(action => action.id === actionId) ||
      Object.hasOwn(currentState.responses, alertId) || currentState.correlationId) return null;
  return normalizeSocSession({
    version: 1,
    responses: { ...currentState.responses, [alertId]: { priorityId, actionId, note } },
    correlationId: null,
  }, shift.id);
}

export function finalizeSocShift(current, correlationId, shiftId = SOC_SHIFT_ID) {
  const shift = getSocShift(shiftId);
  const state = normalizeSocSession(current, shift.id);
  if (!shift.alerts.every(row => Object.hasOwn(state.responses, row.id)) ||
      state.correlationId || !shift.links.some(choice => choice.id === correlationId)) return null;
  return normalizeSocSession({ ...state, correlationId }, shift.id);
}

export function gradeSocSession(input, shiftId = SOC_SHIFT_ID) {
  const shift = getSocShift(shiftId);
  const state = normalizeSocSession(input, shift.id);
  const assessments = shift.alerts.map(alert => {
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
  const correlation = shift.links.find(row => row.id === state.correlationId);
  const complete = assessments.every(row => row.complete) && Boolean(correlation);
  const score = complete ? assessments.reduce((sum, row) => sum + row.total, 0) + correlation.points : null;
  const missedPriority = complete ? assessments.filter(row => row.priorityPoints === 0).length : 0;
  const weakResponse = complete ? assessments.filter(row => row.actionPoints < 12).length : 0;
  return {
    shiftId: shift.id, complete, score, maxScore: socShiftMaxScore(shift),
    handled: assessments.filter(item => item.complete).length,
    totalAlerts: shift.alerts.length, assessments,
    priorityScore: assessments.reduce((sum, row) => sum + row.priorityPoints, 0),
    responseScore: assessments.reduce((sum, row) => sum + row.actionPoints, 0),
    priorityMax: shift.alerts.length * 8,
    responseMax: shift.alerts.length * 12,
    correlationPoints: correlation?.points ?? 0,
    correlationFeedback: correlation?.feedback ?? "",
    coaching: !complete ? null : {
      missedPriority,
      weakResponse,
      correlationNeedsWork: correlation.points !== 20,
    },
    level: !complete ? null : score >= 85 ? "ممتاز" : score >= 65 ? "جيد" : "يحتاج مراجعة",
  };
}

// INC-01 keeps its exact preexisting storage key; each new level gets its own key.
export function socSessionKey(shiftId = SOC_SHIFT_ID) {
  const shift = getSocShift(shiftId);
  return progressKey("cybertrace_soc_shift:" + shift.id);
}

export function loadSocSession(storage = globalThis.localStorage, shiftId = SOC_SHIFT_ID) {
  try {
    const raw = storage.getItem(socSessionKey(shiftId));
    return raw ? normalizeSocSession(JSON.parse(raw), shiftId) : FALLBACK();
  } catch {
    return FALLBACK();
  }
}

export function saveSocSession(session, storage = globalThis.localStorage, shiftId = SOC_SHIFT_ID) {
  const cleaned = normalizeSocSession(session, shiftId);
  storage.setItem(socSessionKey(shiftId), JSON.stringify(cleaned));
  return cleaned;
}

export function makeSocShiftReport(input, shiftId = SOC_SHIFT_ID) {
  const shift = getSocShift(shiftId);
  const state = normalizeSocSession(input, shift.id);
  const grade = gradeSocSession(state, shift.id);
  if (!grade.complete) return null;
  const lines = [
    "# تقرير مناوبة SOC التدريبية — " + shift.id,
    "",
    "> محاكاة تعليمية. هذا التقرير ناتج محلي غير موثوق من خادم، وليس شهادة مهنية أو نتيجة رسمية أو تحقيقًا حقيقيًا.",
    "",
    "## المناوبة",
    shift.title + " — " + shift.level,
    "",
    "## النتيجة", grade.score + " / " + grade.maxScore + " — " + grade.level,
    "الأولويات: " + grade.priorityScore + " / " + grade.priorityMax,
    "الاستجابة: " + grade.responseScore + " / " + grade.responseMax,
    "الارتباط: " + grade.correlationPoints + " / 20",
    "",
    "## تصنيف التنبيهات والإجراءات",
  ];
  for (const assessment of grade.assessments) {
    const alert = shift.alerts.find(row => row.id === assessment.id);
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
  const link = shift.links.find(row => row.id === state.correlationId);
  lines.push("", "## ربط التنبيهات", link.label, link.feedback,
    "درجة الربط: " + link.points + " / 20",
    "", "## خطة المراجعة الشخصية",
    (grade.coaching.missedPriority
      ? "راجع " + grade.coaching.missedPriority + " أخطاء في ترتيب الأولوية وفق خطر النشاط الفعلي."
      : "ترتيب الأولويات في هذه المناوبة متسق مع السيناريو."),
    (grade.coaching.weakResponse
      ? "راجع " + grade.coaching.weakResponse + " إجراءات لم تحصل على الدرجة الكاملة، وافصل الاحتواء عن جمع الأدلة."
      : "كل إجراءات الاستجابة حققت الدرجة الكاملة."),
    (grade.coaching.correlationNeedsWork
      ? "راجع العلاقة المحتملة بين الأحداث دون تحويلها إلى يقين غير مدعوم."
      : "تمييز جيد بين الترابط والسببية."),
    "", "## متابعة تدريبية",
    "لا تُمنح XP أو إيصالات BLACKBOX من هذه المحاكاة. سجل كل مناوبة محلي ومنفصل عن بيانات التحقيقات السابقة.");
  return lines.join("\n");
}
