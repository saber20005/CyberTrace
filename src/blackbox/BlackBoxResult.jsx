import { useState } from "react";
import { getCaseResults } from "../utils/caseProgress";
import { CASE_META, SKILLS } from "../data/linkedSkills";
import { useBlackBox } from "./useBlackBox";

export default function BlackBoxResult({ caseId, score }) {
  const { status, openLink, importHistory } = useBlackBox();
  const [retryBusy, setRetryBusy] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");
  const retryCurrentResult = async () => {
    const local = getCaseResults()[caseId];
    if (!local) {
      setRetryMessage("لا توجد نتيجة محفوظة لهذا التحقيق في حساب CyberTrace الحالي. أعد التحقيق قبل نقل نتيجته.");
      return;
    }
    setRetryBusy(true);
    setRetryMessage("جارٍ إرسال نتيجة هذا التحقيق إلى BLACKBOX...");
    try {
      const result = await importHistory({ [caseId]: local });
      setRetryMessage(result.pending
        ? "هذه النتيجة ما زالت تنتظر BLACKBOX. راجع حالة الربط."
        : result.imported ? "تمت معالجة إرسال النتيجة إلى BLACKBOX. تحقق من سجل النتائج المرتبط." : "النتيجة مسجّلة مسبقًا أو غير مؤهلة لإعادة الإرسال.");
    } catch (error) {
      setRetryMessage("فشلت محاولة إرسال النتيجة إلى BLACKBOX: " + (error.code || error.message));
    } finally {
      setRetryBusy(false);
    }
  };
  if (!status.enabled || !Object.hasOwn(CASE_META, caseId)) return null;
  const skill = SKILLS.find(item => item.id === CASE_META[caseId].skillId);
  const receipt = status.receipts?.[caseId];
  const credited = Boolean(status.user && receipt && receipt.bestScore >= score);
  return <section className="bb-case-result" data-linked-case={caseId} aria-labelledby="blackboxResultTitle">
    <span className="bb-case-source">CYBERTRACE → BLACKBOX</span>
    <h2 id="blackboxResultTitle">تقدّم مهارة {skill?.label || "التحقيق"}</h2>
    {!status.user ? <><p>اربط حساب BlackBox ثم انقل نتائج هذا المتصفح من نافذة الربط لإضافة نتيجة هذا التحقيق إلى مهارتك.</p><button type="button" className="bb-link-secondary" onClick={openLink}>ربط حساب BlackBox</button></>
      : <><p className="bb-result-status" role="status">{credited ? `أفضل نتيجة متزامنة لهذا التحقيق: ${receipt.bestScore} / 70` : status.syncing ? "جارٍ مزامنة نتيجة التحقيق مع حسابك…" : "لم تتأكد مزامنة هذه النتيجة بعد. راجع حالة الربط أو أعد المزامنة."}</p><p className="bb-link-note">الحساب المستلم: <bdi>{status.user.email || status.user.displayName || "حساب BlackBox"}</bdi></p>
        <p className="bb-link-note">تُحتسب أفضل نتيجة لكل تحقيق. مراحل المختبر العملي تُسجَّل عند تنفيذها.</p>
        {!credited && <><button type="button" className="bb-link-secondary" disabled={retryBusy || status.syncing} onClick={() => { void retryCurrentResult(); }}>{retryBusy ? "جارٍ الإرسال..." : "إعادة إرسال هذه النتيجة إلى BLACKBOX"}</button>{retryMessage && <p className="bb-link-note" role="status">{retryMessage}</p>}</>}
        <a className="bb-link-destination" href="https://blackboxlab.dev/?view=skills&utm_source=cybertrace&utm_medium=referral&utm_campaign=linked_skills" target="_blank" rel="noopener noreferrer">افتح تقدّم المهارات في BlackBox ↗</a></>}
  </section>;
}
