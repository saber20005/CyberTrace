import {useState} from "react";
import "./CaseZero.css";

// All records are fictional RFC 5737 examples. This component has no network,
// storage, account, scoring, or training-progress integration.
const EVENTS = [
 {id:"EV-01",time:"08:14",type:"AUTH",title:"ثماني محاولات دخول فاشلة",ip:"198.51.100.25",detail:"ثماني محاولات على حساب demo.analyst خلال دقيقتين. هذه بيانات تدريب مولّدة."},
 {id:"EV-02",time:"08:16",type:"AUTH",title:"تسجيل دخول ناجح من المصدر نفسه",ip:"198.51.100.25",detail:"نجاح بعد سلسلة الإخفاقات من العنوان نفسه. يستدعي الربط والتحقق، ولا يثبت الاختراق وحده."},
 {id:"EV-03",time:"08:19",type:"SESSION",title:"جلسة جديدة من جهاز آخر",ip:"203.0.113.8",detail:"تغيّر المصدر بعد دقائق. يتطلب التحقق من الجهاز والسياق وتوقيت الجلسة قبل التصعيد."}
];
const ALERTS = [
 {id:"SOC-101",title:"إخفاقات دخول متكررة تلتها جلسة ناجحة",tag:"هوية",detail:"مطابقة أحداث EV-01 وEV-02؛ التحقق من صاحب الحساب وسجلات الجهاز مطلوب."},
 {id:"SOC-102",title:"تحديث مجدول على الجهاز التدريبي",tag:"صيانة",detail:"مؤشر منخفض الأولوية إذا طابق نافذة الصيانة الموثقة."},
 {id:"SOC-103",title:"رسالة مراقبة دورية",tag:"معلومات",detail:"لا يوجد مؤشر سلوكي إضافي في هذه العينة."}
];
export const newCaseZero = () => ({opened:[],finding:"",filed:false,selectedAlert:"",triage:"",feedback:""});
export function CaseZero({mode,data,onChange}) {
 const [filter,setFilter]=useState("all");
 const update = patch => onChange(prev => ({...prev,...patch}));
 const opened = data.opened || [];
 if(mode==="investigate") return <section className="ct-case-zero" aria-label="ملف حادثة تدريبية تفاعلي">
  <div className="ct-case-zero-heading"><span className="ct-case-zero-mark">CASE ZERO / CT-DEMO-001</span><span className="ct-case-zero-state">● SIMULATED ONLY</span></div>
  <h3>افتح السجل بنفسك واربط الأحداث</h3>
  <p className="ct-case-zero-sub">هذه ليست أسئلة اختيارية. افحص حدثين أو أكثر، ثم اكتب ما لاحظته والخطوة التي ستتحقق منها.</p>
  <div className="ct-case-zero-filters" role="group" aria-label="تصفية السجل">
   {[["all","الكل"],["AUTH","المصادقة"],["SESSION","الجلسات"]].map(([id,label])=>
    <button key={id} type="button" aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}
  </div>
  <div className="ct-case-zero-log">
   {EVENTS.filter(e=>filter==="all"||e.type===filter).map(e=>
    <button key={e.id} type="button" data-ct-log={e.id} aria-expanded={opened.includes(e.id)}
     onClick={()=>update({opened:opened.includes(e.id)?opened:[...opened,e.id]})}>
     <span className="ct-case-zero-time" dir="ltr">{e.time}</span>
     <span className="ct-case-zero-event"><strong>{e.title}</strong><small dir="ltr">{e.id} • {e.ip}</small>
      {opened.includes(e.id)&&<span className="ct-case-zero-detail">{e.detail}</span>}</span>
     <span aria-hidden="true">{opened.includes(e.id)?"−":"+"}</span>
    </button>)}
  </div>
  <form className="ct-case-zero-report" onSubmit={event=>{event.preventDefault();if(opened.length<2){update({feedback:"افتح حدثين على الأقل قبل التوثيق.",filed:false});return;}if(data.finding.trim().length<25){update({feedback:"أضف تفسيرًا وخطوة تحقق واضحة (25 حرفًا على الأقل).",filed:false});return;}update({filed:true,feedback:"تم حفظ التقرير في هذه المحاكاة فقط. لم تُرسل بيانات ولم يتغير تقدمك."});}}>
   <label htmlFor="ct-case-zero-finding">استنتاج المحلل والخطوة التالية</label>
   <textarea id="ct-case-zero-finding" rows="3" maxLength={550} value={data.finding}
    onChange={event=>update({finding:event.target.value,filed:false,feedback:""})}
    placeholder="لاحظتُ أن... وأحتاج إلى التحقق من..."/>
   <div className="ct-case-zero-report-footer"><small>{opened.length} / 3 أحداث مفتوحة</small><button data-ct-report-submit type="submit">توثيق تحليل تجريبي</button></div>
  </form>
  <p className="ct-case-zero-feedback" role="status" aria-live="polite">{data.feedback||"لا تُحفظ نقاط أو محاولات. التقرير مؤقت داخل الجولة فقط."}</p>
 </section>;
 const alert=ALERTS.find(a=>a.id===data.selectedAlert);
 return <section className="ct-case-zero" aria-label="مكتب فرز تنبيهات تجريبي">
  <div className="ct-case-zero-heading"><span className="ct-case-zero-mark">SOC DESK / LOCAL TRAINING</span><span className="ct-case-zero-state">● OFFLINE DEMO</span></div>
  <h3>افتح تذكرة وقرر الإجراء</h3>
  <p className="ct-case-zero-sub">اعمل مثل المحلل: افتح التنبيه، اقرأ التفاصيل، ثم صعّد أو ضع التذكرة في المراجعة. لا توجد أنظمة متصلة.</p>
  <div className="ct-case-zero-alerts">{ALERTS.map(item=>
   <button key={item.id} type="button" data-ct-alert={item.id} aria-pressed={data.selectedAlert===item.id}
    onClick={()=>update({selectedAlert:item.id,triage:"",feedback:""})}>
    <small>{item.id} · {item.tag}</small><strong>{item.title}</strong>
   </button>)}</div>
  {alert?<div className="ct-case-zero-ticket">
   <span>OPEN TICKET / {alert.id}</span><p>{alert.detail}</p>
   <div className="ct-case-zero-ticket-actions">
    <button type="button" data-ct-triage="escalate" onClick={()=>update({triage:"escalate",feedback:alert.id==="SOC-101"?"تصعيد مبرر مبدئيًا؛ تحقق من سياق الدخول وهوية المستخدم قبل اتهام أي طرف.":"هذا التنبيه لا يتضمن مؤشرات كافية لتصعيد عاجل. تحقق من سياقه أولًا."})}>تصعيد للمراجعة</button>
    <button type="button" data-ct-triage="review" onClick={()=>update({triage:"review",feedback:alert.id==="SOC-101"?"قد يتطلب هذا الترابط استجابة أسرع؛ راجع خطر التأخير.":"وضعه في المراجعة مع التحقق من المصدر مناسب لهذا السيناريو."})}>مراجعة اعتيادية</button>
   </div>
  </div>:<p className="ct-case-zero-empty">اختر تذكرة لفتح تفاصيلها.</p>}
  <p className="ct-case-zero-feedback" role="status" aria-live="polite">{data.feedback||"إجراء التدريب هنا لا ينشئ تذكرة حقيقية ولا يغيّر إحصاءات SOC."}</p>
 </section>;
}
export function CaseZeroBoard({data,step}){
 const evidence=(data.opened||[]).length;
 return <div className="ct-case-zero-board" aria-label="لوحة متابعة الحالة التجريبية">
  <div className="ct-case-zero-board-top"><span>◉ CYBERTRACE / CASE ZERO</span><small>LOCAL DEMO</small></div>
  <strong className="ct-case-zero-board-title">CT-DEMO-001</strong>
  <p>محاولات دخول غير معتادة · سجلات مختبر اصطناعية</p>
  <div className="ct-case-zero-stats"><div><small>السجلات المفتوحة</small><strong>{evidence} / 3</strong></div><div><small>تقرير التحليل</small><strong>{data.filed?"مكتمل":"قيد الإعداد"}</strong></div></div>
  <div className="ct-case-zero-rail"><span className={evidence>=2?"done":""}>01 · فحص الأحداث</span><span className={data.filed?"done":""}>02 · كتابة الاستنتاج</span><span className={data.triage?"done":""}>03 · إجراء SOC</span></div>
  <div className="ct-case-zero-board-bottom">SCENE {String(step).padStart(2,"0")} · 100% SYNTHETIC · NO CLOUD WRITES</div>
 </div>;
}
