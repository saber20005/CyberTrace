import { SOC_SHIFT_ID, SOC_ALERTS, SOC_LINK_CHOICES, SOC_PRIORITIES } from "./socShift.js";

// All activity is fictional. The legacy pilot is reused without altering its answer keys.
const legacyShift = Object.freeze({
  id: SOC_SHIFT_ID, level: "مبتدئ", rank: 1, estimatedMinutes: 12,
  title: "فرز تنبيهات المناوبة الأولى",
  description: "تحقق من الهوية والتصيد والإنذارات الكاذبة وتجنب الاستجابة المبالغ فيها.",
  focus: "ترتيب الأولويات والتمييز بين السببية والارتباط",
  alerts: SOC_ALERTS, links: SOC_LINK_CHOICES,
});

const intermediate = Object.freeze({
  id: "SOC-SHIFT-02", level: "متوسط", rank: 2, estimatedMinutes: 18,
  title: "جلسات OAuth وتغيير الثقة",
  description: "تغيّرات في موفّر الهوية وتطبيق OAuth، مع إنذار تحديث شرعي ومؤشر وصول حساس.",
  focus: "صلاحيات السحابة وسجلات التدقيق والتحقق من التغيير",
  alerts: Object.freeze([
    {
      id: "SOC-E21", title: "إضافة موفّر SSO بدور إداري", category: "الهوية",
      received: "09:28", asset: "tenant: corp-lab", source: "IAM configuration",
      description: "أُضيف موفّر هوية جديد وأسند دورًا إداريًا، بينما لا يوجد طلب تغيير معتمد.",
      priority: "p1", priorityExplanation: "تغيير ثقة غير معتمد أعقبه وصول إداري فعلي؛ ينبغي تعليق مصدر الثقة الجديد والتحقق من الجلسات.",
      evidence: [
        "09:20:02 iam change revision=82 actor=svc-automation provider=external-idp",
        "09:21:17 change ticket=IAM-741 approval=not_found",
        "09:22:06 auth token_accepted provider=external-idp role=TenantAdmin",
        "09:23:55 admin-api read policy=secrets-list status=200",
        "09:25:14 iam inventory provider=external-idp approved=false",
      ],
      actions: [
        { id: "only-alert", label: "إرسال تذكير لفريق الهوية ومراقبة التغيير دون احتواء", points: 1, feedback: "القراءة الإدارية حدثت فعلًا؛ التأجيل لا يعالج مصدر الثقة غير المعتمد." },
        { id: "contain-idp", label: "تعليق ثقة الموفّر غير المعتمد وإبطال جلساته وحفظ المراجعات وسجلات الإدارة", points: 12, feedback: "احتواء موجّه لمصدر الثقة مع الحفاظ على أدلة التغيير والوصول." },
        { id: "disable-all", label: "إيقاف خدمة تسجيل الدخول الموحّد لجميع الموظفين بلا خطة استمرارية", points: 3, feedback: "إجراء واسع يسبب انقطاعًا عامًا ويجب حصر الاحتواء في المصدر المشبوه أولًا." },
      ],
    },
    {
      id: "SOC-F10", title: "منح موافقة OAuth لتطبيق غير معروف", category: "التطبيقات",
      received: "09:27", asset: "user: finance-analyst", source: "Consent audit",
      description: "أذن مستخدم لتطبيق خارجي بقراءة البريد والملفات؛ التطبيق غير موجود في قائمة الموافقات.",
      priority: "p2", priorityExplanation: "صلاحيات وصول حساسة واسعة تمت الموافقة عليها بالفعل؛ يلزم تقييد المنحة وفحص استخدام الرموز.",
      evidence: [
        "09:18:09 oauth consent app=invoice-reviewer publisher=unverified",
        "09:18:11 oauth scopes=Mail.Read Files.Read.All offline_access",
        "09:18:11 oauth consent user=finance-analyst admin_approval=false",
        "09:24:38 graph token_activity app=invoice-reviewer operations=Mail.Read",
        "09:25:44 app-inventory approved_app=false risk_level=unknown",
      ],
      actions: [
        { id: "revoke-scope", label: "إلغاء المنحة والرموز المرتبطة، وفحص نشاط التطبيق وإشعار المستخدم", points: 12, feedback: "يعالج استمرار وصول التطبيق ويحدد النطاق قبل إصدار استنتاج عن سرقة بيانات." },
        { id: "ignore-publisher", label: "تجاهل المنحة لأنها أتت عبر شاشة موافقة شرعية", points: 0, feedback: "شاشة موافقة صحيحة لا تعني أن التطبيق موثوق أو أن طلب الصلاحيات مناسب." },
        { id: "password", label: "تغيير كلمة مرور المستخدم دون إلغاء منحة OAuth", points: 4, feedback: "تغيير كلمة المرور وحده قد لا يلغي موافقات التطبيقات أو الرموز القائمة." },
      ],
    },
    {
      id: "SOC-G04", title: "استخدام مفتاح API في خدمة التقارير", category: "السحابة",
      received: "09:17", asset: "service: reporting-api", source: "API gateway",
      description: "زاد عدد طلبات API لكن مصدرها خادم التقرير المصرّح وتطابق نافذة تصدير شهرية.",
      priority: "p3", priorityExplanation: "الزيادة تستحق مراجعة الحصة والنطاق، لكن السجلات المتاحة تشير إلى وظيفة مجدولة مخوّلة.",
      evidence: [
        "09:09:00 scheduler job=monthly-report user=svc-report approved=true",
        "09:11:12 api key_id=report-key source=198.51.100.26",
        "09:11:14 inventory source=198.51.100.26 owner=report-worker",
        "09:15:50 api requests=640 quota_limit=1000 failed_auth=0",
        "09:16:32 export dataset=monthly-summary classification=internal",
      ],
      actions: [
        { id: "rotate-everything", label: "إبطال مفاتيح كل الخدمات فورًا وإيقاف التطبيقات", points: 0, feedback: "تصعيد غير متناسب مع السجلات الحالية. افصل مخاطر الحصة عن سوء استخدام المفتاح." },
        { id: "dismiss", label: "تعطيل مراقبة API لأن كل الطلبات نجحت", points: 3, feedback: "النجاح التقني لا يلغي أهمية متابعة الحجم والنطاق والتغيرات التالية." },
        { id: "validate-job", label: "مطابقة الجدول والمالك والبيانات ومتابعة الحد والتغير دون تعطيل الخدمة", points: 12, feedback: "تقييم متناسب ويحافظ على الخدمة مع رصد أي استخدام خارج العمل المعتمد." },
      ],
    },
    {
      id: "SOC-H02", title: "تحديث وكيل مراقبة موقّع", category: "الأجهزة",
      received: "09:12", asset: "host: soc-sensor-03", source: "Endpoint telemetry",
      description: "عملية جديدة ظهرت أثناء تحديث مخطط له، وتطابق بصمتها مصدر النشر الرسمي.",
      priority: "p4", priorityExplanation: "تطابق التوقيع والجدول والمصدر مع عدم وجود سلوك ضار يقلل أولوية التصعيد مع استمرار التحقق.",
      evidence: [
        "09:05:03 change ticket=OPS-133 window=09:00-09:30 approved=true",
        "09:06:22 update binary=soc-agent-v3 signer=corp-release",
        "09:07:00 hash match release_manifest=true",
        "09:10:11 edr alert new_process=soc-agent-v3 behavior=none",
        "09:11:27 network dst=update-mirror allowlisted=true",
      ],
      actions: [
        { id: "stop-all", label: "عزل كل أجهزة المراقبة وإيقاف التحديثات", points: 0, feedback: "قد يضعف الرصد الأمني ويقطع الخدمة دون دليل كافٍ." },
        { id: "verify-update", label: "مطابقة التوقيع وطلب التغيير والنسخة ثم إغلاق التنبيه عند التوافق", points: 12, feedback: "التحقق مطلوب حتى مع وجود التوقيع والجدول؛ لا تستنتج الاختراق من مجرد عملية جديدة." },
        { id: "trust-only", label: "إغلاق التنبيه دون مراجعة سجل التغيير", points: 5, feedback: "التوقيع مؤشر إيجابي لكنه لا يغني عن مراجعة مصدر التحديث وسياقه." },
      ],
    },
  ]),
  links: Object.freeze([
    { id: "distinct-investigations", label: "أحقق في SSO وOAuth كمسارين محتملين للوصول، لكن لا أدمجهما دون ربط الجلسة أو الفاعل", points: 20, feedback: "جيد: كلاهما يتضمن وصولًا حساسًا، إلا أن وحدة المهاجم أو الجلسة ليست مثبتة." },
    { id: "same-attacker", label: "أُعلن أن الفاعل نفسه نفّذ تغيّر SSO وموافقة OAuth لمجرد تقارب الزمن", points: 3, feedback: "تقارب التوقيت لا يثبت هوية منفّذ واحد، خاصة مع اختلاف الحسابات والأنظمة." },
    { id: "all-compromised", label: "أربط تحديث الوكيل وخدمة التقارير بالاختراق نفسه دون أدلة إضافية", points: 0, feedback: "هناك توثيق مستقل يفسر التحديث والتقرير؛ خلط الإنذارات يصرف التحقيق عن المخاطر الفعلية." },
  ]),
});

