import { ADVANCED_CASES } from "./casesAdvanced.js";
// Pilot investigation workspace: supplemental simulated telemetry for INC-0417.
// This is educational scenario data, not live logs or verified real-world evidence.
export const PILOT_CASE_ID = "INC-0417";
export const WORKSPACE_EVENTS = Object.freeze([
  { id: "evt-01", time: "10:40:08", source: "identity", category: "سياق", title: "مراجعة إعدادات الحساب", detail: "Account jsmith: MFA enabled; last known device marked managed.", raw: "10:40:08  identity      account_policy  user=jsmith mfa=enabled device=managed" },
  { id: "evt-02", time: "10:40:46", source: "vpn", category: "سياق", title: "جلسة VPN مسجلة", detail: "عنوان الشبكة في القاهرة ضمن جلسة عمل؛ موقع IP وحده لا يكفي لإثبات الموقع الفعلي.", raw: "10:40:46  vpn-gateway   session_active user=jsmith ip=41.35.12.4" },
  { id: "evt-03", time: "10:41:02", source: "auth", category: "دخول", title: "دخول ناجح من القاهرة", detail: "تسجيل دخول اعتيادي ظاهريًا؛ قارنه بالحدث التالي وبسجل الجهاز.", raw: "10:41:02  auth-service  login_success user=jsmith ip=41.35.12.4 geo=Cairo,EG" },
  { id: "evt-04", time: "10:41:55", source: "auth", category: "دخول", title: "دخول آخر من أمستردام", detail: "نفس الحساب يظهر من عنوان جديد خلال أقل من دقيقة. هل الشبكة وسيط أم جلسة أخرى؟", raw: "10:41:55  auth-service  login_success user=jsmith ip=185.220.101.7 geo=Amsterdam,NL" },
  { id: "evt-05", time: "10:42:10", source: "mfa", category: "مصادقة", title: "بدء طلب مصادقة متعددة", detail: "وصول MFA من عنوان أمستردام بعد الدخول؛ راجع التسلسل الزمني بدقة.", raw: "10:42:10  auth-service  mfa_prompt_sent user=jsmith ip=185.220.101.7" },
  { id: "evt-06", time: "10:42:14", source: "mfa", category: "مصادقة", title: "رفض طلب MFA", detail: "رفض المستخدم طلب المصادقة، ولا يثبت الرفض وحده نجاح الهجوم.", raw: "10:42:14  auth-service  mfa_denied user=jsmith ip=185.220.101.7" },
  { id: "evt-07", time: "10:42:19", source: "mfa", category: "مصادقة", title: "رفض MFA ثانٍ", detail: "تكرار الطلبات قد يشير إلى ضغط الموافقة، لكن توجد تفسيرات أخرى ينبغي اختبارها.", raw: "10:42:19  auth-service  mfa_denied user=jsmith ip=185.220.101.7" },
  { id: "evt-08", time: "10:42:27", source: "endpoint", category: "سياق", title: "تحقق الجهاز غير مكتمل", detail: "لا توجد بصمة جهاز مؤكدة للعنوان الثاني في البيانات المتاحة؛ هذه فجوة دليل وليست برهانًا.", raw: "10:42:27  device-audit  device_posture user=jsmith ip=185.220.101.7 status=unknown" },
  { id: "evt-09", time: "10:42:33", source: "mfa", category: "مصادقة", title: "نجاح MFA بعد الرفض", detail: "النجاح المتأخر بعد رفضين يحتاج ربطه بمصدر الجلسة والنشاط اللاحق.", raw: "10:42:33  auth-service  mfa_success user=jsmith ip=185.220.101.7" },
  { id: "evt-10", time: "10:42:49", source: "file", category: "ملفات", title: "فتح مسار الملفات المالية", detail: "نشاط الوصول إلى الملفات بعد المصادقة يستحق التحقق من دوره الوظيفي.", raw: "10:42:49  file-service  browse user=jsmith folder=finance/payroll" },
  { id: "evt-11", time: "10:43:02", source: "file", category: "ملفات", title: "تنزيل ملف رواتب", detail: "حجم التنزيل 14MB؛ الحجم وحده لا يحسم التفسير، اربطه بالهوية والتوقيت.", raw: "10:43:02  file-service  download user=jsmith file=payroll_2026.xlsx size=14MB" },
  { id: "evt-12", time: "10:43:18", source: "soc", category: "سياق", title: "فتح تنبيه للارتباط الزمني", detail: "تنبيه ناتج من جمع الأحداث السابقة، وليس دليلًا مستقلًا على هوية المنفّذ.", raw: "10:43:18  soc-engine    alert_raised user=jsmith rule=travel+mfa+download" },
]);
export const WORKSPACE_FILTERS = Object.freeze(["الكل", "دخول", "مصادقة", "ملفات", "سياق"]);
export const WORKSPACE_HYPOTHESES = Object.freeze(["لم أحدد بعد", "اشتباه اختراق الحساب", "قد يكون نشاطًا مشروعًا", "المعطيات غير كافية"]);
export function filterWorkspaceEvents(events, category, query = "") {
  const normalized = String(query).trim().toLocaleLowerCase("ar");
  return events.filter(event => (category === "الكل" || event.category === category) &&
    (!normalized || [event.title, event.detail, event.raw, event.time, event.source].some(field => field.toLocaleLowerCase("ar").includes(normalized))));
}

