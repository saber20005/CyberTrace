import { CASE_META, SKILLS } from "../data/linkedSkills";
import { useBlackBox } from "./useBlackBox";

export default function BlackBoxResult({ caseId, score }) {
  const { status, openLink, retryPending } = useBlackBox();
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
        {!credited && <button type="button" className="bb-link-secondary" onClick={() => { void retryPending().catch(() => {}); }}>إعادة المزامنة</button>}
        <a className="bb-link-destination" href="https://blackboxlab.dev/?view=skills&utm_source=cybertrace&utm_medium=referral&utm_campaign=linked_skills" target="_blank" rel="noopener noreferrer">افتح تقدّم المهارات في BlackBox ↗</a></>}
  </section>;
}
