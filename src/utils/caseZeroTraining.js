// Pure, deterministic training-only interpretation of the fictional Case Zero.
// Never touch Auth, Firestore, the actual SOC queue, XP, or certificates.
export const caseZeroAssessment = state => {
 const opened = Array.isArray(state.opened)?state.opened:[];
 const correlated = opened.includes("EV-01") && opened.includes("EV-02");
 const filed = state.filed === true;
 const triaged = Boolean(state.triage);
 const tasks = [opened.length>=2,filed,triaged];
 const score = tasks.filter(Boolean).length;
 const next = opened.length<2
  ? "افتح سجلين على الأقل وقارن توقيتهما ومصدرهما."
  : !correlated
    ? "راجع EV-01 وEV-02 معًا حتى تتضح سلسلة الإخفاقات والنجاح."
    : !filed
      ? "وثّق الاستنتاج والخطوة التالية قبل الانتقال إلى اتخاذ القرار."
      : !triaged
        ? "اختر تنبيهًا في مكتب SOC وحدد إجراءً مع مبرراته."
        : state.selectedAlert!=="SOC-101"
          ? "جرّب تنبيه الهوية SOC-101 لربط الاستجابة بالتحقيق."
          : "ابدأ حالة تدريب فعلية من المكتبة، وتحقق من الأدلة قبل أي تصعيد.";
 return {score,correlated,filingComplete:filed,triaged,next,summary:score===3?"اكتملت خطوات المحاكاة الثلاث. راجع جودة القرار وسياق الأدلة.":score===0?"لم تبدأ معالجة الحالة بعد.":"أنجزت بعض الخطوات؛ التقرير يعرض ما تحتاج إكماله."};
};
export const caseZeroTriageFeedback = (state,id,action) => {
 const ready = caseZeroAssessment(state);
 if(id==="SOC-101" && action==="escalate")
  return ready.correlated && ready.filingComplete
   ? "تصعيد مبرر مبدئيًا: ربطتَ الإخفاقات بالجلسة الناجحة ووثقت فرضية تتطلب التحقق من صاحب الحساب."
   : "هذا مؤشر يستحق مراجعة عاجلة، لكن الاستنتاج غير مكتمل؛ افتح EV-01 وEV-02 ووثّق الأدلة قبل الجزم.";
 if(id==="SOC-101")
  return "قد يتطلب ارتباط الإخفاقات بالنجاح استجابة أسرع؛ راجع خطر التأخير وحدّد خطة للتحقق.";
 if(action==="escalate")
  return "تصعيد غير مدعوم بالأدلة الحالية؛ قد يرفع الإنذارات الكاذبة. تحقق من الصيانة والسياق أولًا.";
 return "مراجعة اعتيادية مع توثيق السياق ملائمة لهذا التنبيه التدريبي.";
};
