import { useState } from "react";
import { addXP } from "../utils/xp";
import { shuffleArray } from "../utils/shuffle";
import { markCaseSeen } from "../utils/caseProgress";
import "./Investigation.css";

function Investigation({ caseData, onBack }) {
  const [step, setStep] = useState(0); // 0: brief, 1: evidence, 2: decision, 3: result
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [evidenceChecked, setEvidenceChecked] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [awardInfo, setAwardInfo] = useState(null);
  const [evidenceOptions, setEvidenceOptions] = useState(() =>
    shuffleArray(caseData.evidenceOptions)
  );
  const [decisionOptions, setDecisionOptions] = useState(() =>
    shuffleArray(caseData.decisions)
  );

  const evidencePoints = selectedEvidence?.correct ? 30 : 10;
  const decisionPoints = selectedDecision?.points ?? 0;
  const totalScore = evidencePoints + decisionPoints;

  const completeInvestigation = () => {
    if (awardInfo) return;
    setAwardInfo(addXP(totalScore));
    markCaseSeen(caseData.id);
    setStep(3);
  };

  const restart = () => {
    setStep(0);
    setSelectedEvidence(null);
    setEvidenceChecked(false);
    setSelectedDecision(null);
    setAwardInfo(null);
    setEvidenceOptions(shuffleArray(caseData.evidenceOptions));
    setDecisionOptions(shuffleArray(caseData.decisions));
  };

  return (
    <div className="inv-screen" dir="rtl">
      <button className="inv-back" onClick={onBack}>
        <span>→</span> العودة لقائمة التحقيقات
      </button>

      <div className="inv-wrapper">
        <div className="inv-progress">
          {["الحادثة", "الأدلة", "القرار", "النتيجة"].map((label, i) => (
            <div key={label} className={`inv-progress-step ${i <= step ? "active" : ""}`}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {label}
            </div>
          ))}
        </div>

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
                  <strong>{caseData.incidentTitle}</strong>
                  <small>
                    Severity: {caseData.severity} · {caseData.meta}
                  </small>
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
                    onClick={() => setEvidenceChecked(true)}
                  >
                    تأكيد الاختيار <span>←</span>
                  </button>
                )}

                {evidenceChecked && (
                  <>
                    <p className="inv-feedback">
                      {selectedEvidence.correct
                        ? caseData.evidenceFeedbackCorrect
                        : caseData.evidenceFeedbackIncorrect}
                    </p>
                    <button className="primary-button" onClick={() => setStep(2)}>
                      المتابعة إلى القرار <span>←</span>
                    </button>
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

                <div className="inv-options">
                  {decisionOptions.map((d) => (
                    <button
                      key={d.id}
                      className={`inv-option ${
                        selectedDecision?.id === d.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedDecision(d)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {selectedDecision && (
                  <button className="primary-button" onClick={completeInvestigation}>
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
                  <strong>{totalScore} / 70 XP</strong>
                  <small>تم حل الحادثة {caseData.id}</small>
                </div>

                <p className="inv-outcome">{selectedDecision.outcome}</p>

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
                  <button className="primary-button" onClick={onBack}>
                    تحقيق آخر <span>←</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Investigation;
