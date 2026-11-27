import { useEffect, useState } from "react";
import "./Admin.css";

export default function Admin({ embedded = false, user, onHome }) {
  const [verification, setVerification] = useState({ uid: null, status: "checking" });
  const [summary, setSummary] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const status = !user ? "signed-out" : verification.uid === user.uid ? verification.status : "checking";
  useEffect(() => {
    let active = true;
    if (user) {
      user.getIdTokenResult(true).then(token => {
        if (active) setVerification({ uid: user.uid, status: token.claims.admin === true ? "authorized" : "forbidden" });
      }).catch(() => { if (active) setVerification({ uid: user.uid, status: "error" }); });
    }
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (status !== "authorized" || !user) return;
    const controller = new AbortController();
    const uid = user.uid;
    user.getIdToken().then(token => fetch("/api/admin/auth-metrics", {headers:{Authorization:"Bearer "+token}, cache:"no-store",signal:controller.signal}))
      .then(async response => { if (!response.ok) throw Error("unavailable"); return response.json(); })
      .then(data => {if (!controller.signal.aborted) setSummary({uid,refresh,data});})
      .catch(() => {if (!controller.signal.aborted) setSummary({uid,refresh,data:{status:"error",metrics:null}});});
    return () => controller.abort();
  }, [user,status,refresh]);
  const current = summary?.uid === user?.uid && summary?.refresh === refresh ? summary.data : null;
  const metrics = current?.status === "ready" ? current.metrics : null;
  const cards = [["إجمالي الحسابات","totalAccounts"],["الحسابات الجديدة اليوم","accountsCreatedToday"],["حسابات دخلت اليوم","accountsLastSignedInToday"],["حسابات دخلت خلال 7 أيام","accountsLastSignedIn7d"],["حسابات دخلت خلال 30 يومًا","accountsLastSignedIn30d"],["حسابات مرتبطة بـGoogle","googleLinkedAccounts"],["حسابات مرتبطة بالبريد وكلمة المرور","passwordLinkedAccounts"],["الحسابات المعطّلة","disabledAccounts"],["عمليات الدخول اليوم","loginEventsToday"]];
  return <main className="admin-page" dir="rtl">
    {!embedded && <header className="admin-header"><strong>CyberTrace <span>CONTROL</span></strong><button onClick={onHome}>العودة للرئيسية</button></header>}
    <section className="admin-panel">
      <span className="admin-eyebrow">SECURE ADMINISTRATION</span>
      <h1>لوحة إدارة CyberTrace</h1>
      {status === "checking" && <p role="status">جارٍ التحقق من صلاحيات الحساب عبر Firebase...</p>}
      {status === "signed-out" && <p role="alert">يجب تسجيل الدخول بحساب إداري مخوّل لفتح هذه الصفحة.</p>}
      {status === "forbidden" && <p role="alert">وصول مرفوض: هذا الحساب لا يملك صلاحية الإدارة.</p>}
      {status === "error" && <p role="alert">تعذّر التحقق من الصلاحيات. أعد المحاولة بعد التأكد من الاتصال.</p>}
      {status === "authorized" && <>
        <p>تم التحقق من مطالبة الإدارة (admin claim) في رمز Firebase.</p>
        <div className="admin-grid">
          <article><h2>التحقيقات</h2><p>إدارة المحتوى والإصدارات — قيد الإعداد</p></article>
          <article><h2>المستخدمون</h2><p>إحصاءات حسابات CyberTrace من Firebase فقط.</p></article>
          <article><h2>الأداء</h2><p>مؤشرات الخدمة — تتطلب مصدر بيانات موثوقًا</p></article>
          <article><h2>التدقيق</h2><p>سجلات الإجراءات الإدارية — تتطلب خدمة خلفية</p></article>
        </div>
        <section aria-labelledby="auth-metrics-title">
          <h2 id="auth-metrics-title">إحصائيات الحسابات وتسجيل الدخول</h2>
          <button type="button" onClick={() => setRefresh(n=>n+1)}>تحديث الإحصائيات</button>
          <p role="status">{!current ? "جارٍ قراءة الإحصائيات..." : current.status === "ready" ? "بيانات من الخادم — توقيت الأردن" : "مصدر البيانات غير متاح أو لم يتم تفعيله بعد."}</p>
          <div className="admin-grid">{cards.map(([label,key]) => <article key={key}><h3>{label}</h3><p>{Number.isSafeInteger(metrics?.[key]) ? metrics[key].toLocaleString("ar-JO") : "غير متاح"}</p></article>)}</div>
          {metrics?.asOf && <p>آخر قراءة: {new Date(metrics.asOf).toLocaleString("ar-JO",{timeZone:"Asia/Amman"})}</p>}
          <p>عدد الحسابات التي دخلت يختلف عن عدد مرات الدخول. قد يرتبط الحساب بأكثر من مزوّد؛ سجل الدخول التفصيلي غير متاح حتى اعتماد مصدر الأحداث.</p>
        </section>
        <p className="admin-notice">لا تُعرض بيانات المستخدمين أو نتائجهم من المتصفح. لا تُفعّل العمليات الإدارية حتى تتوفر API تتحقق من الرمز والصلاحية على الخادم.</p>
      </>}
    </section>
  </main>;
}
