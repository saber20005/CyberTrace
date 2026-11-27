import {useEffect} from "react";
import {SUITE_PATHWAYS,suiteStepURL} from "../data/unifiedPathways.js";
import {getCaseResults,getCompletedCaseIds} from "../utils/caseProgress.js";
import {cyberJourneyProgress} from "../utils/suiteJourneyProgress.js";
import {useBlackBox} from "../blackbox/useBlackBox.js";
import "./UnifiedJourneys.css";

export default function UnifiedJourneys({embedded=false,onHome,onLibrary}) {
 const bridge=useBlackBox();
 const watchPracticalProgress=bridge.watchPracticalProgress;
 useEffect(()=>watchPracticalProgress(),[watchPracticalProgress]);
 const results=getCaseResults();
 const completed=new Set(getCompletedCaseIds());
 const statusOf=id=>Object.hasOwn(results,id)?"scored":completed.has(id)?"historical":"not-started";
 const sample=cyberJourneyProgress(SUITE_PATHWAYS[0],statusOf,bridge.status);
 const remoteMessage=!bridge.status.user?"اربط حساب BLACKBOX لعرض تقدم التدريب العملي مع تحقيقات هذا الحساب.":sample.remotePhase==="error"?"تعذّر تحميل تقدم BLACKBOX. خطواته غير معروفة الآن؛ نتائج CyberTrace محفوظة.":sample.remotePhase==="unknown"?"لا تتوفر نسخة مؤكدة من تقدم BLACKBOX أثناء الانقطاع. افتحه أو أعد المحاولة عند عودة الاتصال.":!sample.remoteKnown?"جارٍ تحميل تقدم حساب BLACKBOX المرتبط…":sample.fromCache?"تقدم BLACKBOX من نسخة محفوظة؛ قد لا يتضمن أحدث تعديلاتك.":"تقدم BLACKBOX من الحساب المرتبط، وتحقيقات CyberTrace من الحساب الحالي.";
 const stepLabel=step=>step.site==="cybertrace"?(step.status==="scored"?"CyberTrace: نتيجة محلية محفوظة (غير موثّقة)":step.status==="historical"?"CyberTrace: إكمال سابق محفوظ دون درجة":"CyberTrace: لا يوجد إكمال مسجّل"):(step.status==="unknown"?"BLACKBOX: حالة الإكمال غير معروفة هنا":step.done?"BLACKBOX: جميع مراحل المسار مؤكدة من حسابك":"BLACKBOX: لم تؤكد جميع مراحل المسار بعد");
 return <main className="ct-suite-page" dir="rtl">
  {!embedded&&<header className="ct-suite-top"><button type="button" onClick={onHome}>CyberTrace / الرئيسية</button><button type="button" onClick={onLibrary}>مكتبة التحقيقات</button></header>}
  <section className="ct-suite-intro" aria-labelledby="ct-suite-title">
   <span>CYBERTRACE × BLACKBOX / LEARNING PATHS</span>
   <h1 id="ct-suite-title">المسارات التعليمية المشتركة</h1>
   <p>أربع رحلات تجمع التحقيق والتطبيق. راجع الخطوات المسجّلة، ثم تابع الخطوة التالية المقترحة؛ يمكنك فتح أي خطوة دون انتظار ترتيب إلزامي.</p>
   <div className="ct-suite-connection" role="status"><p>{remoteMessage}</p>{!bridge.status.user&&bridge.status.enabled&&<button type="button" onClick={bridge.openLink}>ربط حساب BLACKBOX</button>}{bridge.status.user&&["error","unknown"].includes(sample.remotePhase)&&<button type="button" onClick={bridge.retryPracticalProgress}>إعادة تحميل التقدم</button>}</div>
   <details className="ct-suite-provenance"><summary>مصدر التقدم وحدوده</summary><p>يعرض هذا المركز نتائج التدريب في حساب CyberTrace الحالي ومراحل حساب BLACKBOX الذي اخترت ربطه. يقرأ المركز نسخة تقدم حساب BLACKBOX ويستخدم حالة اكتمال المراحل؛ لا يعرض ملاحظات المختبر أو ينسخها إلى سجل التحقيقات. الإنجاز تدريبي غير موثّق خادميًا، والتحقيق لا يؤكّد تنفيذ المختبر العملي. روابط الخطوات لا تحمل بيانات حسابك أو نقاطه.</p></details>
  </section>
  <div className="ct-suite-grid">{SUITE_PATHWAYS.map((path,index)=>{
   const summary=cyberJourneyProgress(path,statusOf,bridge.status);
   return <details className="ct-suite-card" key={path.id} open={index===0}>
    <summary className="ct-suite-card-summary">
     <span className="ct-suite-status">خطوات مسجّلة: <bdi dir="ltr">{summary.done} / {summary.total}</bdi>{summary.fromCache?" · نسخة محفوظة":""}</span>
     <h2>{path.title}</h2>
     <progress max={summary.total} value={summary.done} aria-label={"تقدم رحلة "+path.title}>{summary.done} / {summary.total}</progress>
     <small>تحقيقات CyberTrace: <bdi dir="ltr">{summary.localDone} / 2</bdi>{summary.unknown?` · ${summary.unknown} خطوات BLACKBOX غير معروفة`:""}</small>
     <span className="ct-suite-expand" aria-hidden="true">⌄ عرض الخطوات</span>
    </summary>
    <div className="ct-suite-card-body">
     <p>{path.description}</p>
     <div className="ct-suite-next" aria-label={"الخطوة التالية في "+path.title}>{summary.next?<><strong>{summary.next.known?"خطوتك التالية":"تحقّق من هذه الخطوة"}</strong><a href={suiteStepURL(summary.next)} target={summary.next.site==="blackbox"?"_blank":undefined} rel={summary.next.site==="blackbox"?"noopener noreferrer":undefined}>{summary.next.title} ←</a></>:<strong>اكتملت الخطوات المسجّلة لهذه الرحلة. يمكنك مراجعتها أدناه.</strong>}</div>
     <ol>{summary.steps.map((step,i)=><li key={step.site+step.id+i} data-suite-state={step.status}>
      <strong>{i+1}. {step.title}</strong>
      <small>{stepLabel(step)}</small>
      <a href={suiteStepURL(step)} target={step.site==="blackbox"?"_blank":undefined} rel={step.site==="blackbox"?"noopener noreferrer":undefined}>فتح الخطوة ←</a>
     </li>)}</ol>
    </div>
   </details>;
  })}</div>
  <p className="ct-suite-footer">يمكنك متابعة التدريب في <a href="https://blackboxlab.dev/?view=journeys" target="_blank" rel="noopener noreferrer">مركز BLACKBOX المقابل</a>.</p>
 </main>;
}
