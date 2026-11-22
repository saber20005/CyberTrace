import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import {
  identityLinkConfigured,checkVerifiedAccountLink,linkVerifiedAccounts,unlinkVerifiedAccounts,
} from "./verifiedIdentityBackend.js";
import "./VerifiedIdentityPanel.css";

export default function VerifiedIdentityPanel({ blackboxUid }) {
  const [cybertraceUid,setCybertraceUid]=useState(() => auth.currentUser?.uid || null);
  useEffect(()=>onAuthStateChanged(auth,user=>setCybertraceUid(user?.uid||null)),[]);
  // React remounts per identity pair, discarding stale status and consent
  // without synchronous state resets inside effects.
  return <VerifiedIdentityContent key={String(blackboxUid)+"|"+String(cybertraceUid)}
    blackboxUid={blackboxUid} cybertraceUid={cybertraceUid} />;
}

function VerifiedIdentityContent({ blackboxUid, cybertraceUid }) {
  const [consent,setConsent]=useState(false);
  const [phase,setPhase]=useState("idle");
  const [linked,setLinked]=useState(null);
  const [message,setMessage]=useState("");
  const check=async () => {
    if(!blackboxUid||!cybertraceUid||phase==="loading")return;
    setPhase("loading");setMessage("");
    try {
      const result=await checkVerifiedAccountLink(blackboxUid,cybertraceUid);
      setLinked(result.linked);setPhase("ready");
      setMessage(result.linked?"تأكد الخادم من ربط الحسابين.":"لا يوجد ربط موثّق بين الحسابين حاليًا.");
    } catch {
      setLinked(null);setPhase("error");
      setMessage("تعذر الاتصال بخادم التحقق. لا يمكن اعتماد الربط حاليًا.");
    }
  };
  const link=async () => {
    if(!consent||!cybertraceUid||!blackboxUid||phase==="loading")return;
    setPhase("loading");setMessage("");
    try {
      const result=await linkVerifiedAccounts(blackboxUid,cybertraceUid);
      setLinked(result.linked);setPhase("ready");setConsent(false);
      setMessage("اكتمل ربط الحسابين بعد التحقق من هوية كل منهما.");
    } catch (error) {
      setLinked(null);setPhase("error");setMessage(error?.message?.includes("recent")?
        "أعد تسجيل الدخول إلى الحسابين ثم حاول من جديد.":
        "فشل إثبات ملكية الحسابين. أعد تسجيل الدخول إلى كليهما، وتأكد من تهيئة App Check.");
    }
  };
  const unlink=async () => {
    if(!blackboxUid||!cybertraceUid||phase==="loading")return;
    if(!window.confirm("إلغاء الربط الموثّق بين حسابَي CyberTrace وBLACKBOX؟ لن تُحذف نتائج التدريب."))return;
    setPhase("loading");setMessage("");
    try {
      await unlinkVerifiedAccounts(blackboxUid,cybertraceUid);
      setLinked(false);setPhase("ready");setConsent(false);
      setMessage("أُلغي الربط دون حذف بيانات التدريب.");
    } catch {
      setLinked(null);setPhase("error");setMessage("تعذّر إلغاء الربط من الخادم. تحقق من الحساب والمحاولة.");
    }
  };
  return <section className="ct-verified-identity" aria-labelledby="ct-verified-identity-title">
    <h3 id="ct-verified-identity-title">إثبات ربط الحسابين للشهادات المستقبلية</h3>
    <p>مزامنة نتائج التدريب لا تثبت هوية صاحب الحساب. هذا ربط منفصل يتطلب تسجيل دخول حديثًا إلى CyberTrace وBLACKBOX وموافقة صريحة منك.</p>
    {!cybertraceUid ? <p role="status">سجّل دخولك إلى CyberTrace أولًا.</p> :
      !identityLinkConfigured ? <p role="status">خدمة إثبات الربط لم تُفعّل بعد. لا توجد شهادات موثّقة متاحة حاليًا.</p> :
      <>
        <button type="button" disabled={phase==="loading"} onClick={() => void check()}>
          التحقق من حالة الربط
        </button>
        {linked===false && <label className="ct-verified-consent">
          <input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)} />
          أوافق على إثبات ملكيتي للحسابين لدى خادم BLACKBOX، دون نقل بيانات أو إصدار شهادة
        </label>}
        {linked===false && <button type="button" disabled={!consent||phase==="loading"} onClick={() => void link()}>
          ربط الحسابين بصورة موثّقة
        </button>}
        {linked===true && <button type="button" disabled={phase==="loading"} onClick={() => void unlink()}>
          إلغاء الربط الموثّق
        </button>}
      </>}
    <p className="ct-verified-message" role={phase==="error"?"alert":"status"} aria-live="polite">
      {phase==="loading"?"جارٍ التواصل مع الخادم...":message}
    </p>
    <small>لا يمنح هذا الربط وحده شهادة أو وصول Pro. يجب أن تكون نتائج التقييم موثّقة خادميًا.</small>
  </section>;
}
