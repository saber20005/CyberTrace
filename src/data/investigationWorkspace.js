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
