import { useRef, useState } from "react";
import { addXP } from "../utils/xp";
import { shuffleArray } from "../utils/shuffle";
import { recordCaseResult } from "../utils/caseProgress";
import { getCaseDetails } from "../data/caseCatalog";
import { createInvestigationReport, getInvestigationReview } from "../utils/investigationReport";
import ShareLink from "../components/ShareLink";
import { getBlackBoxLearningLink, getShareURL } from "../utils/routes";
import { trackEvent } from "../utils/analytics";
import { useBlackBox } from "../blackbox/useBlackBox";
import BlackBoxResult from "../blackbox/BlackBoxResult";
import BlackBoxAccountButton from "../blackbox/BlackBoxAccountButton";
import "./Investigation.css";

function Investigation({ caseData, onBack, onNext, backLabel = "العودة لمكتبة التحقيقات" }) {
  const blackBox = useBlackBox();
  const [step, setStep] = useState(0); // 0: brief, 1: evidence, 2: decision, 3: result
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [evidenceChecked, setEvidenceChecked] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [decisionChecked, setDecisionChecked] = useState(false);
  const [wrongEvidenceIds, setWrongEvidenceIds] = useState([]);
  const [awardInfo, setAwardInfo] = useState(null);
  const [resultInfo, setResultInfo] = useState(null);
  const [reportStatus, setReportStatus] = useState("");
  const awarded = useRef(false);
  const details = getCaseDetails(caseData);
  const partner = getBlackBoxLearningLink(caseData.id);
  const [evidenceOptions, setEvidenceOptions] = useState(() =>
    shuffleArray(caseData.evidenceOptions)
  );
  const [decisionOptions, setDecisionOptions] = useState(() =>
    shuffleArray(caseData.decisions)
  );

  const investigationScore = Math.max(40, 100 - 10 * (wrongEvidenceIds.length));
  const evidencePoints = selectedEvidence?.correct ? 30 : 10;
  const decisionPoints = selectedDecision?.points ?? 0;
  const totalScore = evidencePoints + decisionPoints;
  const review = step === 3 ? getInvestigationReview(caseData, selectedEvidence?.id, selectedDecision?.id, resultInfo) : null;

  const downloadReport = () => {
    const markdown = createInvestigationReport(caseData, selectedEvidence?.id, selectedDecision?.id, resultInfo);
    if (step !== 3 || !markdown) {
      setReportStatus("تعذّر تجهيز التقرير؛ أكمل التحقيق لتسجيل محاولتك أولًا.");
      return;
    }
    let url;
    let link;
    try {
      url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
      link = document.createElement("a");
      link.href = url;
      link.download = `cybertrace-${caseData.id}-${resultInfo.lastCompletedAt.slice(0, 10)}.md`;
      document.body.appendChild(link);
      link.click();
      setReportStatus("جُهّز تقرير هذه المحاولة للتنزيل بصيغة Markdown.");
    } catch {
      setReportStatus("تعذّر تنزيل التقرير من هذا المتصفح. يمكنك مراجعة الملخص الظاهر أدناه.");
    } finally {
      link?.remove();
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const confirmEvidence = () => {
    if (!selectedEvidence) return;
    if (!selectedEvidence.correct) setWrongEvidenceIds(ids => ids.includes(selectedEvidence.id) ? ids : [...ids, selectedEvidence.id]);
    setEvidenceChecked(true);
  };

  const confirmDecision = () => {
    if (!selectedDecision || decisionChecked) return;
    // Decisions are graded by their canonical case points, including partial credit.
    // Finalize the chosen action rather than forcing a perfect answer.
    setDecisionChecked(true);
    completeInvestigation();
  };

  const completeInvestigation = () => {
    if (awarded.current || !selectedEvidence?.correct || !evidenceChecked || !selectedDecision || !Number.isInteger(selectedDecision.points) || selectedDecision.points < 0 || selectedDecision.points > 40) return;
    awarded.current = true;
    setAwardInfo(addXP(totalScore));
    setResultInfo(recordCaseResult(caseData.id, totalScore));
    void blackBox.recordCompletion(caseData.id, totalScore).catch(() => {});
    trackEvent("training_complete", { case_id: caseData.id, score: totalScore });
    setStep(3);
  };

  const restart = () => {
    setStep(0);
    setSelectedEvidence(null);
    setEvidenceChecked(false);
    setSelectedDecision(null);
    setDecisionChecked(false);
    setWrongEvidenceIds([]);
    setAwardInfo(null);
    setResultInfo(null);
    setReportStatus("");
    awarded.current = false;
    setEvidenceOptions(shuffleArray(caseData.evidenceOptions));
    setDecisionOptions(shuffleArray(caseData.decisions));
    trackEvent("training_start", { case_id: caseData.id, difficulty: details.difficulty, source: "retry" });
  };

  return (
    <div className="inv-screen" dir="rtl">
      <header className="inv-topbar">
        <button className="inv-back" onClick={onBack}>
          <span aria-hidden="true">→</span> {backLabel}
        </button>
        <div className="inv-topbar-actions"><BlackBoxAccountButton /><ShareLink url={getShareURL({ view: "investigation", caseId: caseData.id })} label="نسخ رابط هذا التحقيق" /></div>
      </header>

      <div className="inv-wrapper">
        <nav className="inv-progress" aria-label="مراحل التحقيق">
          {["الحادثة", "الأدلة", "القرار", "النتيجة"].map((label, i) => (
            <div key={label} className={`inv-progress-step ${i <= step ? "active" : ""}`} aria-current={i === step ? "step" : undefined}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {label}
            </div>
          ))}
        </nav>

        <div className="inv-card">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>cybertrace://investigation/{caseData.id}</span>
          </div>

          <div className="inv-body">
            {step === 0 && (
              <div className="inv-step">
                <p className="inv-line">
                  <span className="green">$</span> investigation --load {caseData.id}
                </p>

                <div className="incident-box">
                  <span className="incident-label">INCIDENT</span>
                  <h1 className="inv-title">{details.title}</h1>
                  <small>
                    {details.categoryLabel} · المستوى: {details.difficultyLabel} · {caseData.id}
                  </small>
                  <small className="inv-context" dir="auto">Severity: {caseData.severity} · {caseData.meta}</small>
                </div>

                <p className="inv-description">{caseData.brief}</p>

                <button className="primary-button" onClick={() => setStep(1)}>
                  ابدأ التحليل <span>←</span>
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="inv-step">
                <p className="inv-line">
                  <span className="green">$</span> {caseData.logCommand}
                </p>

                <div className="inv-log">
                  {caseData.logLines.map((line, i) => (
                    <p key={i} className="inv-log-line">
                      {line}
                    </p>
                  ))}
                </div>

                <p className="inv-question">
                  <span className="yellow">!</span> {caseData.evidenceQuestion}
                </p>

                <p className="inv-accuracy" role="status">دقة تحليل الأدلة: {investigationScore}/100 · كل خيار دليل خاطئ مختلف −10 · الحد الأدنى 40</p>
                <div className="inv-options">
                  {evidenceOptions.map((opt) => (
                    <button
                      key={opt.id}
                      className={`inv-option ${
                        selectedEvidence?.id === opt.id ? "selected" : ""
                      } ${
                        evidenceChecked && selectedEvidence?.id === opt.id
                          ? opt.correct
                            ? "correct"
                            : "incorrect"
                          : ""
                      }`}
                      aria-pressed={selectedEvidence?.id === opt.id}
                      onClick={() => {
                        setSelectedEvidence(opt);
                        setEvidenceChecked(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {selectedEvidence && !evidenceChecked && (
                  <button
                    className="primary-button"
                    onClick={confirmEvidence}
                  >
                    تأكيد الاختيار <span>←</span>
                  </button>
                )}

                {evidenceChecked && (
                  <>
                    <p className="inv-feedback" role="status">
                      {selectedEvidence.correct
                        ? caseData.evidenceFeedbackCorrect
                        : caseData.evidenceFeedbackIncorrect}
                    </p>
                    {selectedEvidence.correct && <button className="primary-button" onClick={() => setStep(2)}>
                      المتابعة إلى القرار <span>←</span>
                    </button>}
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="inv-step">
                <p className="inv-line">
                  <span className="green">$</span> decision --required
                </p>

                <p className="inv-question">
                  <span className="yellow">!</span> {caseData.decisionQuestion}
                </p>

                <p className="inv-accuracy" role="status">تقييم الإجراء: من 0 إلى 40 نقطة حسب جودة القرار · الاختيار نهائي لهذه المحاولة</p>
                <div className="inv-options">
                  {decisionOptions.map((d) => (
                    <button
                      key={d.id}
                      className={`inv-option ${
                        selectedDecision?.id === d.id ? "selected" : ""
                      } ${decisionChecked && selectedDecision?.id === d.id ? "incorrect" : ""}`}
                      aria-pressed={selectedDecision?.id === d.id}
                      onClick={() => { setSelectedDecision(d); setDecisionChecked(false); }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>


                {selectedDecision && !decisionChecked && (
                  <button className="primary-button" onClick={confirmDecision}>
                    تنفيذ القرار <span>←</span>
                  </button>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="inv-step inv-result">
                <p className="inv-line">
                  <span className="green">✓</span> investigation --closed
                </p>

                <div className="inv-score-box">
                  <span className="incident-label">النتيجة</span>
                  <p>تقييم دقة تحليل الأدلة: {investigationScore} / 100 · {wrongEvidenceIds.length} خيارات أدلة خاطئة مختلفة</p>
                  <strong>{totalScore} / 70 XP</strong>
                  <small>تم حل الحادثة {caseData.id}</small>
                </div>

                {!review && <p className="inv-outcome">{selectedDecision.outcome}</p>}

                {review && <section className="inv-review" aria-labelledby="analyst-review-title">
                  <div className="inv-review-heading"><div><span className="incident-label">بعد إغلاق التحقيق</span><h2 id="analyst-review-title">مراجعة المحلّل</h2></div><button type="button" className="secondary-button inv-report-button" onClick={downloadReport}>تنزيل تقرير التحقيق</button></div>
                  <dl className="inv-review-choices">
                    <div><dt><span>الدليل الذي اخترته</span><strong>{review.evidence.points} / 30</strong></dt><dd><p>{review.evidence.label}</p><p className="inv-review-feedback">{review.evidence.feedback}</p></dd></div>
                    <div><dt><span>قرار الاستجابة</span><strong>{review.decision.points} / 40</strong></dt><dd><p>{review.decision.label}</p><p className="inv-review-feedback">{review.decision.outcome}</p></dd></div>
                  </dl>
                  <div className="inv-review-next"><h3>ما الذي تراجعه في المحاولة القادمة؟</h3><ul>{review.nextSteps.map(item => <li key={item}>{item}</li>)}</ul></div>
                  <p className="inv-review-note">التقرير يصف هذه المحاولة في محاكاة تعليمية، ويستخدم سجل هذا المتصفح أو الجلسة.</p>
                  <p className="inv-report-status" role="status" aria-live="polite">{reportStatus}</p>
                </section>}

                <BlackBoxResult caseId={caseData.id} score={totalScore} />

                {resultInfo && <div className="inv-personal-record" aria-label="سجل هذه القضية">
                  <div><span>أفضل نتيجة</span><strong>{resultInfo.bestScore} / 70</strong></div>
                  <div><span>المحاولات المسجّلة</span><strong>{resultInfo.attempts}</strong></div>
                </div>}

                {awardInfo?.leveledUp && (
                  <div className="inv-levelup">
                    <span>🎉 وصلت إلى مستوى جديد</span>
                    <strong>
                      المستوى {awardInfo.newLevel.level} — {awardInfo.newLevel.title}
                    </strong>
                  </div>
                )}

                {awardInfo && (
                  <div className="inv-total-xp">
                    <div className="inv-total-xp-row">
                      <span>رصيدك الحالي</span>
                      <strong>
                        المستوى {awardInfo.newLevel.level} · {awardInfo.newLevel.title}
                      </strong>
                    </div>
                    <div className="inv-total-bar">
                      <div style={{ width: `${awardInfo.newLevel.progress}%` }}></div>
                    </div>
                    <span className="inv-total-count">
                      {awardInfo.newXP}{" "}
                      {awardInfo.newLevel.next
                        ? `/ ${awardInfo.newXP + awardInfo.newLevel.xpForNext} XP`
                        : "XP · أعلى مستوى"}
                    </span>
                  </div>
                )}

                <div className="inv-actions">
                  <button className="secondary-button" onClick={restart}>
                    إعادة المحاولة
                  </button>
                  <button className="primary-button" onClick={onNext}>
                    تحقيق آخر <span aria-hidden="true">←</span>
                  </button>
                </div>
                <aside className="launch-partner inv-next-skill" aria-labelledby="next-skill-title">
                  <h2 id="next-skill-title">خطوة عملية بعد التحليل</h2>
                  <p>حوّل ما تعلّمته إلى تدريب منظّم، ووثّق النتائج والملاحظات في BlackBox-Lab.</p>
                  <a href={partner.url} target="_blank" rel="noopener" onClick={() => trackEvent("partner_click", { destination: "blackbox", context: "case_result" })}>{partner.label} ↗</a>
                  <small>تنفيذ الأدوات يتم في مختبرك المحلي؛ الموقع ينظّم خطوات التدريب.</small>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Investigation;
