import {useEffect, useRef, useState} from "react";
import logo from "../assets/logo.svg";
import "./WelcomeTour.css";

export const TOUR_STEPS = [
  {id:"welcome",eyebrow:"WELCOME / 01",title:"أهلًا بك في غرفة التحقيق",lead:"تعلّم الأمن السيبراني عبر قرارات حقيقية داخل سيناريوهات تدريبية. تعرّف إلى أدوات CyberTrace في جولة قصيرة يمكنك تخطيها في أي وقت.",label:"البداية"},
  {id:"investigate",eyebrow:"INVESTIGATE / 02",title:"افحص الدليل قبل الحكم",lead:"افتح حالة من مكتبة التحقيقات، اقرأ السجلات، اربط المؤشرات واتخذ قرارك. كل سيناريو يشرح سبب الإجابة بدل الاكتفاء بنتيجة صح أو خطأ.",label:"التحقيقات"},
  {id:"soc",eyebrow:"SOC OPERATIONS / 03",title:"فكّر كمحلل مركز عمليات",lead:"مناوبات SOC التدريبية تعلّمك ترتيب التنبيهات وتحديد أولويات الاستجابة. اختبر قرارًا سريعًا هنا دون تشغيل تحقيق أو حفظ نقاط.",label:"مناوبات SOC"},
  {id:"progress",eyebrow:"YOUR LEARNING / 04",title:"افهم تقدّمك وما تعنيه الشهادات",lead:"يمكنك متابعة نتائج تدريب CyberTrace. مزامنة الحساب بين الأجهزة تُفعَّل باختيارك. أما الإفادات التدريبية الحالية فليست شهادات موثّقة خادميًا.",label:"التقدم والشهادات"},
  {id:"next",eyebrow:"YOUR NEXT STEP / 05",title:"اختر طريقك وابدأ",lead:"المسارات المشتركة تساعدك على الانتقال بين تحقيقات CyberTrace وتدريبات BLACKBOX، دون نقل نقاطك أو بياناتك بين الموقعين. ويمكنك تخصيص ألوان الواجهة وحجم النص من الإعدادات.",label:"ابدأ الآن"},
];

const FIRST_CASE_OPTIONS = [
  {id:"timestamps",label:"أقارن توقيت ومصدر جلستي تسجيل الدخول",reason:"صحيح كخطوة أولى: تأكد من التوقيت، عنوان المصدر وسياق الجلسات قبل الاستنتاج.",correct:true},
  {id:"close",label:"أغلق التنبيه فورًا دون مراجعة",reason:"إغلاق التنبيه مبكرًا قد يخفي مؤشرًا مهمًا. راجع الأدلة قبل القرار.",correct:false},
  {id:"names",label:"أكتفي بمراجعة اسم المستخدم",reason:"الاسم وحده لا يفسر اختلاف المكان والوقت. افحص سجل الجلسات.",correct:false},
];
const SOC_CHOICES = [
  {id:"critical",label:"محاولات تسجيل دخول متكررة ثم نجاح غير معتاد",correct:true,reason:"أفضل أولوية أولية هنا: اربط المحاولات الفاشلة بالدخول الناجح وحدد سياقه."},
  {id:"routine",label:"تحديث مجدول معروف على جهاز مختبري",correct:false,reason:"هذا التنبيه قد يكون طبيعيًا بعد التحقق من الجدول؛ ابدأ بالأكثر ارتباطًا بإساءة الاستخدام."},
  {id:"info",label:"رسالة معلومات دورية بلا مؤشرات تهديد",correct:false,reason:"التنبيه المعلوماتي أقل أولوية في هذا المثال؛ راجع المؤشرات ذات الخطورة الأعلى."},
];

