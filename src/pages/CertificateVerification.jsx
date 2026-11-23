import { useEffect, useRef, useState } from "react";
import { CERTIFICATE_ID, lookupCertificate, normalizeCertificateId } from "../utils/certificateVerify";
import logo from "../assets/logo.svg";
import "./CertificateVerification.css";

// Public, unauthenticated and read-only. No owner progress access or writes.
export default function CertificateVerification({ embedded = false, initialId = "", onBack }) {
  const [id, setId] = useState(initialId);
  const [state, setState] = useState("idle");
  const [record, setRecord] = useState(null);
  const serial = useRef(0);

  const verify = async value => {
    const current = ++serial.current;
    setState("loading");
    setRecord(null);
    const result = await lookupCertificate(value);
    if (current !== serial.current) return;
    setState(result.state);
    setRecord(result.record ?? null);
  };
  useEffect(() => {
    const active = ++serial.current;
    if (initialId && CERTIFICATE_ID.test(initialId)) {
      void lookupCertificate(initialId).then(result => {
        if (serial.current !== active) return;
        setState(result.state);
        setRecord(result.record ?? null);
      });
    }
    return () => { serial.current++; };
  }, [initialId]);

  const message = {
    idle: "أدخل رقم شهادة أصدرها الخادم. إفادات التدريب القديمة لا تتضمن رقم تحقق رسميًا.",
    loading: "جارٍ فحص رقم الشهادة في سجل الإصدار…",
    verified: "هذه شهادة صادرة وسارية وفق سجل الخادم. لا تعني اعتمادًا مهنيًا خارجيًا.",
    revoked: "هذه الشهادة صادرة سابقًا لكنها مُلغاة وليست صالحة الآن.",
    "bad-id": "صيغة الرقم غير صحيحة. يجب أن يتكون من 32 حرفًا سداسيًا صغيرًا.",
    "not-found": "لا يوجد سجل إصدار لهذا الرقم؛ لا يمكن اعتباره شهادة موثّقة.",
    unavailable: "تعذّر الاتصال بسجل الإصدار. قد تكون خدمة Firebase غير منشورة؛ لا يمكن الجزم بصحة الشهادة.",
  }[state];

  return <div className="ct-verify-page" dir="rtl">
    <main className="ct-verify-shell">
      {!embedded && <header className="ct-verify-brand"><img src={logo} alt="" /><span>CYBERTRACE / CERTIFICATE VERIFICATION</span></header>}
      <button type="button" className="ct-verify-back" onClick={onBack}>العودة إلى مركز الشهادات ←</button>
      <section className="ct-verify-card">
        <h1>التحقق من شهادة صادرة</h1>
        <p>نعتمد فقط على سجلات إصدار خادمية مستقلة، لا على درجات المتصفح أو إكمال التحديات يدويًا.</p>
        <form onSubmit={event => { event.preventDefault(); void verify(id); }}>
          <label htmlFor="ct-verify-id">رقم الشهادة</label>
          <div className="ct-verify-row">
            <input id="ct-verify-id" dir="ltr" type="text" required maxLength={32}
              pattern="[0-9a-f]{32}" autoComplete="off" spellCheck={false}
              value={id} onChange={event => setId(normalizeCertificateId(event.target.value))}
              placeholder="32 hexadecimal characters" />
            <button type="submit" disabled={state === "loading"}>التحقق</button>
          </div>
        </form>
        <div className={"ct-verify-status ct-verify-" + state} role="status" aria-live="polite">{message}</div>
        {record && <dl className="ct-verify-details">
          <div><dt>الجهة المُصدرة</dt><dd>{record.issuer === "blackbox" ? "BLACKBOX Lab" : "CyberTrace"}</dd></div>
          <div><dt>المجموعة التدريبية</dt><dd>{record.groupTitle}</dd></div>
          <div><dt>تاريخ الإصدار</dt><dd>{new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(new Date(record.issuedAt))}</dd></div>
          <div><dt>رقم الشهادة</dt><dd dir="ltr">{record.certificateId}</dd></div>
        </dl>}
        <p className="ct-verify-note">لا يُنشأ رقم شهادة من نتائج المتصفح. الصفحة لا تعرض بريد المتدرّب أو معرّفه الخاص.</p>
      </section>
    </main>
  </div>;
}