const advanced = Object.freeze({
  id: "SOC-SHIFT-03", level: "متقدم", rank: 3, estimatedMinutes: 24,
  title: "تسرب محتمل وسلسلة توريد",
  description: "قرائن متعارضة على وصول إلى بيانات، تحديث مورد برمجي، وتدفقات شبكة تحتاج تحديد نطاق دقيق.",
  focus: "ربط الأصول وتحقيق الفرضيات والتمييز بين النشاط المثبت والمحتمل",
  alerts: Object.freeze([
    {
      id: "SOC-J19", title: "جلسة خدمة تصدّر بيانات مصنّفة", category: "البيانات",
      received: "11:27", asset: "svc: billing-export", source: "DLP + object audit",
      description: "أنشأت جلسة خدمة رمزًا جديدًا ثم قرأت ملفات العملاء الحساسة وصدّرت حزمة إلى وجهة غير مسجلة.",
      priority: "p1", priorityExplanation: "الوصول والتحميل الفعلي إلى وجهة غير معتمدة للبيانات الحساسة يتطلبان احتواءً وتحديد نطاق، لا مجرد متابعة.",
      evidence: [
        "11:17:41 iam token_issued subject=svc-billing-export device=unknown",
        "11:19:02 storage read classification=confidential objects=481",
        "11:22:08 egress destination=203.0.113.92 allowlisted=false",
        "11:22:40 proxy transfer_bytes=94000000 status=complete",
        "11:26:10 change record=missing export_approval=false",
      ],
      actions: [
        { id: "narrow-contain", label: "تجميد الرمز والجلسة وحظر الوجهة المحددة وحفظ آثار الوصول والتصدير وتحديد النطاق", points: 12, feedback: "يركز الاحتواء على القناة المؤثرة ويحافظ على الأدلة وخطوات التبليغ اللازمة." },
        { id: "wait", label: "الانتظار لاكتشاف مزيد من التنزيل قبل اتخاذ قرار", points: 0, feedback: "التصدير الفعلي يرفع خطورة التأخير. احتوِ المصدر وافحص الأثر." },
        { id: "wipe-server", label: "مسح الخادم والملفات فورًا قبل حفظ السجلات", points: 1, feedback: "الاستجابة التدميرية قد تتلف الأدلة ولا تمنع بالضرورة استمرار الرمز المسروق." },
      ],
    },
    {
      id: "SOC-K07", title: "تحديث حزمة مورد يغير أذونات الخدمة", category: "سلسلة التوريد",
      received: "11:24", asset: "service: billing-worker", source: "Deployment + SBOM",
      description: "أُصدرت حزمة جديدة من مورد معروف بصلاحيات إضافية دون اعتماد كامل لمراجعة التغيير.",
      priority: "p2", priorityExplanation: "تغيير صلاحيات مورد ضمن خدمة حساسة يستحق إيقاف النشر وفحص التوقيع والسلسلة، لكن ارتباطه بالتصدير لم يثبت بعد.",
      evidence: [
        "11:09:15 build package=billing-helper-v8 signer=vendor-valid",
        "11:11:22 sbom dependency=analytics-bridge version=8.0.2",
        "11:12:30 deploy service=billing-worker permissions=storage.read+network.egress",
        "11:13:47 change ticket=REL-701 review=partial",
        "11:21:08 runtime process=billing-worker network=203.0.113.92 correlation=unconfirmed",
      ],
      actions: [
        { id: "trust-signer", label: "اعتماد الحزمة لأن التوقيع سليم مع تجاهل الصلاحيات", points: 0, feedback: "صحة التوقيع لا تعني سلامة سلسلة التوريد أو موافقة تغيير الصلاحيات." },
        { id: "destroy-all", label: "حذف المستودعات والنسخ الاحتياطية لجميع الخدمات", points: 0, feedback: "تصرف تدميري واسع لا يعالج السبب ويحطم أدلة قد تلزم للتحقيق." },
        { id: "hold-review", label: "تجميد التحديث غير المعتمد ومراجعة SBOM والصلاحيات والسجلات قبل تقرير علاقته بالتصدير", points: 12, feedback: "يعالج مخاطرة الحزمة ويحتفظ بالتمييز بين دليل تغيير مؤكد وسبب اختراق غير مثبت." },
      ],
    },
    {
      id: "SOC-L05", title: "حركة DNS غير معتادة من محطة تحليل", category: "الشبكة",
      received: "11:19", asset: "host: analyst-qa-01", source: "DNS resolver",
      description: "طلبات DNS طويلة أثناء اختبار مبرمج لبيانات مختبر، لكن الأسماء تشبه أنماط النقل المخفي.",
      priority: "p3", priorityExplanation: "السجلات ترجح مهمة مختبر معتمدة لكن تشابه النمط يستدعي فحص الوجهة وحجم البيانات قبل الإغلاق.",
      evidence: [
        "11:02:00 change ticket=LAB-509 scheduled=true scope=synthetic-dns",
        "11:06:40 dns queries=250 destination=training-zone.example",
        "11:07:01 endpoint process=lab-dns-check signature=approved",
        "11:12:22 inventory host=analyst-qa-01 classification=test-only",
        "11:18:04 dns payload_entropy=high external_bytes=unconfirmed",
      ],
      actions: [
        { id: "ignore-pattern", label: "استثناء كل استعلامات DNS الطويلة من الكشف دائمًا", points: 0, feedback: "قد يخفي قنوات ضارة مستقبلية؛ الاستثناء الشامل غير آمن." },
        { id: "check-scope", label: "مطابقة النشاط بالطلب والوجهة ومصدر البيانات ثم ضبط إنذار مخصص إذا لزم", points: 12, feedback: "استجابة مناسبة لإشارة ملتبسة مع سياق اختبار موثق، دون تعطيل أو تجاهل." },
        { id: "cut-dns", label: "قطع DNS عن المؤسسة بالكامل من دون تحديد المصدر", points: 1, feedback: "التعطيل واسع ولا يتناسب مع تنبيه مصدره محطة اختبار واحدة." },
      ],
    },
    {
      id: "SOC-M02", title: "أمر إنشاء حساب على نظام تدريب", category: "الأجهزة",
      received: "11:10", asset: "host: lab-runner-02", source: "EDR + change control",
      description: "سُجّل إنشاء حساب جديد، لكن المالك يقر بأن تشغيل سيناريو اختبار يتطلب حسابًا مؤقتًا.",
      priority: "p4", priorityExplanation: "تتفق البصمة ونطاق المختبر وتذكرة التغيير مع النشاط المخطط؛ يلزم التحقق ثم إغلاق الإنذار دون إخفاء القاعدة.",
      evidence: [
        "11:01:07 automation job=lab-test-rotation approved=true",
        "11:02:14 edr command=create-user username=test-runner-2026",
        "11:04:20 access group=lab-only membership=true",
        "11:06:01 audit expires_at=11:50 temporary=true",
        "11:09:21 security baseline external_access=false",
      ],
      actions: [
        { id: "disable-audit", label: "تعطيل تدقيق إنشاء الحسابات على جميع الخوادم", points: 0, feedback: "يضعف قدرة الكشف مستقبلًا. لا تُغيّر إعداد المراقبة لحل إنذار واحد." },
        { id: "validate-expiry", label: "التحقق من طلب التغيير ونطاق الصلاحيات ووقت انتهاء الحساب ثم المتابعة", points: 12, feedback: "يكفي التحقق المقيد عندما تتوافق أدلة إنشاء الحساب مع نشاط المختبر." },
        { id: "isolate-company", label: "عزل كل الخوادم لمنع إنشاء حسابات أخرى", points: 1, feedback: "احتواء غير متناسب مع جهاز تدريب ذي صلاحيات محدودة." },
      ],
    },
  ]),
  links: Object.freeze([
    { id: "evidence-link", label: "التصدير فعلي ومؤثر؛ تحديث المورد مشتبه به وقد يرتبط بالوجهة، وأتحقق من الرمز والعملية قبل الجزم بالسبب", points: 20, feedback: "تمييز جيد بين النقل المثبت وبين فرضية سلسلة التوريد التي تتطلب أدلة إضافية لربط المنفذ." },
    { id: "vendor-proven", label: "التوقيع الصالح للحزمة يثبت أن المورد هو منفذ التصدير", points: 1, feedback: "التوقيع يثبت ارتباط البناء بمفتاح محدد، وليس هوية شخص أو سبب إرسال البيانات." },
    { id: "dns-proven", label: "سجلات DNS لمحطة المختبر هي قناة التسريب المؤكدة بدل تصدير الخدمة المسجل", points: 0, feedback: "النشاط في محطة الاختبار موثق ولا يفسر سجل التصدير المكتمل لخدمة مختلفة." },
  ]),
});

export const SOC_SHIFTS = Object.freeze([legacyShift, intermediate, advanced]);
export const SOC_SHIFT_IDS = Object.freeze(SOC_SHIFTS.map(shift => shift.id));
export function getSocShift(id) {
  return SOC_SHIFTS.find(shift => shift.id === id) || legacyShift;
}
export function isSocShiftId(id) {
  return SOC_SHIFT_IDS.includes(id);
}
export function socShiftMaxScore(shift) { return shift.alerts.length * 20 + 20; }
export { SOC_PRIORITIES };
