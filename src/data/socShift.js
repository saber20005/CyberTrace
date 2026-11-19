// Synthetic defensive SOC shift; no live SIEM integration or validated grading.
// Keep separate from the existing 28 canonical cases, XP and BlackBox sync.
export const SOC_SHIFT_ID = "SOC-SHIFT-01";
export const SOC_PRIORITIES = Object.freeze([
  { id: "p1", label: "P1 · عاجل", hint: "احتواء فوري لخطر نشط" },
  { id: "p2", label: "P2 · مرتفع", hint: "استجابة سريعة مع تحديد النطاق" },
  { id: "p3", label: "P3 · متوسط", hint: "معالجة منظّمة وفق الأثر" },
  { id: "p4", label: "P4 · منخفض", hint: "تحقق قبل التصعيد" },
]);

export const SOC_ALERTS = Object.freeze([
  {
    id: "SOC-A14", title: "ضغط MFA يتبعه تنزيل حساس", category: "هوية ووصول",
    received: "08:19", asset: "account: jsmith", source: "Identity + file audit",
    description: "تزامن رفض طلبات المصادقة مع نجاح جديد ووصول إلى بيانات حساسة. هل الخطر نشط؟",
    priority: "p1", priorityExplanation: "نشاط دخول مؤثر بالفعل بعد رفض المصادقة، يتبعه تنزيل حساس؛ يلزم احتواء جلسات الحساب مع جمع الأدلة.",
    evidence: [
      "08:12:40 auth  login_success user=jsmith ip=198.51.100.18 device=managed",
      "08:16:09 mfa   prompt_denied user=jsmith ip=203.0.113.44",
      "08:16:16 mfa   prompt_denied user=jsmith ip=203.0.113.44",
      "08:17:02 mfa   challenge_approved user=jsmith ip=203.0.113.44 device=unknown",
      "08:18:21 files export user=jsmith path=finance/payroll.csv size=12MB"
    ],
    actions: [
      { id: "contain", label: "إبطال الجلسات المشبوهة وتعليق الوصول مؤقتًا وحفظ سجلات MFA والملفات", points: 12, feedback: "يعالج الوصول القائم ويحتفظ بالأدلة اللازمة للتحقق من نطاق الضرر." },
      { id: "reset-only", label: "تغيير كلمة المرور وحدها مع إبقاء الجلسات الحالية", points: 5, feedback: "تغيير كلمة المرور قد لا يبطل الجلسات الجارية؛ الاحتواء ناقص." },
      { id: "monitor", label: "انتظار نهاية المناوبة لجمع مزيد من المؤشرات", points: 0, feedback: "التأخير يمنح الجلسة المشبوهة وقتًا إضافيًا. لا تنتظر في خطر نشط." },
    ],
  },
  {
    id: "SOC-B08", title: "بريد تصيّد موجه لموظف حساس", category: "أمن البريد",
    received: "08:17", asset: "mailbox: jsmith", source: "Mail gateway",
    description: "حملة تطلب إدخال بيانات الدخول إلى صفحة مزيفة، والمستلم مرتبط بتنبيه الهوية السابق.",
    priority: "p2", priorityExplanation: "رسالة تصيّد ذات مؤشر واضح لكنها لا تثبت وحدها أن الجلسة المخترقة نتجت عنها؛ ابحث عن تفاعل المستخدم.",
    evidence: [
      "08:14:07 mail delivery recipient=jsmith@corp.example sender=helpdesk@corp-support.example",
      "08:14:08 mail url=https://login-corp.example.invalid/reset category=credential-harvest",
      "08:14:12 mail dmarc=fail recipient=jsmith@corp.example",
      "08:16:35 proxy request user=jsmith target=login-corp.example.invalid blocked=unknown",
      "08:16:51 mail campaign_recipients=7 clicked_confirmed=unknown"
    ],
    actions: [
      { id: "scope-block", label: "حفظ الرسالة، وحظر المؤشرات، وحصر المستلمين والتحقق من النقر والاعتمادات المتأثرة", points: 12, feedback: "يحتوي الحملة ويحفظ الأدلة، دون القفز إلى استنتاج سببي غير مثبت." },
      { id: "delete-only", label: "حذف الرسالة من صندوق المستلم الأول فقط", points: 4, feedback: "لا يعالج بقية المستلمين أو روابط الحملة، ويضيّع جانبًا من الأدلة." },
      { id: "assume", label: "إعلان أن هذا البريد سبب اختراق الحساب دون تحليل إضافي", points: 0, feedback: "الاقتران الزمني ليس إثباتًا سببيًا. افحص سجلات النقر والجلسات." },
    ],
  },
  {
    id: "SOC-C03", title: "صلاحيات قراءة عامة على حاوية اختبار", category: "سحابة",
    received: "08:13", asset: "bucket: qa-public-samples", source: "Cloud policy monitor",
    description: "تغيّر إعداد الوصول إلى القراءة العامة، لكن الجرد يشير إلى بيانات اختبار منشورة عمدًا.",
    priority: "p3", priorityExplanation: "مخاطر إعداد عامة تحتاج مراجعة مالك البيانات والتصنيف، لكن لا دليل على تسريب بيانات حساسة أو نشاط نشط.",
    evidence: [
      "08:09:10 policy change bucket=qa-public-samples acl=public-read",
      "08:09:15 inventory owner=qa-team classification=public-test",
      "08:10:01 dlp scan bucket=qa-public-samples sensitive_hits=0",
      "08:11:26 cloud activity external_reads=3 object_type=sample.json",
      "08:12:50 change ticket=QA-221 approval=pending-review"
    ],
    actions: [
      { id: "verify-owner", label: "التحقق من اعتماد النشر وملكية الحاوية، وتقييد الوصول إذا ثبت أنه غير مقصود", points: 12, feedback: "استجابة متناسبة مع أثر البيانات بدلاً من افتراض تسريب لم تثبته السجلات." },
      { id: "freeze-all", label: "إيقاف جميع خدمات المؤسسة السحابية فورًا", points: 0, feedback: "تعطيل واسع وغير متناسب مع الأدلة. يبدأ العمل بمراجعة الأصل المحدد." },
      { id: "ignore", label: "تجاهل تغيير السياسة نهائيًا لأن نتيجة DLP صفر", points: 4, feedback: "فحص DLP لا يحل محل الموافقات والجرد والتحقق من الإعداد." },
    ],
  },
  {
    id: "SOC-D01", title: "ارتفاع استخدام المعالج في خادم النسخ", category: "نقاط النهاية",
    received: "08:11", asset: "host: backup-lab-02", source: "Endpoint monitoring",
    description: "تنبيه استهلاك CPU عالٍ أثناء نافذة النسخ، مع توقيع موثوق للعملية لكن دون استبعاد كل المخاطر.",
    priority: "p4", priorityExplanation: "المؤشرات تتفق مع النسخ الاحتياطي المصرّح به؛ تحقق خفيف ومراقبة قبل عزل جهاز عمل.",
    evidence: [
      "08:06:05 scheduler backup_window=08:00-08:30 job=nightly-archive",
      "08:06:17 process start name=backup-agent signer=corp-approved hash=allowlisted",
      "08:08:30 telemetry cpu=94% pid=412 path=/opt/corp/backup-agent",
      "08:09:00 network destination=198.51.100.55 asset=backup-vault status=approved",
      "08:10:40 edr malicious_behavior=none update=2026-11-19"
    ],
    actions: [
      { id: "validate", label: "مطابقة جدول النسخ وتوقيع العملية ووجهتها، ثم إغلاق الإنذار إن ظل متسقًا", points: 12, feedback: "يراجع القرائن ولا يعطل النسخ لمجرد زيادة CPU؛ يبقي باب التصعيد مفتوحًا عند تغيرها." },
      { id: "isolate", label: "عزل الخادم فورًا وإيقاف كل النسخ الاحتياطية", points: 2, feedback: "تصعيد مبالغ فيه نسبةً إلى الأدلة المتاحة ويضر بالنسخ الاحتياطية." },
      { id: "never-review", label: "تعطيل قواعد تنبيه الاستهلاك نهائيًا", points: 0, feedback: "يلغي القدرة المستقبلية على اكتشاف سلوك جديد. راجع الإنذار دون إضعاف الرصد." },
    ],
  },
]);

export const SOC_LINK_CHOICES = Object.freeze([
  {
    id: "possible-link",
    label: "SOC-B08 وSOC-A14 قد يرتبطان بحساب واحد؛ أحقق في النقر ومصدر الجلسة قبل الجزم بالسبب",
    points: 20,
    feedback: "استنتاج متحفظ: المؤشرات تربط الهدف والوقت، لكن سبب الدخول يحتاج تأكيدًا إضافيًا.",
  },
  {
    id: "certain-cause",
    label: "SOC-B08 يثبت قطعًا أن رسالة التصيّد سببت الوصول في SOC-A14",
    points: 4,
    feedback: "السجلات المتاحة لا تثبت تلقائيًا سبب نجاح MFA أو الجلسة؛ العلاقة فرضية تستحق الاختبار.",
  },
  {
    id: "all-one-incident",
    label: "جميع التنبيهات الأربعة تمثل سلسلة هجوم مؤكدة واحدة",
    points: 0,
    feedback: "تنبيه النسخ وحاوية الاختبار لا يمتلكان رابطًا مثبتًا ببقية التنبيهات.",
  },
]);

export const SOC_SHIFT_MAX_SCORE = SOC_ALERTS.length * 20 + 20;
