import { useState } from "react";
import { SOC_SHIFTS, SOC_PRIORITIES, getSocShift } from "../data/socShiftCatalog.js";
import { commitSocAlert, finalizeSocShift, gradeSocSession, loadSocSession, saveSocSession, makeSocShiftReport } from "../utils/socShiftSession.js";
import { getBlackBoxLearningLink } from "../utils/routes.js";
import "./SocShift.css";

const INITIAL_DRAFT = () => ({ priorityId: "", actionId: "", note: "" });

export default function SocShift({ shiftId, onHome, onLibrary, onPro, onSelectShift }) {
  const shift = getSocShift(shiftId);
  const [session, setSession] = useState(() => loadSocSession(undefined, shift.id));
  const [activeId, setActiveId] = useState(shift.alerts[0].id);
  const [drafts, setDrafts] = useState({});
  const [correlationId, setCorrelationId] = useState("");
  const [status, setStatus] = useState("");
  const result = gradeSocSession(session, shift.id);
  const active = shift.alerts.find(alert => alert.id === activeId) || shift.alerts[0];
  const draft = drafts[active.id] || INITIAL_DRAFT();
  const saved = session.responses[active.id];
  const allHandled = result.handled === shift.alerts.length;
  const partner = getBlackBoxLearningLink();

  const setDraft = field => value => setDrafts(current => ({
    ...current,
    [active.id]: { ...(current[active.id] || INITIAL_DRAFT()), [field]: value },
  }));

  const persist = next => {
    setSession(next);
    try {
      saveSocSession(next, undefined, shift.id);
      setStatus("حُفظ تقدم المناوبة محليًا على هذا المتصفح.");
    } catch {
      setStatus("تعذّر الحفظ في المتصفح؛ احتفظ بنسخة من التقرير قبل المغادرة إذا أكملت المناوبة.");
    }
  };

  const commitAlert = () => {
    if (!draft.priorityId || !draft.actionId || saved || session.correlationId) return;
    const next = commitSocAlert(session, active.id, draft.priorityId, draft.actionId, draft.note, shift.id);
    if (!next) return;
    persist(next);
    const firstOpen = shift.alerts.find(row => row.id !== active.id && !next.responses[row.id]);
    if (firstOpen) setActiveId(firstOpen.id);
  };

  const finish = () => {
    const next = finalizeSocShift(session, correlationId, shift.id);
    if (!next) return;
    persist(next);
  };

  const newShift = () => {
    if (!window.confirm("إعادة مناوبة SOC من البداية؟ ستمحى قرارات هذه المحاولة المحلية. يمكنك تنزيل التقرير أولًا، ولن يتأثر XP أو تقدم التحقيقات.")) return;
    const empty = { version: 1, responses: {}, correlationId: null };
    setDrafts({});
    setCorrelationId("");
    setActiveId(shift.alerts[0].id);
    persist(empty);
  };

  const downloadReport = () => {
    const markdown = makeSocShiftReport(session, shift.id);
    if (!markdown) return;
    let url, anchor;
    try {
      url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
      anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "cybertrace-" + shift.id.toLowerCase() + ".md";
      document.body.appendChild(anchor);
      anchor.click();
      setStatus("تم تجهيز تقرير المناوبة للتنزيل.");
    } catch {
      setStatus("فشل التنزيل في هذا المتصفح. يمكنك قراءة المراجعة الظاهرة أدناه.");
    } finally {
      anchor?.remove();
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  return <div className="soc-page" dir="rtl">
    <header className="soc-topbar">
      <button type="button" className="soc-brand" onClick={onHome} aria-label="العودة إلى CyberTrace">Cyber<span>Trace</span></button>
      <nav aria-label="تنقل المناوبة">
        <button type="button" onClick={onLibrary}>مكتبة التحقيقات</button>
        <button type="button" onClick={onPro}>عن Suite Pro</button>
      </nav>
    </header>
    <main className="soc-main">
      <section className="soc-switcher" aria-label="اختيار مستوى مناوبة SOC">
        <div className="soc-section-head"><h2>مكتبة مناوبات SOC</h2><span>3 مستويات · التدريب مجاني أثناء التطوير</span></div>
        <div className="soc-shift-cards">
          {SOC_SHIFTS.map(item => <button type="button" key={item.id}
            className={"soc-shift-card" + (shift.id === item.id ? " active" : "")}
            aria-pressed={shift.id === item.id} onClick={() => { if (shift.id !== item.id) onSelectShift(item.id); }}>
            <span className="soc-shift-card-top"><small>{item.id}</small><em>{item.level} · {item.estimatedMinutes} دقيقة تقريبًا</em></span>
            <strong>{item.title}</strong>
            <span>{item.focus}</span>
            <small>{shift.id === item.id ? "المناوبة الحالية" : "افتح هذه المناوبة ←"}</small>
          </button>)}
        </div>
      </section>
      <div className="soc-heading">
        <div>
          <span className="soc-eyebrow">CYBERTRACE / {shift.id}</span>
          <h1>{shift.title}</h1>
          <p>{shift.description} اختر الأولوية والاستجابة لكل تنبيه ثم حلّل العلاقة بين السجلات.</p>
          <div className="soc-notices"><span>المستوى: {shift.level}</span><span>تجربة مجانية قيد التطوير</span><span>بيانات اصطناعية</span><span>لا تمنح XP</span></div>
        </div>
        <div className="soc-summary" aria-live="polite"><strong>{result.handled} / {result.totalAlerts}</strong><span>تنبيهات عولجت</span></div>
      </div>

      <section className="soc-intro" aria-label="تعليمات المناوبة">
        <strong>تعليمات المحلل</strong>
        <p>ابدأ بالأشد خطورة بحسب الأدلة، ولا تعتمد على عنوان IP أو تنبيه واحد وحده. كل تنبيه يحسب له 8 نقاط للأولوية و12 للاستجابة، و20 نقطة لربط التنبيهات. قراراتك نهائية في المحاولة، ويمكنك إعادة المناوبة بعد تنزيل تقريرك.</p>
        <p className="soc-caveat">هذا تقييم تعليمي محلي قابل للتلاعب عبر المتصفح، وليس إثبات كفاءة أو نتيجة موثقة من الخادم. لا تُرسل بيانات هذه المناوبة إلى BLACKBOX.</p>
      </section>

      <div className="soc-grid">
        <section className="soc-inbox" aria-labelledby="soc-inbox-title">
          <div className="soc-section-head"><h2 id="soc-inbox-title">صندوق التنبيهات</h2><span>اختر تنبيهًا للتحليل</span></div>
          <div className="soc-alerts">
            {shift.alerts.map(alert => <button key={alert.id} type="button"
              className={"soc-alert" + (alert.id === active.id ? " is-selected" : "") + (session.responses[alert.id] ? " is-handled" : "")}
              aria-pressed={alert.id === active.id} onClick={() => setActiveId(alert.id)}>
              <span className="soc-alert-top"><span dir="ltr">{alert.id}</span><time dir="ltr">{alert.received}</time></span>
              <strong>{alert.title}</strong>
              <small>{alert.category} · {alert.asset}</small>
              <em>{session.responses[alert.id] ? "✓ قرار مسجل" : "بانتظار التحليل"}</em>
            </button>)}
          </div>
        </section>

        <section className="soc-workbench" aria-labelledby="soc-workbench-title">
          <div className="soc-section-head"><h2 id="soc-workbench-title">منضدة التحليل</h2><span dir="ltr">{active.id}</span></div>
          <span className="soc-category">{active.category} · {active.source}</span>
          <h3>{active.title}</h3>
          <p className="soc-description">{active.description}</p>
          <div className="soc-evidence">
            <div className="soc-section-head"><strong>سجلات مرتبطة</strong><span>{active.evidence.length} أسطر</span></div>
            <div className="soc-evidence-viewport" role="region" aria-label="السجلات الاصطناعية القابلة للتمرير" tabIndex={0}>
              {active.evidence.map((line, index) => <p key={index} dir="ltr">{line}</p>)}
            </div>
          </div>
          {saved ? <div className="soc-saved">
            <strong>تم اعتماد قرارك لهذا التنبيه</strong>
            <p>الأولوية: {SOC_PRIORITIES.find(row => row.id === saved.priorityId)?.label}</p>
            <p>الإجراء: {active.actions.find(row => row.id === saved.actionId)?.label}</p>
            {saved.note && <p>ملاحظتك: {saved.note}</p>}
            <small>لن يظهر تصحيح القرارات قبل إغلاق المناوبة؛ التعديل يتطلب إعادة المحاولة.</small>
          </div> : result.complete ? <p className="soc-saved">اكتملت المناوبة. يمكنك مراجعة أدلتها أو تنزيل تقريرها.</p> : <>
            <fieldset className="soc-fieldset" aria-label="اختيار أولوية التنبيه">
              <legend>1. ما أولوية هذا التنبيه؟ <span>8 نقاط</span></legend>
              <div className="soc-priorities">
                {SOC_PRIORITIES.map(priority => <label key={priority.id} className={draft.priorityId === priority.id ? "checked" : ""}>
                  <input type="radio" name={"priority-" + active.id} checked={draft.priorityId === priority.id} onChange={() => setDraft("priorityId")(priority.id)} />
                  <span><strong>{priority.label}</strong><small>{priority.hint}</small></span>
                </label>)}
              </div>
            </fieldset>
            <fieldset className="soc-fieldset" aria-label="اختيار إجراء الاستجابة">
              <legend>2. ما إجراء الاستجابة الأنسب؟ <span>12 نقطة</span></legend>
              <div className="soc-actions">
                {active.actions.map(action => <label key={action.id} className={draft.actionId === action.id ? "checked" : ""}>
                  <input type="radio" name={"action-" + active.id} checked={draft.actionId === action.id} onChange={() => setDraft("actionId")(action.id)} />
                  <span>{action.label}</span>
                </label>)}
              </div>
            </fieldset>
            <label htmlFor="soc-note" className="soc-note-label">ملاحظتك التحليلية (اختياري، لا تدخل في الدرجة)</label>
            <textarea id="soc-note" rows={3} maxLength={350} value={draft.note} onChange={event => setDraft("note")(event.target.value)}
              placeholder="ما الدليل الذي اعتمدت عليه؟ وما الذي يحتاج إلى تحقق؟" />
            <div className="soc-action-bar">
              <small>{draft.note.length}/350</small>
              <button type="button" className="soc-primary" disabled={!draft.priorityId || !draft.actionId} onClick={commitAlert}>اعتماد القرار لهذا التنبيه ←</button>
            </div>
          </>}
        </section>
      </div>

      {allHandled && !result.complete && <section className="soc-correlation" aria-labelledby="soc-correlation-title">
        <span className="soc-eyebrow">FINAL ASSESSMENT · 20 POINTS</span>
        <h2 id="soc-correlation-title">الخطوة الأخيرة: اربط التنبيهات</h2>
        <p>هل توجد علاقة بين تنبيه البريد وتنبيه الهوية؟ حدد ما يمكن قوله بثقة من السجلات فقط.</p>
        <fieldset className="soc-fieldset">
          <legend>اختر الاستنتاج الأقرب إلى الأدلة</legend>
          <div className="soc-actions">{shift.links.map(item => <label key={item.id} className={correlationId === item.id ? "checked" : ""}>
            <input type="radio" name="soc-link" checked={correlationId === item.id} onChange={() => setCorrelationId(item.id)} />
            <span>{item.label}</span>
          </label>)}</div>
        </fieldset>
        <button type="button" disabled={!correlationId} className="soc-primary" onClick={finish}>إغلاق المناوبة وعرض التقييم ←</button>
      </section>}

      {result.complete && <section className="soc-report" aria-labelledby="soc-report-title">
        <span className="soc-eyebrow">SHIFT COMPLETE / SIMULATED</span>
        <h2 id="soc-report-title">مراجعة أداء المناوبة</h2>
        <div className="soc-final-score"><strong>{result.score} / {result.maxScore}</strong><span>{result.level}</span></div>
        <div className="soc-score-breakdown" aria-label="تفصيل تقييم المناوبة">
          <span>الأولويات: <strong>{result.priorityScore}/{result.priorityMax}</strong></span>
          <span>الاستجابة: <strong>{result.responseScore}/{result.responseMax}</strong></span>
          <span>ربط الأدلة: <strong>{result.correlationPoints}/20</strong></span>
        </div>
        <div className="soc-learning-feedback">
          <h3>خطتك للمراجعة</h3>
          <p>{result.coaching.missedPriority
            ? `راجع ${result.coaching.missedPriority} تنبيهات أخطأت في ترتيب أولويتها بحسب الخطر المثبت.`
            : "صنّفت أولويات كل التنبيهات بصورة صحيحة."}</p>
          <p>{result.coaching.weakResponse
            ? `راجع إجراءات الاستجابة في ${result.coaching.weakResponse} تنبيهات، وميّز بين الاحتواء وحفظ الأدلة.`
            : "جميع إجراءات الاستجابة المختارة حققت الدرجة الكاملة."}</p>
          <p>{result.coaching.correlationNeedsWork
            ? "راجع استنتاج العلاقة بين التنبيهات؛ لا تحوّل القرينة الزمنية إلى إثبات سببي."
            : "ربطت الأحداث مع الحفاظ على حدود ما تؤكده الأدلة."}</p>
        </div>
        <p>درجة تدريبية على هذا المتصفح، وليست درجة موثّقة ولا تُضاف إلى XP أو سجل BLACKBOX.</p>
        <div className="soc-review-list">
          {result.assessments.map(item => <article key={item.id}>
            <div className="soc-review-title"><strong>{item.id} — {item.title}</strong><span>{item.total} / 20</span></div>
            <p>الأولوية: {item.priorityPoints} / 8 · الاستجابة: {item.actionPoints} / 12</p>
            <p>{item.priorityExplanation}</p><p>{item.actionFeedback}</p>
          </article>)}
        </div>
        <div className="soc-final-link"><strong>تحليل الارتباط: {result.correlationPoints} / 20</strong><p>{result.correlationFeedback}</p></div>
        <div className="soc-report-actions">
          <button type="button" className="soc-primary" onClick={downloadReport}>تنزيل تقرير المناوبة (.md)</button>
          <button type="button" className="soc-secondary" onClick={newShift}>إعادة المناوبة</button>
          <a href={partner.url} target="_blank" rel="noopener noreferrer">تدرّب عمليًا في BLACKBOX ↗</a>
        </div>
      </section>}
      <div className="soc-footer-actions">
        <p role="status" aria-live="polite">{status}</p>
        {!result.complete && <button className="soc-secondary" type="button" onClick={newShift}>بدء مناوبة جديدة</button>}
        <button className="soc-secondary" type="button" onClick={onLibrary}>العودة إلى التحقيقات</button>
      </div>
    </main>
  </div>;
}
