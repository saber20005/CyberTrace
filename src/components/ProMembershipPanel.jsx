import { useState } from "react";
import { useBlackBox } from "../blackbox/useBlackBox.js";
import { readSuiteMembership, suiteMembershipConfigured } from "../blackbox/suiteMembership.js";

function MembershipStatus({ uid, onLink }) {
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const check = async () => {
    if (!uid || phase === "loading") return;
    setPhase("loading");
    setResult(null);
    setMessage("");
    try {
      const membership = await readSuiteMembership(uid);
      setResult(membership);
      setPhase("ready");
    } catch {
      setPhase("unavailable");
      setMessage("تعذّر التحقق من العضوية من خادم BLACKBOX. لا يمكن اعتماد أي صلاحية مدفوعة الآن.");
    }
  };
  if (!uid) return <div className="suite-pro-membership-state">
    <p>اربط حساب BLACKBOX أولًا لعرض حالة العضوية مستقبلًا. حساب CyberTrace وحده لا يثبت الاشتراك.</p>
    <button type="button" onClick={onLink}>ربط حساب BLACKBOX</button>
  </div>;
  return <div className="suite-pro-membership-state">
    <p>حساب BLACKBOX متصل. نتيجة المتصفح لا تمنح الوصول إلى المحتوى المدفوع؛ الخادم هو صاحب القرار.</p>
    {!suiteMembershipConfigured
      ? <p role="status">خدمة التحقق من الاشتراك لم تُفعّل بعد. لا توجد مبيعات حاليًا.</p>
      : <button type="button" disabled={phase === "loading"} onClick={() => void check()}>
          {phase === "loading" ? "جارٍ فحص العضوية..." : "التحقق من حالة عضويتي"}
        </button>}
    {phase === "ready" && result && <p role="status">
      {result.active ? "توجد عضوية سارية مسجلة على الخادم. الميزات المدفوعة لم تُطرح للبيع بعد." :
        "لا توجد عضوية Pro مفعّلة لهذا الحساب حاليًا. التدريب المجاني مستمر دون تغيير."}
    </p>}
    {phase === "unavailable" && <p role="alert">{message}</p>}
  </div>;
}

export default function ProMembershipPanel() {
  const { status, openLink } = useBlackBox();
  const uid = status.user?.uid ?? null;
  return <section className="suite-pro-membership" aria-labelledby="suite-pro-membership-title">
    <span className="suite-pro-kicker">خطوة البنية الأمنية</span>
    <h2 id="suite-pro-membership-title">حالة عضوية Suite Pro</h2>
    <p>نجهّز التحقق الخادمي المرتبط بحساب BLACKBOX. لا يمكن شراء الاشتراك أو الحصول على وصول مدفوع من هذه الصفحة بعد.</p>
    <MembershipStatus key={uid ?? "unlinked"} uid={uid} onLink={openLink} />
  </section>;
}
