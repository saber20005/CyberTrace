import { useEffect, useState } from "react";
import "./Admin.css";

const VIEWS = [
  { id: "overview", label: "الملخص" },
  { id: "content", label: "محتوى التدريب" },
  { id: "access", label: "الأمان والجاهزية" },
];
const EMPTY = { uid: null, state: "checking", data: null };
const capabilityLabels = [
  ["userTotals", "إحصائيات المستخدمين", "لا توجد إحصائيات تجميعية موثوقة بعد"],
  ["investigationOutcomes", "نتائج التحقيقات", "نتائج التدريب المحلية غير مؤهلة للتحليل الرسمي"],
  ["revenue", "الإيرادات والاشتراكات", "لم يُربط مصدر محاسبي موثوق"],
  ["auditEvents", "سجل إجراءات الإدارة", "لا توجد خدمة تدقيق خادمية معتمدة"],
  ["revocationAwareAdmin", "التحقق من إلغاء الجلسات", "يتحقق الخادم من الجلسات الملغاة والحسابات المعطّلة وصلاحية الإدارة الحالية"],
];

export default function Admin({ user, onHome }) {
  const [lookup, setLookup] = useState(EMPTY);
  const [refresh, setRefresh] = useState(0);
  const [view, setView] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const currentUid = user?.uid ?? null;
  const state = !currentUid ? "signed-out" : lookup.uid === currentUid ? lookup.state : "checking";
  const data = state === "ready" ? lookup.data : null;

  useEffect(() => {
    if (!user?.uid) return undefined;
    const controller = new AbortController();
    let active = true;
    const uid = user.uid;
    async function load() {
      try {
        // The browser claim alone never authorizes the dashboard; the API
        // independently verifies token signature, audience and admin claim.
        const token = await user.getIdToken(true);
        if (!active) return;
        const response = await fetch("/api/admin/summary", {
          method: "GET",
          headers: { Authorization: "Bearer " + token },
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!active) return;
        if (response.status === 401 || response.status === 403) {
          setLookup({ uid, state: response.status === 403 ? "forbidden" : "expired", data: null });
          return;
        }
        if (!response.ok) throw new Error("server_unavailable");
        const payload = await response.json();
        const catalog = payload?.catalog;
        if (payload?.status !== "catalog_only" || payload.metrics !== null ||
            !Number.isSafeInteger(catalog?.cases) || !Array.isArray(catalog?.categories) ||
            !Array.isArray(catalog?.difficulties) || !payload.availability) {
          throw new Error("unexpected_payload");
        }
        if (active) setLookup({ uid, state: "ready", data: payload });
      } catch (error) {
        if (active && error.name !== "AbortError") setLookup({ uid, state: "error", data: null });
      }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [user, refresh]);

  const catalog = data?.catalog;
  const categories = catalog?.categories ?? [];
  const shownCategories = selectedCategory === "all"
    ? categories : categories.filter(item => item.id === selectedCategory);
  const integrity = catalog?.integrity;
  const healthyCatalog = integrity && Object.values(integrity).every(Boolean);

  return <main className="admin-page" dir="rtl">
    <header className="admin-header">
      <div className="admin-brand"><strong>CYBERTRACE</strong><span>ADMIN / OPERATIONS</span></div>
      <button type="button" onClick={onHome}>العودة للرئيسية</button>
    </header>
    <div className="admin-layout">
      <section className="admin-panel" aria-labelledby="admin-title">
        <div className="admin-intro">
          <span className="admin-eyebrow">CONTROL CENTER / READ ONLY</span>
          <h1 id="admin-title">مركز إدارة CyberTrace</h1>
          <p>معلومات من مصدر التدريب المعتمد، دون عرض نتائج أشخاص أو تقديرات غير موثّقة.</p>
        </div>

        {state === "checking" && <p className="admin-feedback" role="status">جارٍ التحقق من صلاحية الإدارة لدى الخادم...</p>}
        {state === "signed-out" && <p className="admin-feedback" role="alert">سجّل الدخول بحساب إداري مخوّل لعرض هذه الصفحة.</p>}
        {state === "forbidden" && <p className="admin-feedback" role="alert">الوصول مرفوض من الخادم. هذا الحساب لا يحمل صلاحية الإدارة.</p>}
        {state === "expired" && <p className="admin-feedback" role="alert">انتهت صلاحية التحقق أو رُفض الرمز. أعد تسجيل الدخول.</p>}
        {state === "error" && <p className="admin-feedback" role="alert">تعذّر التحقق من واجهة الإدارة. لا تُعرض بيانات مخزنة أو افتراضية بدل النتيجة الخادمية.</p>}
        {(state === "error" || state === "expired") && <button type="button" className="admin-retry" onClick={() => { setLookup(EMPTY); setRefresh(n => n + 1); }}>إعادة التحقق</button>}

        {data && <>
          <nav className="admin-tabs" aria-label="أقسام إدارة CyberTrace">
            {VIEWS.map(item => <button type="button" key={item.id}
              aria-current={view === item.id ? "page" : undefined}
              className={view === item.id ? "active" : ""}
              onClick={() => setView(item.id)}>{item.label}</button>)}
          </nav>
          {view === "overview" && <>
            <div className="admin-kpis" aria-label="ملخص مصدر المحتوى">
              <article><span>التحقيقات المنشورة</span><strong>{catalog.cases}</strong><small>من ملف التحقيقات المعتمد</small></article>
              <article><span>مجالات التحقيق</span><strong>{categories.length}</strong><small>تصنيفات محتوى، لا مستخدمون</small></article>
              <article><span>سلامة فهرس المحتوى</span><strong className={healthyCatalog ? "admin-positive" : "admin-caution"}>{healthyCatalog ? "سليم" : "بحاجة لمراجعة"}</strong><small>تفرّد المعرّفات وتغطية التصنيفات</small></article>
              <article><span>المستخدمون النشطون</span><strong>غير متاح</strong><small>لا توجد بيانات خادمية معتمدة</small></article>
            </div>
            <div className="admin-sections">
              <section className="admin-surface" aria-labelledby="admin-categories">
                <h2 id="admin-categories">التحقيقات حسب المجال</h2>
                <div className="admin-bars">
                  {categories.map(item => <div className="admin-bar" key={item.id}>
                    <div><span>{item.label}</span><strong>{item.count}</strong></div>
                    <progress aria-label={"عدد تحقيقات " + item.label} max={Math.max(1, catalog.cases)} value={item.count}>{item.count}</progress>
                  </div>)}
                </div>
              </section>
              <section className="admin-surface" aria-labelledby="admin-limitations">
                <h2 id="admin-limitations">حدود البيانات الحالية</h2>
                <p>لا تتوفر أعداد مستخدمين، إيرادات، درجات موثّقة أو سجل تدقيق خادمي. لن نعرض أرقامًا مفترضة لتبدو اللوحة مكتملة.</p>
                <p className="admin-warning">يجري الخادم فحص الجلسات الملغاة وصلاحية الإدارة الحالية قبل إعادة هذه البيانات. جميع عمليات تعديل حسابات المستخدمين محجوبة.</p>
              </section>
            </div>
          </>}
          {view === "content" && <section className="admin-surface" aria-labelledby="admin-content-title">
            <div className="admin-section-head">
              <div><h2 id="admin-content-title">تغطية مكتبة التدريب</h2><p>بيانات مشتقة من الفهرس العام عند بناء الخادم، وليست سجل نشاط المستخدمين.</p></div>
              <label className="admin-filter">المجال
                <select value={selectedCategory} onChange={event => setSelectedCategory(event.target.value)}>
                  <option value="all">جميع المجالات</option>
                  {categories.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            </div>
            <div className="admin-list">
              {shownCategories.map(item => <div key={item.id}><span>{item.label}</span><strong>{item.count} تحقيق</strong></div>)}
            </div>
            <h3>توزيع مستوى الصعوبة</h3>
            <div className="admin-list">
              {catalog.difficulties.map(item => <div key={item.id}><span>{item.label}</span><strong>{item.count} تحقيق</strong></div>)}
            </div>
          </section>}
          {view === "access" && <section className="admin-surface" aria-labelledby="admin-access-title">
            <h2 id="admin-access-title">الوصول والخدمات</h2>
            <div className="admin-list">
              <div><span>صلاحية قراءة ملخص الإدارة</span><strong className="admin-positive">تحقّق خادمي</strong></div>
              {capabilityLabels.map(([key, name, description]) => <div key={key}>
                <span>{name}<small>{description}</small></span><strong>{data.availability?.[key] === "enabled" ? "مفعّل" : data.availability?.[key] === "not_enabled" ? "غير مفعّل" : "غير متاح"}</strong>
              </div>)}
            </div>
            <p className="admin-warning">هذا المركز للقراءة فقط. لا تنشر صلاحيات إدارة أو بيانات حسابات أو مفاتيح Firebase في واجهة المتصفح.</p>
          </section>}
          <footer className="admin-foot">
            <span>المصدر: فهرس التحقيقات في المستودع — وليس Firebase Analytics</span>
            <button type="button" className="admin-retry" onClick={() => { setLookup(EMPTY); setRefresh(n => n + 1); }}>تحديث البيانات من الخادم</button>
          </footer>
        </>}
      </section>
    </div>
  </main>;
}
