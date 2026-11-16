import { useEffect, useState } from "react";
import "./Admin.css";

export default function Admin({ user, onHome }) {
  const [verification, setVerification] = useState({ uid: null, status: "checking" });
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

  return <main className="admin-page" dir="rtl">
    <header className="admin-header"><strong>CyberTrace <span>CONTROL</span></strong><button onClick={onHome}>العودة للرئيسية</button></header>
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
          <article><h2>المستخدمون</h2><p>الإحصاءات المجمّعة — تتطلب واجهة خلفية آمنة</p></article>
          <article><h2>الأداء</h2><p>مؤشرات الخدمة — تتطلب مصدر بيانات موثوقًا</p></article>
          <article><h2>التدقيق</h2><p>سجلات الإجراءات الإدارية — تتطلب خدمة خلفية</p></article>
        </div>
        <p className="admin-notice">لا تُعرض بيانات المستخدمين أو نتائجهم من المتصفح. لا تُفعّل العمليات الإدارية حتى تتوفر API تتحقق من الرمز والصلاحية على الخادم.</p>
      </>}
    </section>
  </main>;
}
