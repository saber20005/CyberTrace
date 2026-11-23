import { useState } from "react";
import { applyUIPreferences, applyUIPreset, DEFAULT_UI_PREFERENCES, readUIPreferences, saveUIPreferences, UI_PRESETS } from "../utils/uiPreferences.js";
import "./Settings.css";

const THEMES=[
  {id:"dark",name:"Signature",hint:"ذهبي داكن",color:"#c58d56",bg:"#19171c"},
  {id:"midnight",name:"Midnight",hint:"أزرق عميق",color:"#62c7f0",bg:"#101d34"},
  {id:"light",name:"Daylight",hint:"قراءة فاتحة",color:"#5075a3",bg:"#edf2f8"},
  {id:"gold",name:"Royal Gold",hint:"الذهبي الملكي",color:"#EBB84A",bg:"linear-gradient(135deg,#5A4A0D,#7A5E12,#CC961F)"},
];
const ACCENTS=[
  {id:"brand",name:"الذهبي",color:"#d5a56c"},
  {id:"cyan",name:"السيان",color:"#38c5e8"},
  {id:"violet",name:"البنفسجي",color:"#ad96ff"},
];
const OPTIONS=[
  {key:"textSize",title:"حجم النص",choices:[["normal","عادي"],["large","كبير"],["xlarge","كبير جدًا"]]},
  {key:"density",title:"كثافة العناصر",choices:[["comfortable","مريحة"],["compact","مدمجة"]]},
  {key:"contrast",title:"التباين",choices:[["standard","قياسي"],["high","مرتفع"]]},
  {key:"motion",title:"الحركة",choices:[["system","حسب الجهاز"],["reduce","تقليل الحركة"]]},
];
const LEVELS=[["unset","غير محدد"],["beginner","مبتدئ"],["intermediate","متوسط"],["advanced","متقدم"]];
function SelectSetting({name,value,options,onChange}){
 return <label className="ct-studio-select"><span>{name}</span><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>;
}
export default function Settings({onHome}){
 const [settings,setSettings]=useState(readUIPreferences);
 const [message,setMessage]=useState("");
 function apply(next,text){
  const safe=applyUIPreferences(next);
  setSettings(safe);
  setMessage(saveUIPreferences(safe)?text:"تغيّر العرض لهذه الجلسة فقط؛ المتصفح منع حفظ الإعدادات.");
 }
 const choose=(key,value)=>apply({...settings,[key]:value},"تم تطبيق التغيير وحفظه على هذا الجهاز.");
 const reset=()=>apply(DEFAULT_UI_PREFERENCES,"تمت استعادة الهوية الافتراضية.");
 const selectedPreset=UI_PRESETS.find(p=>["theme","accent","density","motion","contrast","textSize"].every(key=>p[key]===settings[key]))?.id;
 return <main className="ct-studio" dir="rtl">
  <div className="ct-studio-header"><div className="ct-studio-mark"><span className="ct-studio-mark-icon" aria-hidden="true">◈</span><span>CYBERTRACE <small>/ EXPERIENCE STUDIO</small></span></div><button className="ct-studio-back" type="button" onClick={onHome}>العودة للرئيسية</button></div>
  <div className="ct-studio-shell">
   <div className="ct-studio-heading"><div><p className="ct-studio-eyebrow">CONTROL YOUR ENVIRONMENT · 02 / 2026</p><h1>استوديو تخصيص التجربة</h1><p>اختر هوية العمل، واضبط سرعة القراءة وكثافة التحقيقات. التغييرات تُطبّق مباشرة على هذا الجهاز.</p></div><span className="ct-studio-local"><span aria-hidden="true">●</span> تخصيص محلي وآمن</span></div>
   <div className="ct-studio-body">
    <div className="ct-studio-controls">
     <section className="ct-studio-panel" aria-labelledby="ct-studio-presets"><div className="ct-studio-panel-top"><div><span className="ct-studio-step">01 / QUICK START</span><h2 id="ct-studio-presets">أنماط جاهزة</h2></div><p>اختيار واحد يضبط عدة خيارات</p></div>
      <div className="ct-studio-presets">{UI_PRESETS.map(p=><button type="button" key={p.id} aria-pressed={selectedPreset===p.id} className={"ct-studio-preset "+(selectedPreset===p.id?"selected":"")} onClick={()=>apply(applyUIPreset(settings,p.id),"تم تطبيق نمط "+p.title+".")}><span className={"ct-studio-preset-art "+p.id} aria-hidden="true"><i/><i/><i/></span><strong>{p.title}</strong><small>{p.description}</small></button>)}</div>
     </section>
     <section className="ct-studio-panel" aria-labelledby="ct-studio-identity"><div className="ct-studio-panel-top"><div><span className="ct-studio-step">02 / VISUAL IDENTITY</span><h2 id="ct-studio-identity">هوية الواجهة</h2></div></div>
      <div className="ct-studio-theme-grid" role="group" aria-label="شكل الواجهة">{THEMES.map(t=><button key={t.id} type="button" className={"ct-studio-theme "+(settings.theme===t.id?"selected":"")} aria-pressed={settings.theme===t.id} onClick={()=>choose("theme",t.id)}><span className="ct-studio-theme-art" style={{background:t.bg,"--theme-dot":t.color}} aria-hidden="true"><span/><i/><i/></span><strong>{t.name}</strong><small>{t.hint}</small></button>)}</div>
      {settings.theme==="gold"&&<p className="ct-studio-gold-note">الذهبي الملكي يستخدم درجاته الذهبية السبعة دون خلطها بالسيان أو البنفسجي. اختر مظهرًا آخر لتغيير لون الإبراز.</p>}
      <span className="ct-studio-label" id="ct-studio-accent-label">لون الإبراز</span><div role="group" aria-labelledby="ct-studio-accent-label" className="ct-studio-swatches">{ACCENTS.map(a=><button key={a.id} type="button" aria-pressed={settings.accent===a.id} className={"ct-studio-swatch "+(settings.accent===a.id?"selected":"")} disabled={settings.theme==="gold"&&a.id!=="brand"} onClick={()=>choose("accent",a.id)}><span style={{background:a.color}} aria-hidden="true"/>{a.name}</button>)}</div>
     </section>
     <section className="ct-studio-panel" aria-labelledby="ct-studio-ergonomics"><div className="ct-studio-panel-top"><div><span className="ct-studio-step">03 / WORKFLOW</span><h2 id="ct-studio-ergonomics">راحة القراءة والعمل</h2></div></div><div className="ct-studio-options">{OPTIONS.map(row=><div key={row.key} className="ct-studio-option"><span>{row.title}</span><div className="ct-studio-segments" role="group" aria-label={row.title}>{row.choices.map(([value,label])=><button key={value} type="button" aria-pressed={settings[row.key]===value} onClick={()=>choose(row.key,value)}>{label}</button>)}</div></div>)}</div>
     </section>
     <section className="ct-studio-panel" aria-labelledby="ct-studio-experience"><div className="ct-studio-panel-top"><div><span className="ct-studio-step">04 / PERSONAL SPACE</span><h2 id="ct-studio-experience">مساحة المحقق</h2></div></div>
      <SelectSetting name="مستوى التعلم الذي اخترته لنفسك" value={settings.level} options={LEVELS} onChange={v=>choose("level",v)}/>
      <p className="ct-studio-description">هذا تفضيل شخصي فقط؛ لا يُغيّر صلاحياتك أو النقاط أو أهلية الشهادات.</p>
      <div className="ct-studio-privacy"><strong>لا توجد مزامنة لهذه التفضيلات</strong><p>تُحفظ في هذا المتصفح وحده. لن نُغيّر تقدم التحقيقات، Firebase أو ربط BLACKBOX.</p></div>
     </section>
    </div>
    <aside className="ct-studio-preview-column" aria-label="معاينة الإعدادات"><div className="ct-studio-preview-sticky"><div className="ct-studio-preview-label"><div><span>LIVE PREVIEW</span><h2>المعاينة المباشرة</h2></div><span className="ct-studio-live"><i/> مباشر</span></div>
     <div className="ct-studio-preview">
      <div className="ct-studio-preview-top"><strong>CYBERTRACE <b>◈</b></strong><span>DEMO / PREVIEW</span></div>
      <div className="ct-studio-preview-content"><span className="ct-studio-preview-caption">INCIDENT ANALYSIS · DEMO</span><h3>التحقيق في حالة أمنية</h3><p>هذه بيانات معاينة فقط، وليست تحقيقًا حقيقيًا أو نتيجة محفوظة.</p><div className="ct-studio-preview-metrics"><div><small>قضايا</small><strong>28</strong></div><div><small>مستوى</small><strong>02</strong></div><div><small>حالة</small><strong>تجريبي</strong></div></div>
       <div className="ct-studio-preview-event"><span className="ct-studio-preview-indicator"/><div><strong>تحليل سجل نشاط</strong><small>سجل تجريبي · لا توجد كتابة على الحساب</small></div><span className="ct-studio-preview-arrow">◂</span></div>
       <div className="ct-studio-preview-actions"><span>متابعة التحليل</span><span>عرض الأدلة</span></div>
      </div>
     </div>
     <div className="ct-studio-preview-footer"><p role="status" aria-live="polite">{message||"جرّب أي اختيار لمشاهدة أثره فورًا."}</p><button type="button" onClick={reset}>استعادة الإعدادات الأصلية</button></div>
    </div></aside>
   </div>
  </div>
 </main>;
}