function TrainingChoice({title,items,selected,onSelect}) {
  const choice=items.find(item=>item.id===selected);
  return <section className="ct-tour-exercise" aria-label={title}>
    <span className="ct-tour-label">تجربة تعليمية • بيانات افتراضية</span>
    <h3>{title}</h3>
    <div className="ct-tour-choice-list" role="group" aria-label="اختر قرارك">{items.map((item,index)=>
      <button type="button" key={item.id} className="ct-tour-choice" aria-pressed={selected===item.id}
        onClick={()=>onSelect(item.id)}>
        <span className="ct-tour-choice-key" aria-hidden="true">{index+1}</span><span>{item.label}</span>
        {selected===item.id&&<strong aria-hidden="true">✓</strong>}
      </button>)}</div>
    <p className="ct-tour-feedback" role="status" aria-live="polite">{choice
      ? <><strong>{choice.correct?"قرار جيد":"راجع القرار"}:</strong> {choice.reason}</>
      : "اختر أحد القرارات لترى تفسيرًا تدريبيًا مباشرًا. لا تُحفظ نقاط أو محاولات."}</p>
  </section>;
}
export default function WelcomeTour({onSkip,onHome,onLibrary,onSoc,onCertificates,onJourneys,onSettings,onAuth}) {
  const [step,setStep]=useState(0);
  const [caseChoice,setCaseChoice]=useState("");
  const [socChoice,setSocChoice]=useState("");
  const titleRef=useRef(null);
  const current=TOUR_STEPS[step];
  useEffect(()=>{titleRef.current?.focus({preventScroll:true});},[step]);
  const changeStep=next=>{
    setStep(Math.max(0,Math.min(TOUR_STEPS.length-1,next)));
    if(typeof window!=="undefined")window.scrollTo({top:0,behavior:"instant"});
  };
  const last=step===TOUR_STEPS.length-1;
  return <main className="ct-tour" dir="rtl" id="tour-main">
    <header className="ct-tour-header">
      <div className="ct-tour-brand"><img src={logo} alt="" /><div><strong>CYBERTRACE</strong><small>INTERACTIVE ORIENTATION</small></div></div>
      <button type="button" className="ct-tour-skip" onClick={onSkip}>تخطي الجولة <span aria-hidden="true">↗</span></button>
    </header>
    <div className="ct-tour-shell">
      <div className="ct-tour-topline"><span>مسارك إلى التحقيق الرقمي</span><span dir="ltr" aria-label={`الخطوة ${step+1} من ${TOUR_STEPS.length}`}>{String(step+1).padStart(2,"0")} / {String(TOUR_STEPS.length).padStart(2,"0")}</span></div>
      <nav className="ct-tour-progress" aria-label="خطوات الجولة">{TOUR_STEPS.map((item,i)=><button key={item.id} type="button"
        aria-current={step===i?"step":undefined} aria-label={`الخطوة ${i+1}: ${item.label}`}
        className={i===step?"active":i<step?"visited":""} onClick={()=>changeStep(i)}>
        <span className="ct-tour-progress-line"/><small>{item.label}</small>
      </button>)}</nav>
      <div className="ct-tour-stage">
        <section className="ct-tour-copy" aria-labelledby="ct-tour-heading">
          <span className="ct-tour-overline">{current.eyebrow}</span>
          <h1 id="ct-tour-heading" ref={titleRef} tabIndex={-1}>{current.title}</h1>
          <p className="ct-tour-lead">{current.lead}</p>
          {step===0&&<div className="ct-tour-intro-items"><div><span>01</span><strong>حلّل الأدلة</strong><small>تحقيقات تفاعلية بالعربية</small></div><div><span>02</span><strong>اتخذ قرارًا</strong><small>تجارب مناوبات SOC</small></div><div><span>03</span><strong>طوّر معرفتك</strong><small>مسارات تدريب ومراجعات</small></div></div>}
          {step===1&&<TrainingChoice title="تنبيه: دخولان من موقعين بعيدين خلال وقت قصير" items={FIRST_CASE_OPTIONS} selected={caseChoice} onSelect={setCaseChoice}/>}
          {step===2&&<TrainingChoice title="ما التنبيه الذي يستحق الفحص أولًا؟" items={SOC_CHOICES} selected={socChoice} onSelect={setSocChoice}/>}
          {step===3&&<div className="ct-tour-clarity">
            <div><span aria-hidden="true">◈</span><strong>تقدم التحقيقات</strong><p>تُعرض النتائج المحفوظة في نطاق حسابك الحالي؛ لا تُنقل تلقائيًا إلى BLACKBOX.</p></div>
            <div><span aria-hidden="true">⌁</span><strong>المزامنة بين الأجهزة</strong><p>تحتاج تسجيل الدخول وتفعيل مزامنة CyberTrace؛ الجولة نفسها لا تفعّلها.</p></div>
            <div><span aria-hidden="true">▣</span><strong>إفادات التدريب</strong><p>تعرض إكمال التدريب فقط، وليست شهادة خادمية معتمدة حتى يكتمل نظام التحقق.</p></div>
          </div>}
          {step===4&&<div className="ct-tour-destinations">
            <button type="button" onClick={onLibrary}><span>▦</span><strong>افتح مكتبة التحقيقات</strong><small>ابدأ تدريبك الأول</small></button>
            <button type="button" onClick={onSoc}><span>◉</span><strong>جرّب مناوبة SOC</strong><small>رتب التنبيهات وتعلم الاستجابة</small></button>
            <button type="button" onClick={onJourneys}><span>⌁</span><strong>المسارات المشتركة</strong><small>CyberTrace + BLACKBOX</small></button>
            <button type="button" onClick={onSettings}><span>◈</span><strong>خصص المظهر</strong><small>بما في ذلك الذهبي الملكي</small></button>
          </div>}
        </section>
        <aside className="ct-tour-visual" aria-label="رسم توضيحي لمسار التدريب">
          <div className="ct-tour-screen">
            <div className="ct-tour-screen-top"><span>● ● ●</span><strong>CYBERTRACE / TRAINING ENVIRONMENT</strong><span>DEMO</span></div>
            <div className="ct-tour-screen-content">
              <div className="ct-tour-screen-tag">◉ TRAINING SIMULATION</div>
              <h2>{["كل تحقيق يبدأ بسؤال","افهم ما حدث","رتّب إشارات الخطر","التعلم يحتاج دليلًا","المهمة التالية لك"][step]}</h2>
              <div className="ct-tour-wave" aria-hidden="true"><span/><span/><span/><span/><span/><span/><span/></div>
              <div className="ct-tour-visual-grid"><div><small>الوضع</small><strong>SAFE / DEMO</strong></div><div><small>الخطوة</small><strong>{step+1} / 5</strong></div></div>
              <div className="ct-tour-event"><span aria-hidden="true">◈</span><div><strong>{["تعرّف على البيئة","محاولة دخول غير معتادة","أولوية استجابة","توثيق التقدم","مسارك التدريبي"][step]}</strong><small>تفاعل تجريبي فقط — لا يغيّر بياناتك</small></div></div>
            </div>
            <div className="ct-tour-screen-bottom"><span>ANALYZE</span><span>DECIDE</span><span>LEARN</span></div>
          </div>
          <p>جولة تعريفية • لا تُرسل نتائج أو تعدّل بيانات التدريب</p>
        </aside>
      </div>
      <footer className="ct-tour-footer">
        <div className="ct-tour-navigation">
          <button className="ct-tour-prev" type="button" disabled={step===0} onClick={()=>changeStep(step-1)}>السابق</button>
          {last?<button className="ct-tour-next" type="button" onClick={onLibrary}>ابدأ أول تحقيق <span aria-hidden="true">←</span></button>
            :<button className="ct-tour-next" type="button" onClick={()=>changeStep(step+1)}>التالي <span aria-hidden="true">←</span></button>}
        </div>
        {last?<div className="ct-tour-end"><button type="button" onClick={onHome}>الانتقال للرئيسية</button><button type="button" onClick={onAuth}>تسجيل الدخول</button></div>
          :<p>يمكنك تخطي الجولة أو إعادة فتحها لاحقًا من قائمة «المزيد».</p>}
      </footer>
    </div>
  </main>;
}