// New advanced workspaces reuse the canonical training logs from the existing cases.
// No alternative answer key, XP score, or completion record is introduced here.
const ADVANCED_WORKSPACES = Object.freeze({
  "INC-1207": {
    summary: "اربط تغيير إعداد الثقة بطلب الهوية والجلسة الإدارية، ثم افصل صلاحية التوقيع عن موافقة المؤسسة.",
    caution: "صحة التوقيع تعني مطابقته للمفتاح المكوّن، لا أن إضافة موفّر الثقة كانت معتمدة.",
    hypotheses: ["لم أحدد بعد", "الثقة الجديدة سمحت بوصول غير معتمد", "التغيير قد يكون معتمدًا", "المعطيات غير كافية"],
    annotations: [
      ["سياسة", "سياسة الثقة قبل التغيير", "المراجعة 81 تسمح بالموفّر المعتمد فقط، والصلاحية الافتراضية Analyst."],
      ["تغيير", "إضافة موفّر بصلاحية إدارية", "المراجعة 82 أضافت موفّر هوية جديدًا مع دور TenantAdmin؛ احفظ رقم المراجعة والجهة المنفذة."],
      ["تدقيق", "لا توجد موافقة مسجلة", "نتيجة نظام إدارة التغيير لا تحتوي اعتمادًا لإضافة الموفّر أو الشريك."],
      ["هوية", "قبول تأكيد هوية من الموفّر الجديد", "التوقيع صالح للمفتاح المضبوط في المراجعة 82، لكنه لا يثبت موافقة المؤسسة على هذا الموفّر."],
      ["هوية", "إنشاء جلسة بصلاحية TenantAdmin", "اربط طلب SSO رقم sso-708 بجلسة portal-909، واحذر الاستنتاج من عنوان IP وحده."],
      ["وصول", "قراءة سياسة الإدارة بنجاح", "رمز الجلسة portal-909 استُخدم للوصول إلى admin-api بنتيجة 200؛ هذه نتيجة وصول فعلية."],
      ["تدقيق", "المصدر غير معتمد في الجرد", "مراجعة الجرد تسجل approved_issuer=false؛ قارنها بما أضيف في المراجعة 82."],
    ],
  },
  "INC-1208": {
    summary: "قارن رسالة المورد مع سجل المستفيد ومكالمة التحقق المستقلة وحالة تنفيذ الدفعة.",
    caution: "نجاح SPF/DKIM/DMARC لا يعني أن طلب تغيير المستفيد معتمد، كما أن الدفعة لم تُنفذ في هذه المحاكاة.",
    hypotheses: ["لم أحدد بعد", "طلب دفع احتيالي غير معتمد", "التغيير المالي قد يكون مشروعًا", "المعطيات غير كافية"],
    annotations: [
      ["بريد", "وصول الرسالة في سلسلة المورد", "وجود الرسالة في سلسلة قديمة يثبت موضعها في البريد، ولا يثبت موافقة الجهة على تغيير السداد."],
      ["مصادقة", "اجتياز فحوص النطاق", "نجاح SPF وDKIM وDMARC يدل على محاذاة المصادقة التقنية؛ لا يمنح تفويضًا ماليًا."],
      ["مدفوعات", "طلب تغيير المستفيد", "الرسالة تطلب استبدال المستفيد المسجل بمرجع TRAIN-BEN-NEW."],
      ["مدفوعات", "اختلاف سجل المورد", "السجل المعتمد يحتوي TRAIN-BEN-OLD، ولا يوجد طلب تغيير مسجل للدفعة."],
      ["تحقق", "نفي التغيير عبر جهة معروفة", "مكالمة صادرة إلى جهة اتصال محفوظة سابقًا تنفي تغيير المستفيد."],
      ["مدفوعات", "التحويل لم يُنفذ بعد", "حالة الدفع pending وtransfer_executed=false؛ لا تنسب خسارة مالية لم تحدث."],
      ["تحقق", "تأكيد حادثة في صندوق المورد", "أبلغ المورد عبر قناة موثقة عن حادثة صندوق البريد المرتبط بالرسالة."],
    ],
  },
});

