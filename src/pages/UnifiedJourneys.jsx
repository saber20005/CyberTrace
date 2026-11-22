import {SUITE_PATHWAYS,suiteStepURL,localJourneyProgress} from "../data/unifiedPathways.js";
import {getCaseResults} from "../utils/caseProgress.js";
import "./UnifiedJourneys.css";
export default function UnifiedJourneys({onHome,onLibrary}){
 const results=getCaseResults();
 const isDone=id=>Object.hasOwn(results,id);
 return <main className="ct-suite-page" dir="rtl">
  <header className="ct-suite-top"><button type="button" onClick={onHome}>CyberTrace / الرئيسية</button><button type="button" onClick={onLibrary}>مكتبة التحقيقات</button></header>
  <section className="ct-suite-intro" aria-labelledby="ct-suite-title">
   <span>CYBERTRACE × BLACKBOX / LEARNING PATHS</span>
   <h1 id="ct-suite-title">المسارات التعليمية المشتركة</h1>
   <p>أربع رحلات من تحقيق حادثة إلى تدريب تطبيقي على BLACKBOX، ثم تحقيق وتطبيق أعمق. يمكنك البدء بأي خطوة؛ الترتيب مقترح للتعلم وليس شرطًا لفتح التدريب.</p>
   <p className="ct-suite-trust" role="note">الإنجاز الظاهر هنا نتيجة تحقيق مسجلة داخل CyberTrace لهذا الحساب، وغير موثّقة خادميًا. تقدم BLACKBOX لا يُقرأ هنا؛ لا تُنقل حسابات أو نقاط أو بيانات شخصية عبر الروابط، ولا يحق لك شهادة موثّقة بمجرد إتمام هذه الخطوات.</p>
  </section>
  <div className="ct-suite-grid">{SUITE_PATHWAYS.map(path=>{
   const summary=localJourneyProgress(path,"cybertrace",isDone);
   return <article className="ct-suite-card" key={path.id}>
    <span className="ct-suite-status">تحقيقات CyberTrace المسجلة: {summary.done} / {summary.total}</span>
    <h2>{path.title}</h2><p>{path.description}</p>
    <progress max={summary.total} value={summary.done} aria-label={"تقدم تحقيقات "+path.title}>{summary.done} / {summary.total}</progress>
    <ol>{path.steps.map((step,i)=><li key={step.site+step.id+i}>
      <strong>{i+1}. {step.title}</strong>
      <small>{step.site==="cybertrace"?(isDone(step.id)?"CyberTrace: نتيجة تدريب محفوظة محليًا":"CyberTrace: لا توجد نتيجة تدريب مسجلة"):"BLACKBOX: حالة الإكمال غير معروفة هنا"}</small>
      <a href={suiteStepURL(step)} target={step.site==="blackbox"?"_blank":undefined} rel={step.site==="blackbox"?"noopener noreferrer":undefined}>فتح الخطوة ←</a>
    </li>)}</ol>
   </article>;
  })}</div>
  <p className="ct-suite-footer">لعرض تقدّم مختبر BLACKBOX افتح <a href="https://blackboxlab.dev/?view=journeys" target="_blank" rel="noopener noreferrer">مركز BLACKBOX المقابل</a>.</p>
 </main>;
}
