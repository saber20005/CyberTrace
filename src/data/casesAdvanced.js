// Synthetic defensive investigations. Domains, identities and evidence are training examples.
export const ADVANCED_CASES = [
  {
    id: "INC-1207",
    incidentTitle: "Unapproved Federation Trust Change",
    severity: "HIGH",
    meta: "المستوى: متقدم · Tenant: training-portal · Time: 07:14 UTC",
    brief:
      "أبلغ فريق الهوية عن جلسة إدارية صادرة من موفّر هوية غير موجود في القائمة المعتمدة. توجد تغييرات حديثة على إعدادات تسجيل الدخول الموحّد. اربط مراجعة الإعداد بسجل المصادقة والوصول، وحدّد كيف تحتوي الثقة الجديدة دون تعطيل دخول جميع الموظفين.",
    logCommand: "identity-audit --correlate federation,sign-in,admin-access tenant=training-portal",
    logLines: [
      "07:10:00  baseline  federation_policy  tenant=training-portal  revision=81  allowed_issuer=https://idp.staff.example  default_role=Analyst",
      "07:12:03  config-audit  federation_update  tenant=training-portal  revision=82  actor_session=admin-214  added_issuer=https://idp.partner-training.example  default_role=TenantAdmin",
      "07:12:05  change-control  lookup  config_revision=82  approved_change=none  approved_partner_onboarding=none",
      "07:13:41  identity  assertion_validation  request=sso-708  issuer=https://idp.partner-training.example  config_revision=82  signature=valid_for_configured_key  subject=external-analyst",
      "07:13:42  identity  session_created  request=sso-708  session=portal-909  role=TenantAdmin  source_ip=203.0.113.42",
      "07:14:02  admin-api  policy_read  session=portal-909  resource=tenant-security-policy  status=200",
      "07:14:08  inventory  issuer_review  issuer=https://idp.partner-training.example  approved_issuer=false  business_owner=unassigned",
    ],
    evidenceQuestion: "ما الدليل الأقوى على أن تغيير الثقة أتاح وصولًا إداريًا غير معتمد؟",
    evidenceOptions: [
      {
        id: "trust-revision-to-admin-session",
        label:
          "المراجعة 82 أضافت جهة غير معتمدة بصلاحية إدارية، ثم قُبل تأكيد صادر منها بالمراجعة نفسها وأنشأ جلسة قرأت إعدادات الإدارة بنجاح",
        correct: true,
      },
      {
        id: "signature-alone-is-approval",
        label: "صلاحية توقيع تأكيد الهوية تثبت وحدها أن الموفّر وصلاحياته معتمدان من المؤسسة",
        correct: false,
      },
      {
        id: "external-ip-alone",
        label: "ظهور عنوان خارجي في سجل الدخول يثبت وحده أن إعدادات الثقة تغيّرت",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. ربط مراجعة الإعداد بجهة الإصدار والجلسة الإدارية يثبت أثر التغيير. التوقيع صالح وفق مفتاح أصبح موثوقًا داخل الإعداد المعدّل؛ لا يثبت ذلك أن إضافة هذه الثقة أو الصلاحية حصلت على الموافقة.",
    evidenceFeedbackIncorrect:
      "✗ لا يكفي عنوان المصدر أو صلاحية التوقيع. تتبّع المراجعة 82 من إضافة الموفّر غير المعتمد إلى قبول تأكيده ثم استخدام الجلسة الإدارية. صحة التوقيع منفصلة عن اعتماد جهة الثقة.",
    decisionQuestion: "ما الاستجابة التي تعالج جهة الثقة والجلسة الناتجة عنها؟",
    decisions: [
      {
        id: "contain-issuer-and-sessions",
        label:
          "حفظ مراجعات الإعداد والتدقيق، وتعطيل الثقة بالمصدر غير المعتمد وإبطال جلساته المتأثرة، ثم استعادة إعداد معتمد والتحقيق في جلسة المسؤول التي أجرت التغيير",
        outcome:
          "قرار صحيح. إزالة الثقة تمنع قبول تأكيدات جديدة من هذا المصدر، وإبطال الجلسات يعالج الوصول الذي صدر بالفعل. حفظ السجلات وفحص جلسة admin-214 يحددان نطاق التغيير وسببه، مع إبقاء موفّر الموظفين المعتمد متاحًا والتحقق من توقف الوصول المتأثر.",
        points: 40,
      },
      {
        id: "remove-issuer-only",
        label: "حذف الموفّر الجديد من الإعداد فقط، واعتبار الجلسات التي صدرت منه ملغاة تلقائيًا",
        outcome:
          "إجراء جزئي. أوقفت إصدار وصول جديد عبر الثقة المضافة، لكن جلسة التطبيق القائمة قد تستمر حسب آلية الجلسات. يلزم إبطال الجلسات المتأثرة والتحقق من نشاطها، وفحص من غيّر الإعداد.",
        points: 20,
      },
      {
        id: "reset-one-password",
        label: "إعادة تعيين كلمة مرور external-analyst فقط مع إبقاء جهة الإصدار وصلاحيتها الإدارية",
        outcome:
          "إجراء محدود. المشكلة في الثقة المضافة ومسار إصدار الجلسات، وليس في دليل على سرقة كلمة مرور محلية لهذا المستخدم. بقاء الموفّر غير المعتمد قد يتيح إنشاء جلسات أخرى.",
        points: 10,
      },
      {
        id: "trust-valid-signature",
        label: "إغلاق التنبيه لأن سجل المصادقة يقول إن التوقيع صالح",
        outcome:
          "قرار خاطئ. التوقيع الصالح يربط التأكيد بالمفتاح المعرّف في الإعداد، لكنه لا يمنح اعتمادًا مؤسسيًا لجهة أُضيفت دون موافقة. السجلات تثبت أن هذه الثقة أصدرت وصولًا إداريًا فعليًا.",
        points: 0,
      },
    ],
  },
  {
    id: "INC-1208",
    incidentTitle: "Payment Diversion in a Supplier Email Thread",
    severity: "HIGH",
    meta: "المستوى: متقدم · Payment: TRAIN-PAY-208 · Time: 13:22 UTC",
    brief:
      "وصل تعديل عاجل لبيانات سداد فاتورة داخل سلسلة بريد مع مورد معتاد، واجتاز البريد فحوص مصادقة النطاق. لم تُنفّذ الدفعة بعد. قارن الرسالة بسجل المورد ونتيجة التحقق عبر قناة معروفة لتحديد ما إذا كانت مطالبة الدفع معتمدة، دون اعتبار نجاح فحص البريد إثباتًا لصحة التعليمات المالية.",
    logCommand: "case-review --join mail-auth,vendor-register,payment-check payment=TRAIN-PAY-208",
    logLines: [
      "13:18:10  mail-gateway  received  message=msg-208  from=billing@parts-supplier.example  thread=po-604  subject=Re:Training-invoice-604",
      "13:18:11  mail-auth  result  message=msg-208  spf=pass  dkim=pass  dmarc=pass  aligned_domain=parts-supplier.example",
      "13:18:12  mail-review  payment_instruction  message=msg-208  beneficiary_ref=TRAIN-BEN-NEW  requested_action=replace_registered_beneficiary",
      "13:19:05  vendor-register  lookup  supplier=parts-supplier.example  approved_beneficiary=TRAIN-BEN-OLD  last_approved_change=2026-09-01  change_request=none",
      "13:21:40  finance-check  known_contact_callback  contact_source=existing_vendor_register  supplier_denies_beneficiary_change=true  reference=verify-208",
      "13:22:00  payment-workflow  status  payment=TRAIN-PAY-208  beneficiary=TRAIN-BEN-NEW  approval=pending  transfer_executed=false",
      "13:22:16  supplier-notice  verified_channel  reference=verify-208  mailbox_incident_confirmed=true  affected_mailbox=billing@parts-supplier.example",
    ],
    evidenceQuestion: "ما الدليل الأقوى على أن طلب تحويل الدفعة غير معتمد رغم اجتياز فحوص البريد؟",
    evidenceOptions: [
      {
        id: "verified-denial-and-workflow-mismatch",
        label:
          "الرسالة تستبدل المستفيد المسجّل دون طلب تغيير، وجهة اتصال موثوقة من السجل نفت التعديل وأكد المورد حادثة في صندوق البريد، والدفعة ما زالت معلّقة",
        correct: true,
      },
      {
        id: "auth-pass-proves-payment",
        label: "نجاح SPF وDKIM وDMARC يكفي لاعتماد تغيير المستفيد وتنفيذ الدفعة",
        correct: false,
      },
      {
        id: "same-thread-proves-intent",
        label: "بقاء الرسالة داخل سلسلة المراسلات القديمة يثبت أن التعليمات الجديدة صادرة عن الشخص المخوّل",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. التحقق المستقل عبر بيانات اتصال سابقة، مع غياب طلب تغيير معتمد وإقرار المورد بحادثة الصندوق، يدعم رفض التعليمات. فحوص النطاق لا تثبت قصد صاحب الحساب أو صلاحية التعليمات التجارية. لا تثبت هذه السجلات خسارة مالية؛ التحويل لم يُنفّذ.",
    evidenceFeedbackIncorrect:
      "✗ فحوص مصادقة البريد وسلسلة الرسائل لا تعتمدان المستفيد ماليًا. قارن TRAIN-BEN-NEW بالسجل، ثم راجع نفي التغيير عبر جهة اتصال محفوظة سابقًا وحالة الدفعة الفعلية.",
    decisionQuestion: "كيف تمنع تحويلًا غير معتمد وتحافظ على التحقيق والعلاقة مع المورد؟",
    decisions: [
      {
        id: "hold-verify-preserve-coordinate",
        label:
          "إيقاف الدفعة المعلّقة وحفظ الرسالة ورؤوسها وسجلات الاعتماد، وتأكيد بيانات السداد عبر القناة المسجّلة، وتنسيق معالجة صندوق المورد ومراجعة الرسائل المرتبطة قبل استئناف الدفع",
        outcome:
          "قرار صحيح. تعليق الدفعة يمنع الضرر قبل وقوعه، والقناة المستقلة تمنع الاعتماد على الصندوق المتأثر نفسه. حفظ الأدلة ومراجعة طلبات الدفع المرتبطة يحددان النطاق، ثم تُستأنف المعاملة بعد اعتماد بيانات المستفيد وفق إجراء المالية.",
        points: 40,
      },
      {
        id: "hold-payment-only",
        label: "تعليق هذه الدفعة فقط دون حفظ الرسالة أو مراجعة طلبات الدفع الأخرى من الصندوق المتأثر",
        outcome:
          "إجراء جزئي. أوقفت الخسارة المباشرة لهذه المعاملة، لكن طلبات أخرى قد تكون متأثرة. حفظ الرسالة والتنسيق مع المورد والمالية ضروريان للتحقق من النطاق واعتماد مسار آمن لاستئناف السداد.",
        points: 20,
      },
      {
        id: "reply-for-confirmation",
        label: "الرد على الرسالة نفسها لطلب تأكيد تغيير المستفيد، ثم الدفع إذا جاء التأكيد",
        outcome:
          "إجراء غير كافٍ. إقرار المورد بحادثة الصندوق يجعل الرد عبر القناة ذاتها غير مستقل. استخدم جهة الاتصال المسجّلة سابقًا وإجراء تغيير المستفيد، مع إبقاء الدفعة معلّقة حتى اكتمال التحقق.",
        points: 5,
      },
      {
        id: "pay-authenticated-mail",
        label: "تنفيذ الدفعة فورًا لأن النطاق صحيح والرسالة اجتازت المصادقة",
        outcome:
          "قرار خاطئ. نجاح مصادقة النطاق لا يجيز تغييرًا ماليًا نفاه المورد عبر قناة موثوقة. تحويل الدفعة الآن يحوّل محاولة احتيال مؤكدة بالسجلات إلى خطر خسارة فعلية.",
        points: 0,
      },
    ],
  },
  {
    id: "INC-1209",
    incidentTitle: "Unexpected Library Loaded by a Signed Application",
    severity: "HIGH",
    meta: "المستوى: متقدم · Host: LAB-DESK-09 · Time: 09:31 UTC",
    brief:
      "أصدر النظام تنبيه اتصال من برنامج موقّع تستخدمه المؤسسة، لكن التوقيع يخص الملف التنفيذي ولا يفسّر كل المكتبات المحمّلة في عمليته. راجع مصدر المكتبة ومسار التحميل وسلسلة العملية والاتصال، وحدّد نطاق الاحتواء دون حظر جميع البرامج الموقّعة أو الاكتفاء بالثقة بالتوقيع.",
    logCommand: "endpoint-review --join process,module-load,file-audit,network host=LAB-DESK-09",
    logLines: [
      "09:28:00  baseline  approved_install  application=ReportViewer  executable=C:\\Program Files\\TrainingViewer\\viewer.exe  signer=TrainingSoftware  library_root=C:\\Program Files\\TrainingViewer\\lib",
      "09:29:11  file-audit  file_create  host=LAB-DESK-09  path=C:\\Users\\Public\\TrainingDocs\\render-helper.dll  hash=TRAIN-DLL-209  writer=unpacked-tool.exe",
      "09:30:03  process  start  pid=6204  executable=C:\\Program Files\\TrainingViewer\\viewer.exe  signature=valid  working_directory=C:\\Users\\Public\\TrainingDocs",
      "09:30:04  module-load  event  pid=6204  module=C:\\Users\\Public\\TrainingDocs\\render-helper.dll  hash=TRAIN-DLL-209  signature=absent",
      "09:30:06  network  connection  pid=6204  initiated_by_module=TRAIN-DLL-209  destination=198.51.100.29:443  domain=telemetry-check.example  result=allowed",
      "09:30:10  inventory  module_review  application=ReportViewer  hash=TRAIN-DLL-209  approved_component=false  approved_plugin=false",
      "09:31:00  package-audit  install_manifest  application=ReportViewer  expected_library_path=C:\\Program Files\\TrainingViewer\\lib\\render-helper.dll  expected_hash=TRAIN-DLL-APPROVED",
    ],
    evidenceQuestion: "ما الذي يدعم وجود تحميل مكتبة مزروعة بدل اعتبار الاتصال طبيعيًا لبرنامج موقّع؟",
    evidenceOptions: [
      {
        id: "unapproved-module-load-and-network",
        label:
          "العملية الموقّعة حمّلت مكتبة أنشأتها أداة أخرى في مجلد قابل للكتابة، ببصمة ومسار مخالفين للبيان المعتمد، ثم نسب حساس الشبكة الاتصال إلى تلك المكتبة",
        correct: true,
      },
      {
        id: "unsigned-module-alone",
        label: "غياب توقيع أي مكتبة يكفي وحده لإثبات أنها خبيثة، حتى دون معرفة مسارها أو استخدامها",
        correct: false,
      },
      {
        id: "signed-parent-is-safe",
        label: "التوقيع الصالح على viewer.exe يثبت أن جميع المكتبات التي حمّلها ومصادر اتصالاته معتمدة",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. السلسلة تربط إنشاء المكتبة غير المعتمدة بتحميلها داخل العملية ثم بالاتصال، مع مخالفة بيان التثبيت. توقيع الملف التنفيذي لا يضمن سلامة مكتبة خارجية حمّلها. الاتصال وحده لا يثبت ما أُرسل، ويلزم فحص إضافي لتحديد الأثر.",
    evidenceFeedbackIncorrect:
      "✗ التوقيع أو غيابه ليس حكمًا كافيًا وحده. اربط بصمة TRAIN-DLL-209 ومسارها القابل للكتابة بمصدر إنشائها وتحميلها والاتصال المنسوب إليها، وقارنها ببيان التثبيت المعتمد.",
    decisionQuestion: "ما الخطوة الأنسب لاحتواء الجهاز وفهم دور المكتبة؟",
    decisions: [
      {
        id: "isolate-preserve-module-scope",
        label:
          "عزل الجهاز المتأثر وفق إجراء الاستجابة وحفظ بيانات العملية والمكتبة والسجلات قبل المعالجة، ثم حصر البصمة والمسار في الأجهزة الأخرى واستعادة التثبيت المعتمد والتحقق من توقف النشاط",
        outcome:
          "قرار صحيح. الاحتواء يحد من الاتصال الجاري، وحفظ بيانات العملية والمكتبة يتيح تفسير سبب التحميل ونطاقه. البحث عن البصمة والمسار يوسّع التحقيق بدليل محدد، واستعادة التثبيت من مصدر معتمد ومعالجة مسار التحميل يسبقان التحقق من عودة الجهاز للخدمة.",
        points: 40,
      },
      {
        id: "block-one-domain-only",
        label: "حظر telemetry-check.example فقط مع إبقاء العملية والمكتبة كما هما",
        outcome:
          "إجراء جزئي. حظر الوجهة قد يوقف هذا الاتصال، لكنه لا يعالج تحميل المكتبة غير المعتمدة أو نشاطها المحلي، وقد تتغير الوجهة. يلزم احتواء الجهاز وحفظ الأدلة وفحص مصدر المكتبة ومسار تحميلها.",
        points: 20,
      },
      {
        id: "delete-library-first",
        label: "حذف المكتبة فورًا دون حفظ نسخة أو بيانات العملية، ثم إغلاق التنبيه إذا اختفى الاتصال",
        outcome:
          "إجراء محدود. قد يوقف حذف الملف تحميله لاحقًا، لكنه قد يمحو دليلًا مهمًا ولا يثبت انتهاء النشاط داخل العملية الحالية. احفظ الأدلة أولًا، ثم نفّذ معالجة مضبوطة وتحقق من النتائج.",
        points: 10,
      },
      {
        id: "allow-signed-executable",
        label: "استثناء العملية من المراقبة لأن الملف التنفيذي يحمل توقيعًا صالحًا",
        outcome:
          "قرار خاطئ. الثقة بتوقيع الملف التنفيذي لا تمتد تلقائيًا إلى المكتبة التي حمّلها من مسار غير معتمد. الاستثناء يخفي السلسلة التي أظهرتها سجلات التحميل والشبكة.",
        points: 0,
      },
    ],
  },
  {
    id: "INC-1210",
    incidentTitle: "Database Snapshot Shared with an External Account",
    severity: "HIGH",
    meta: "المستوى: متقدم · Snapshot: TRAIN-SNAP-310 · Time: 18:46 UTC",
    brief:
      "ظهرت عملية مشاركة للقطة قاعدة بيانات تحتوي على بيانات تدريب مصنّفة حساسة. قد تكون مشاركة اللقطات إجراءً مشروعًا بين حسابات المؤسسة، لذلك لا يكفي اسم العملية. قارن جهة المشاركة بسجل الحسابات والتغيير المعتمد، ثم فرّق بين منح الوصول ووجود دليل على نسخ البيانات فعليًا.",
    logCommand: "cloud-review --join snapshot-audit,account-inventory,change-control snapshot=TRAIN-SNAP-310",
    logLines: [
      "18:42:00  data-inventory  snapshot_profile  snapshot=TRAIN-SNAP-310  classification=restricted-training  owner_account=training-prod-a  approved_recipients=training-recovery-a",
      "18:44:03  cloud-audit  snapshot_permission_change  request=snap-310  snapshot=TRAIN-SNAP-310  actor_session=backup-admin-77  recipient_account=external-training-b  permission=restore  result=success",
      "18:44:04  cloud-audit  snapshot_permission_read  snapshot=TRAIN-SNAP-310  restore_accounts=training-recovery-a,external-training-b",
      "18:44:20  account-inventory  lookup  account=external-training-b  organization_member=false  approved_data_processor=false",
      "18:45:10  change-control  lookup  snapshot=TRAIN-SNAP-310  recipient_account=external-training-b  approved_change=none",
      "18:46:00  audit-coverage  recipient_activity  account=external-training-b  logs_available=false  copy_or_restore_status=unknown",
      "18:46:12  cloud-audit  owner_activity  snapshot=TRAIN-SNAP-310  subsequent_permission_removal=none",
    ],
    evidenceQuestion: "ما الاستنتاج المدعوم بالسجلات عن هذه اللقطة؟",
    evidenceOptions: [
      {
        id: "actual-unapproved-share-not-proven-copy",
        label:
          "نجح منح صلاحية الاستعادة وظهرت في إعداد اللقطة لحساب خارجي غير معتمد دون تغيير مصرح؛ أما نسخ اللقطة أو استعادتها لدى المستلم فلم يتحدد بعد",
        correct: true,
      },
      {
        id: "permission-name-means-copy",
        label: "اسم صلاحية restore يثبت أن الطرف الخارجي استعاد قاعدة البيانات بالفعل",
        correct: false,
      },
      {
        id: "no-recipient-log-means-no-risk",
        label: "عدم توفر سجلات حساب المستلم يثبت أنه لم يصل إلى اللقطة ويمكن تجاهل المشاركة",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. نجاح تعديل الصلاحية وقراءتها لاحقًا يثبتان منح وصول غير معتمد. لا تتوفر سجلات المستلم، لذلك لا يصح الجزم بوقوع نسخة أو نفيها. يجب احتواء المشاركة والتحقيق في هذا الجانب بوصفه أثرًا غير محسوم.",
    evidenceFeedbackIncorrect:
      "✗ ميّز بين صلاحية ممنوحة وعملية استعادة منفّذة. راجع نجاح تعديل الإعداد وظهور الحساب الخارجي في القائمة، ثم حدود تغطية سجلاته. غياب تلك السجلات لا يثبت عدم الاستخدام.",
    decisionQuestion: "كيف تحتوي المشاركة مع الحفاظ على القدرة على تقييم نطاق التعرض؟",
    decisions: [
      {
        id: "remove-share-review-actor-investigate-copies",
        label:
          "حفظ إعدادات المشاركة والتدقيق ثم سحب وصول الحساب الخارجي والتحقق من الإزالة، وتقييد الجلسة المتأثرة والتحقيق في صاحب التغيير، والتنسيق لمعرفة أي نسخ سابقة والتزامات التعامل مع البيانات",
        outcome:
          "قرار صحيح. سحب المشاركة يحد من الوصول اللاحق ولا يسترجع نسخة قد تكون أُنشئت سابقًا. حفظ الأدلة والتحقيق في الجلسة والتنسيق عبر قنوات المؤسسة أو المزود يحددان ما يمكن إثباته عن الاستخدام السابق، مع إبقاء مشاركة الاسترداد المعتمدة بعد التحقق منها.",
        points: 40,
      },
      {
        id: "revoke-share-close",
        label: "إزالة الحساب الخارجي فقط ثم اعتبار أي نسخة سابقة غير قابلة للاستخدام تلقائيًا",
        outcome:
          "إجراء جزئي. أغلقت مسارًا للوصول الجديد، لكن إلغاء المشاركة لا يضمن حذف نسخة أو استعادة حدثت قبل الإلغاء. يلزم توثيق حدود المعرفة والتحقيق في الجلسة والنسخ المحتملة.",
        points: 20,
      },
      {
        id: "rotate-database-password-only",
        label: "تغيير كلمة مرور قاعدة البيانات الحية فقط دون تعديل صلاحيات اللقطة",
        outcome:
          "إجراء محدود. بيانات اعتماد القاعدة الحية ليست هي صلاحية استعادة اللقطة، ولا يسحب تغييرها وصول الحساب الخارجي المضاف. عالج إعداد المشاركة نفسه وحافظ على أدلة التغيير.",
        points: 5,
      },
      {
        id: "wait-for-recipient-proof",
        label: "إبقاء المشاركة حتى يصل دليل مؤكد على قيام المستلم بنسخ اللقطة",
        outcome:
          "قرار خاطئ. منح الوصول غير المعتمد ثابت بالفعل، وغياب تغطية سجلات المستلم لا يبرر تركه مفتوحًا. يمكن احتواء المشاركة فورًا مع متابعة تقييم الأثر دون اختراع نتيجة لعملية النسخ.",
        points: 0,
      },
    ],
  },
  {
    id: "INC-1211",
    incidentTitle: "Temporary Firewall Rule Bypasses Segmentation",
    severity: "HIGH",
    meta: "المستوى: متقدم · Segment: training-users → training-data · Time: 15:09 UTC",
    brief:
      "نبّهت مراقبة الشبكة إلى اتصال مباشر من شبكة المستخدمين نحو شبكة البيانات، بينما التصميم المعتمد يمرّر هذا النوع عبر طبقة التطبيق. توجد قاعدة مؤقتة لم تُزل في موعدها. اربط سياسة التقسيم بمراجعة الجدار الناري ومسار التدفق الفعلي، ولا تفترض تسريب بيانات اعتمادًا على السماح الشبكي وحده.",
    logCommand: "network-review --correlate segmentation,firewall-audit,flow rule=TRAIN-TEMP-411",
    logLines: [
      "15:00:00  baseline  segmentation_policy  source_zone=training-users  destination_zone=training-data  direct_tcp_5432=deny  approved_gateway=training-app",
      "15:02:03  firewall-audit  rule_update  revision=411  rule=TRAIN-TEMP-411  source=192.0.2.0/24  destination=198.51.100.30  port=5432  action=allow  expires_at=15:05:00Z",
      "15:02:05  change-control  rule_review  rule=TRAIN-TEMP-411  approved_ticket=none  policy_exception=none",
      "15:07:02  firewall  active_config  revision=411  rule=TRAIN-TEMP-411  enabled=true  expiration_enforced=false",
      "15:08:14  flow  session_start  flow=flow-411  source=192.0.2.41  destination=198.51.100.30:5432  matched_rule=TRAIN-TEMP-411  action=allow  next_hop=direct",
      "15:08:15  network-sensor  transport  flow=flow-411  tcp_handshake=complete  bytes_client_to_server=612  bytes_server_to_client=348",
      "15:09:00  database-audit  access_summary  client=192.0.2.41  authentication=failed  successful_queries=0  window=15:08:00Z..15:09:00Z",
    ],
    evidenceQuestion: "أي استنتاج يربط القاعدة المؤقتة بأثر فعلي ويحترم حدود الدليل؟",
    evidenceOptions: [
      {
        id: "rule-to-direct-flow-with-limited-impact",
        label:
          "بقيت قاعدة غير معتمدة فعالة بعد موعد انتهائها، وطابقها تدفق مباشر أكمل اتصال TCP متجاوزًا التقسيم؛ لكن السجلات المعروضة لا تثبت قراءة بيانات ناجحة",
        correct: true,
      },
      {
        id: "allow-alone-proves-theft",
        label: "وجود كلمة allow في الإعداد يكفي لإثبات سرقة سجلات قاعدة البيانات",
        correct: false,
      },
      {
        id: "failed-db-auth-means-segmentation-safe",
        label: "فشل مصادقة قاعدة البيانات يعني أن التقسيم الشبكي منع الاتصال المباشر كما صُمّم",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. مراجعة الإعداد والتدفق المطابق والمصافحة المكتملة تثبت تجاوز حد الشبكة، وفشل مصادقة القاعدة يصف طبقة حماية أخرى. لا توجد استعلامات ناجحة في النافذة المعروضة، لذلك لا يصح تحويل تجاوز التقسيم وحده إلى ادعاء تسريب بيانات.",
    evidenceFeedbackIncorrect:
      "✗ افصل بين طبقات الحماية. طابق flow-411 مع TRAIN-TEMP-411 لمعرفة هل فُتح المسار فعلًا، ثم راجع مصادقة القاعدة والاستعلامات لتحديد الأثر. نجاح اتصال TCP لا يعني نجاح الدخول إلى البيانات، وفشل الدخول لا يلغي خلل التقسيم.",
    decisionQuestion: "كيف تعيد حد التقسيم وتقيّم النشاط الذي مرّ عبر الاستثناء؟",
    decisions: [
      {
        id: "restore-boundary-preserve-and-scope",
        label:
          "حفظ مراجعة القاعدة وسجلات التدفقات ثم تعطيل الاستثناء غير المعتمد ومعالجة الجلسات المفتوحة وفق الإجراء، والتحقق من المسارات المسموحة، وفحص نشاط المصدر وإصلاح تطبيق انتهاء القواعد",
        outcome:
          "قرار صحيح. تعيد حدود الشبكة مع الانتباه إلى أن الجلسات القائمة قد لا تُقطع بمجرد تعديل القاعدة. حفظ التدفقات وتوسيع مراجعة المصادقة والاستعلامات يقيّمان الأثر، ومعالجة آلية الانتهاء والموافقات تمنع بقاء استثناء مشابه لاحقًا.",
        points: 40,
      },
      {
        id: "disable-rule-without-session-review",
        label: "تعطيل القاعدة فقط وافتراض انتهاء كل الجلسات الحالية دون تحقق أو مراجعة السجلات",
        outcome:
          "إجراء جزئي. قد تمنع اتصالات جديدة، لكن بعض الجدران النارية تحتفظ بحالة الجلسات. يلزم التحقق من الجلسات ومسار التدفق وحفظ أدلة فترة السماح وفحص سبب غياب تطبيق الانتهاء.",
        points: 20,
      },
      {
        id: "extend-temporary-rule",
        label: "تمديد وقت القاعدة المؤقتة لأن مصادقة قاعدة البيانات رفضت محاولة الدخول",
        outcome:
          "إجراء ضعيف. رفض المصادقة لا يجعل الاستثناء الشبكي غير المعتمد مقبولًا. يبقى الحد الذي تنص عليه السياسة متجاوزًا، وقد تتغير نتيجة المصادقة لاحقًا.",
        points: 5,
      },
      {
        id: "wipe-source-without-evidence",
        label: "مسح الجهاز المصدر فورًا وإعلان حدوث تسريب، دون حفظ التدفقات أو فحص طبقة البيانات",
        outcome:
          "قرار خاطئ. تمحو دليلًا مهمًا وتعلن أثرًا لا تدعمه النافذة المعروضة. أعد حد الشبكة واحتوِ المصدر حسب التحقيق، واحفظ الأدلة وحدد الوصول الفعلي قبل وصف نطاق الحادثة.",
        points: 0,
      },
    ],
  },
  {
    id: "INC-1212",
    incidentTitle: "CI Federation Trust Admits an Unapproved Build",
    severity: "HIGH",
    meta: "المستوى: متقدم · Package: training-ledger · Time: 20:17 UTC",
    brief:
      "رصدت مراجعة سلسلة التوريد نشر حزمة باستخدام دور سحابي مخصص للبناء المعتمد، لكن مصدر المهمة لا يطابق مستودع الإصدار وفرعه المحمي. التوكن صادر فعلًا من مزوّد CI المعروف. اربط شروط الثقة بالهوية الموحدة ومهمة النشر وسجل مصدر الحزمة لتحديد ما تم نشره وما لم يُنشر إلى الإنتاج بعد.",
    logCommand: "supply-review --join oidc,role-audit,ci-job,artifact-provenance package=training-ledger",
    logLines: [
      "20:10:00  baseline  release_policy  package=training-ledger  repository=training-lab/ledger-app  ref=refs/heads/main  environment=release-approved  approved_digest=TRAIN-ARTIFACT-APPROVED",
      "20:12:03  iam-audit  trust_policy  role=PackagePublisher  issuer=https://tokens.ci.example  audience=cloud-token-exchange  allowed_subject=repo:training-lab/*:*  environment_constraint=absent",
      "20:14:05  ci-audit  job_start  job=job-512  repository=training-lab/docs-preview  event=pull_request  ref=refs/pull/31/merge  environment=preview  release_approval=none",
      "20:14:10  token-audit  federation_exchange  session=publish-512  role=PackagePublisher  subject=repo:training-lab/docs-preview:pull_request  issuer_signature=valid  audience=cloud-token-exchange  result=success",
      "20:15:03  registry-audit  artifact_publish  request=pub-512  session=publish-512  package=training-ledger  version=training-candidate  digest=TRAIN-ARTIFACT-UNREVIEWED  result=success",
      "20:15:04  provenance  statement  digest=TRAIN-ARTIFACT-UNREVIEWED  source_repository=training-lab/docs-preview  source_ref=refs/pull/31/merge  ci_job=job-512",
      "20:16:12  change-control  release_lookup  digest=TRAIN-ARTIFACT-UNREVIEWED  approved_release=none",
      "20:17:00  deployment-audit  production_state  running_digest=TRAIN-ARTIFACT-APPROVED  unreviewed_digest_deployed=false",
    ],
    evidenceQuestion: "ما الدليل الأقوى على إساءة نطاق الثقة في هوية البناء الموحدة؟",
    evidenceOptions: [
      {
        id: "broad-subject-to-unapproved-publish",
        label:
          "شرط الثقة الواسع قبل هوية مهمة طلب دمج من مستودع غير مخصص للإصدار، وأنشأت الجلسة نفسها حزمة يخالف مصدرها سياسة الإصدار؛ الحزمة منشورة لكن تشغيلها بالإنتاج غير ظاهر",
        correct: true,
      },
      {
        id: "valid-issuer-means-approved-job",
        label: "التوقيع الصحيح من مزوّد CI المعروف يثبت أن أي مستودع أو فرع يصدر توكنًا مخوّل بنشر هذه الحزمة",
        correct: false,
      },
      {
        id: "registry-publish-means-prod-deploy",
        label: "نجاح نشر الحزمة في السجل يثبت تلقائيًا أن جميع خدمات الإنتاج شغّلتها",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. subject الخاص بالمستودع وطلب الدمج يطابق شرطًا أوسع من السياسة المعتمدة، ثم يُربط session=publish-512 بالنشر وبيان المصدر. صحة جهة الإصدار لا تعني اعتماد كل مصدر بناء. السجل يثبت نشر الحزمة غير المعتمدة، بينما يبيّن تدقيق الإنتاج استمرار البصمة المعتمدة.",
    evidenceFeedbackIncorrect:
      "✗ تحقّق من شروط المصدر بعد صحة التوقيع: المستودع والفرع والبيئة والموافقة. اربط subject بجلسة النشر ثم ببصمة الحزمة وبيان المصدر، وافصل وجود الحزمة في السجل عن تشغيلها في الإنتاج.",
    decisionQuestion: "كيف تحتوي مسار النشر وتعيد الثقة إلى مصدر بناء معتمد؟",
    decisions: [
      {
        id: "restrict-trust-revoke-quarantine-rebuild",
        label:
          "حفظ التوكنات المنقّحة وسجلات المهمة والمصدر، وتضييق الثقة إلى المستودع والفرع والبيئة المعتمدة وإبطال الجلسة المتأثرة، ثم حجز بصمة الحزمة غير المراجعة والتحقق من المستهلكين وإعادة البناء من مصدر معتمد",
        outcome:
          "قرار صحيح. تعالج شروط الثقة سبب قبول الهوية وتمنع جلسات جديدة غير مخوّلة، بينما تعالج الجلسة القائمة والحزمة المنشورة الأثر الحالي. يُفحص اعتماد المستهلكين على البصمة مع الحفاظ على الخدمة التي ما زالت تشغّل الإصدار المعتمد، ثم يُتحقق من المصدر والموافقة قبل إعادة النشر.",
        points: 40,
      },
      {
        id: "quarantine-artifact-only",
        label: "حجز هذه البصمة من الحزمة فقط مع إبقاء شرط الثقة والجلسة المؤقتة كما هما",
        outcome:
          "إجراء جزئي. قللت احتمال استهلاك الحزمة المعروفة، لكن الهوية الحالية أو مهمة أخرى من النطاق الواسع قد تنشر حزمة بديلة. يلزم تضييق الثقة ومعالجة الجلسة وفحص بقية عمليات النشر المرتبطة.",
        points: 20,
      },
      {
        id: "rotate-unrelated-static-key",
        label: "تدوير مفتاح وصول ثابت قديم فقط، لأن كل نشر سحابي لا بد أن يستخدم ذلك المفتاح",
        outcome:
          "إجراء محدود. السجلات تعرض تبادل توكن موحد وجلسة مؤقتة، ولا تربط العملية بالمفتاح القديم. تدويره لا يغيّر شرط الثقة الذي قبل subject غير المعتمد ولا يضمن إبطال الجلسة القائمة.",
        points: 5,
      },
      {
        id: "allow-known-ci-issuer",
        label: "اعتماد الحزمة لأن مزوّد CI وقّع التوكن ونجحت عملية النشر دون خطأ",
        outcome:
          "قرار خاطئ. التوقيع يثبت جهة إصدار التوكن، لا موافقة المؤسسة على المستودع أو الفرع الذي طلب الصلاحية. نجاح النشر يثبت أن السياسة الواسعة سمحت بالعملية، وليس أن مصدر الحزمة موثوق.",
        points: 0,
      },
    ],
  },
];