function fromCanonicalCase(caseId, definition) {
  const sourceCase = ADVANCED_CASES.find(row => row.id === caseId);
  if (!sourceCase || sourceCase.logLines.length !== definition.annotations.length) {
    throw new Error("Advanced workspace must match the canonical case logs: " + caseId);
  }
  const events = sourceCase.logLines.map((raw, index) => {
    const [category, title, detail] = definition.annotations[index];
    const time = raw.slice(0, 8);
    if (!/^\d{2}:\d{2}:\d{2}$/.test(time)) throw new Error("Invalid canonical case event time: " + caseId);
    return Object.freeze({ id: "evt-" + String(index + 1).padStart(2, "0"), time, source: raw.trim().split(/\s+/)[1] || "audit", category, title, detail, raw });
  });
  return Object.freeze({
    caseId,
    summary: definition.summary,
    caution: definition.caution,
    hypotheses: Object.freeze([...definition.hypotheses]),
    filters: Object.freeze(["الكل", ...new Set(events.map(row => row.category))]),
    events: Object.freeze(events),
  });
}

const WORKSPACES = Object.freeze({
  [PILOT_CASE_ID]: Object.freeze({
    caseId: PILOT_CASE_ID,
    summary: "حلّل تسلسل الأحداث، قارن المؤشرات المتعارضة، وثبّت الأدلة المهمة قبل اختيار إجابتك.",
    caution: "الارتباط الزمني مؤشر يستدعي الفحص؛ لا تعدّ جغرافيا IP أو التنبيه الآلي وحدهما إثباتًا قاطعًا للاختراق.",
    events: WORKSPACE_EVENTS,
    filters: WORKSPACE_FILTERS,
    hypotheses: WORKSPACE_HYPOTHESES,
  }),
  ...Object.fromEntries(Object.entries(ADVANCED_WORKSPACES).map(([id, item]) => [id, fromCanonicalCase(id, item)])),
});
export const WORKSPACE_CASE_IDS = Object.freeze(Object.keys(WORKSPACES));
export function getWorkspaceCase(caseId) { return WORKSPACES[caseId] ?? null; }
const toSeconds = time => time.split(":").reduce((seconds, part) => seconds * 60 + Number(part), 0);
export function correlateWorkspaceEvents(caseId, firstId, secondId) {
  if (!firstId || !secondId || firstId === secondId) return null;
  const events = getWorkspaceCase(caseId)?.events || [];
  const a = events.find(row => row.id === firstId), b = events.find(row => row.id === secondId);
  if (!a || !b) return null;
  const delta = toSeconds(a.time) - toSeconds(b.time);
  return {
    first: delta <= 0 ? a : b,
    second: delta <= 0 ? b : a,
    secondsApart: Math.abs(delta),
  };
}
