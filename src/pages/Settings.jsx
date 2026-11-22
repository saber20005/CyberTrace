import { useState } from "react";
import { applyUIPreferences, readUIPreferences, saveUIPreferences } from "../utils/uiPreferences.js";
import "./Settings.css";

const FIELDS = [
  { key:"theme", label:"مظهر الموقع", options:[
    {value:"dark",label:"ليلي — الهوية الأصلية"},{value:"light",label:"فاتح — للقراءة"},
  ]},
  { key:"textSize", label:"حجم النص", options:[
    {value:"normal",label:"عادي"},{value:"large",label:"أكبر"},
  ]},
  { key:"motion", label:"المؤثرات الحركية", options:[
    {value:"system",label:"حسب إعدادات الجهاز"},{value:"reduce",label:"تقليل الحركة"},
  ]},
  { key:"level", label:"مستواي في التحقيق", options:[
    {value:"unset",label:"لم أحدد بعد"},{value:"beginner",label:"مبتدئ"},{value:"intermediate",label:"متوسط"},{value:"advanced",label:"متقدم"},
  ]},
];

export default function Settings({ onHome }) {
  const [settings, setSettings] = useState(readUIPreferences);
  const [saveStatus, setSaveStatus] = useState("");
  function change(key, value) {
    const next = applyUIPreferences({ ...settings, [key]: value });
    setSettings(next);
    setSaveStatus(saveUIPreferences(next)
      ? "حُفظت تفضيلات العرض على هذا الجهاز."
      : "تعذّر الحفظ في المتصفح؛ ستبقى التغييرات لهذه الجلسة فقط.");
  }
  function reset() {
    const defaults = applyUIPreferences(null);
    setSettings(defaults);
    setSaveStatus(saveUIPreferences(defaults)
      ? "عادت إعدادات العرض الافتراضية."
      : "عادت الإعدادات الافتراضية لهذه الجلسة فقط.");
  }
  return <main className="ct-settings" dir="rtl">
    <header className="ct-settings-header">
      <span className="ct-settings-brand">CYBERTRACE <b>/ PREFERENCES</b></span>
      <button type="button" onClick={onHome}>العودة للرئيسية</button>
    </header>
    <div className="ct-settings-layout">
      <p className="ct-settings-overline">YOUR INVESTIGATION SPACE</p>
      <h1>إعدادات تجربتك</h1>
      <p className="ct-settings-lead">اضبط طريقة عرض CyberTrace دون تغيير هويتك أو نتائج التحقيقات أو المزامنة.</p>
      <div className="ct-settings-grid">
        <section className="ct-settings-panel" aria-label="إعدادات العرض">
          <h2>المظهر وإمكانية الوصول</h2>
          {FIELDS.slice(0,3).map(field => <label className="ct-settings-field" key={field.key}>
            <span>{field.label}</span>
            <select value={settings[field.key]} onChange={e=>change(field.key,e.target.value)}>
              {field.options.map(choice => <option value={choice.value} key={choice.value}>{choice.label}</option>)}
            </select>
          </label>)}
        </section>
        <section className="ct-settings-panel" aria-label="إعداد التعلم">
          <h2>إعداد ملف المحقق — اختياري</h2>
          <p>حدّد مستواك ليسهل عليك ضبط تجربة العرض مستقبلًا. هذا الاختيار لا يغيّر صلاحياتك ولا يثبت مهارة أو يمنح شهادة.</p>
          {FIELDS.slice(3).map(field => <label className="ct-settings-field" key={field.key}>
            <span>{field.label}</span>
            <select value={settings[field.key]} onChange={e=>change(field.key,e.target.value)}>
              {field.options.map(choice => <option value={choice.value} key={choice.value}>{choice.label}</option>)}
            </select>
          </label>)}
          <div className="ct-settings-privacy"><b>خصوصية التفضيلات</b><p>تُحفظ هذه الخيارات محليًا في هذا المتصفح فقط. لا تُرسل إلى Firebase ولا تُزامَن مع BLACKBOX أو حساب آخر.</p></div>
        </section>
      </div>
      <div className="ct-settings-footer">
        <p role="status" aria-live="polite">{saveStatus}</p>
        <button type="button" className="ct-settings-reset" onClick={reset}>استعادة الإعدادات الافتراضية</button>
      </div>
    </div>
  </main>;
}
