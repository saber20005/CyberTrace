import { useEffect, useRef, useState } from "react";
import { CATEGORIES, DIFFICULTIES, getCaseDetails } from "../data/caseCatalog";
import { getCaseResults, getCompletedCaseIds } from "../utils/caseProgress";
import { getLevelInfo, getXP } from "../utils/xp";
import XPBadge from "../components/XPBadge";
import logo from "../assets/logo.svg";
import ShareLink from "../components/ShareLink";
import { getBlackBoxLearningLink, getShareURL } from "../utils/routes";
import { trackEvent } from "../utils/analytics";
import { buildLearningPlan } from "../utils/learningPlan";
import "./InvestigationLibrary.css";

const dateFormat = new Intl.DateTimeFormat("ar", { day: "numeric", month: "short", year: "numeric" });
const suggestionLabels = {
  new: "خطوتك التالية",
  review: "فرصة للتحسين",
  record: "سجّل نتيجتك",
  daily: "اقتراح اليوم",
};

function InvestigationLibrary({ cases, onStart, onHome }) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const heading = useRef(null);
  const [results] = useState(getCaseResults);
  const [completedIds] = useState(getCompletedCaseIds);
  const [level] = useState(() => getLevelInfo(getXP()));

  useEffect(() => { heading.current?.focus(); }, []);

  const completed = new Set(completedIds);
  const completedCount = cases.filter(c => completed.has(c.id)).length;
  const recordedResults = cases.map(c => results[c.id]).filter(Boolean);
  const attempts = recordedResults.reduce((sum, result) => sum + result.attempts, 0);
  const best = recordedResults.length ? Math.max(...recordedResults.map(result => result.bestScore)) : null;
  const progress = cases.length ? Math.round(completedCount / cases.length * 100) : 0;
  const learningPlan = buildLearningPlan(cases, results, completedIds);
  const partner = getBlackBoxLearningLink();
  const normalizedQuery = query.trim().toLocaleLowerCase("ar");
  const visibleCases = cases.filter(c => {
    const details = getCaseDetails(c);
    const searchable = `${details.title} ${c.incidentTitle} ${c.id} ${details.categoryLabel} ${c.brief}`.toLocaleLowerCase("ar");
    return (!normalizedQuery || searchable.includes(normalizedQuery))
      && (difficulty === "all" || details.difficulty === difficulty)
      && (category === "all" || details.category === category)
      && (status === "all" || (status === "completed" ? completed.has(c.id) : !completed.has(c.id)));
  });

  const clearFilters = () => {
    setQuery(""); setDifficulty("all"); setCategory("all"); setStatus("all");
  };

  return (
    <div className="app library-page" dir="rtl">
      <header className="navbar library-nav">
        <button className="logo logo-button" onClick={onHome} aria-label="CyberTrace — الرئيسية">
          <img src={logo} alt="" className="logo-mark" /><span>CyberTrace</span>
        </button>
        <div className="nav-right"><XPBadge /><button className="nav-button library-home" onClick={onHome}>الرئيسية <span aria-hidden="true">↗</span></button></div>
      </header>
      <main className="library-shell">
        <section className="library-heading" aria-labelledby="library-title">
          <div>
            <p className="library-eyebrow"><span aria-hidden="true">●</span> مركز تدريب محلّل الأمن</p>
            <h1 id="library-title" ref={heading} tabIndex={-1}>مكتبة التحقيقات<span>.</span></h1>
            <p className="library-intro">اختر الحادثة التي تريد حلّها، أو ابدأ مهمة عشوائية من دورتك الحالية. كل قرار فرصة لتطوير مهاراتك.</p>
            <div className="library-share"><ShareLink url={getShareURL({ view: "library" })} label="نسخ رابط المكتبة" /></div>
          </div>
          <button className="primary-button library-random" onClick={() => onStart(null)}>ابدأ تحقيقًا عشوائيًا <span aria-hidden="true">←</span></button>
        </section>
        <section className="library-stats" aria-label="ملخص تقدّمك">
          <article><span>تحقيقات مكتملة</span><strong data-testid="completed-count">{completedCount}<small> / {cases.length}</small></strong><p>من مكتبة التدريب</p></article>
          <article><span>رصيد الخبرة</span><strong data-testid="library-xp">{level.xp}<small> XP</small></strong><p>{level.title} · المستوى {level.level}</p></article>
          <article><span>أفضل نتيجة مسجّلة</span><strong>{best ?? "—"}{best !== null && <small> / 70</small>}</strong><p>{best !== null ? "واصل التدريب لتحسين نتيجتك" : "تظهر بعد إكمال أول محاولة مسجّلة"}</p></article>
          <article><span>محاولات مسجّلة</span><strong>{attempts}</strong><p>كل محاولة تعزّز خبرتك</p></article>
        </section>
        <section className="library-progress" aria-labelledby="progress-title">
          <div><h2 id="progress-title">رحلتك في التحقيق</h2><p>{completedCount === cases.length ? "أكملت المكتبة! يمكنك إعادة أي تحقيق أو بدء دورة عشوائية جديدة." : `بقيت ${cases.length - completedCount} قضية لتكمل مكتبة التدريب.`}</p></div>
          <div className="library-progress-meter"><span>{progress}% مكتمل</span><progress value={completedCount} max={cases.length || 1} aria-label="نسبة التحقيقات المكتملة" /></div>
          <p className="library-storage-note">تُحفظ نتائجك على هذا الجهاز عند توفر التخزين المحلي؛ وإلا تبقى خلال الجلسة فقط.</p>
        </section>
        <section className="learning-plan" aria-labelledby="learning-plan-title">
          <div className="library-section-title"><div><p className="library-eyebrow">تعلّم بخطوة واضحة</p><h2 id="learning-plan-title">ما التحقيق المناسب لك الآن؟</h2></div></div>
          <p className="learning-plan-intro">اقتراحات مبنية على إنجازك وأفضل نتائجك المسجّلة على هذا الجهاز. اختر ما يناسبك، أو استعرض المكتبة كاملة.</p>
          {learningPlan.allScoredPerfect && <p className="learning-plan-complete">وصلت إلى النتيجة الكاملة في كل تحقيقات المكتبة الحالية. راجع اقتراح اليوم للحفاظ على مهارة التحليل.</p>}
          {learningPlan.recommendations.length > 0 && <div className="learning-recommendations">
            {learningPlan.recommendations.map(item => {
              const details = getCaseDetails(item.caseData);
              return <article className={`learning-suggestion suggestion-${item.type}`} key={item.type} data-suggestion={item.type}>
                <span className="learning-suggestion-label">{suggestionLabels[item.type]}</span>
                <div className="learning-suggestion-meta"><span>{details.categoryLabel}</span><span>{details.difficultyLabel}</span></div>
                <h3>{details.title}</h3>
                <p>{item.reason}</p>
                <button type="button" className="case-start" onClick={() => onStart(item.caseData)} aria-label={`${item.type === "new" ? "بدء" : "فتح"} التحقيق المقترح: ${details.title}`}>
                  {item.type === "review" || item.type === "record" ? "أعد التحقيق" : "ابدأ التحقيق"}<span aria-hidden="true">←</span>
                </button>
              </article>;
            })}
          </div>}
          <details className="learning-skill-details">
            <summary>خريطة تقدّمك حسب المجال <span aria-hidden="true">＋</span></summary>
            <div className="learning-skill-content">
              <p className="learning-coverage-note">النسبة هي مجموع أفضل نتائجك من النقاط المتاحة في تحقيقات كل مجال؛ تعكس تغطية مكتبة التدريب، وليست تقييمًا مهنيًا لمستواك.</p>
              <div className="learning-skill-grid">
                {learningPlan.skills.map(skill => <article className="learning-skill" key={skill.id}>
                  <h3>{skill.label}</h3>
                  <div className="learning-skill-score"><strong>{skill.percent}%</strong><span>{skill.points} / {skill.maxPoints} نقطة</span></div>
                  <progress value={skill.points} max={skill.maxPoints || 1} aria-label={`تغطية نقاط ${skill.label}`} />
                  <p>{skill.scoredCount} من {skill.caseCount} تحقيقًا بنتيجة مسجّلة</p>
                  {skill.unscoredCount > 0 && <small>{skill.unscoredCount} مكتملة سابقًا دون نتيجة مسجّلة</small>}
                </article>)}
              </div>
            </div>
          </details>
        </section>
        <section aria-labelledby="cases-title">
          <div className="library-section-title"><div><p className="library-eyebrow">ملفات الحوادث</p><h2 id="cases-title">مهمتك التالية تبدأ هنا</h2></div><span className="library-result-count" aria-live="polite">{visibleCases.length} من {cases.length} تحقيقًا</span></div>
          <div className="library-filters" role="search" aria-label="البحث في التحقيقات">
            <label className="library-search"><span>ابحث عن تحقيق</span><input type="search" placeholder="عنوان، نوع الحادثة، أو رقم القضية…" value={query} onChange={event => setQuery(event.target.value)} /></label>
            <label><span>المستوى</span><select aria-label="المستوى" value={difficulty} onChange={event => setDifficulty(event.target.value)}><option value="all">كل المستويات</option>{DIFFICULTIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label><span>المجال</span><select aria-label="المجال" value={category} onChange={event => setCategory(event.target.value)}><option value="all">كل المجالات</option>{CATEGORIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label><span>حالة الإنجاز</span><select aria-label="حالة الإنجاز" value={status} onChange={event => setStatus(event.target.value)}><option value="all">كل التحقيقات</option><option value="new">لم تكتمل بعد</option><option value="completed">مكتملة</option></select></label>
          </div>
          {visibleCases.length ? <div className="case-grid">
            {visibleCases.map(caseData => {
              const details = getCaseDetails(caseData);
              const result = results[caseData.id];
              const isCompleted = completed.has(caseData.id);
              return <article className={`case-card ${isCompleted ? "case-completed" : ""}`} key={caseData.id} data-case-id={caseData.id}>
                <div className="case-card-top"><span className="case-category">{details.categoryLabel}</span><span className={`case-status ${isCompleted ? "is-complete" : ""}`}>{isCompleted ? "✓ مكتملة" : "جاهزة للتحقيق"}</span></div>
                <div className="case-code"><span>{caseData.id}</span><span className={`case-difficulty difficulty-${details.difficulty}`}>{details.difficultyLabel}</span></div>
                <h3>{details.title}</h3><p className="case-description">{caseData.brief}</p>
                <div className="case-facts"><span>{caseData.evidenceOptions.length} خيارات للأدلة</span><span>حتى 70 XP</span></div>
                <div className="case-record">
                  {result ? <><dl><div><dt>أفضل نتيجة</dt><dd>{result.bestScore} / 70</dd></div><div><dt>آخر نتيجة</dt><dd>{result.lastScore} / 70</dd></div><div><dt>المحاولات</dt><dd>{result.attempts}</dd></div></dl><p>آخر إكمال: <time dateTime={result.lastCompletedAt}>{dateFormat.format(new Date(result.lastCompletedAt))}</time></p></> : <p>{isCompleted ? "مكتملة سابقًا. أعد التحقيق لتسجيل نتيجتك وتتبّع تحسّنك." : "حلّل السجلات، حدّد الدليل، ثم اتخذ قرارك."}</p>}
                </div>
                <div className="case-actions">
                  <button className="case-start" onClick={() => onStart(caseData)} aria-label={`${isCompleted ? "إعادة" : "بدء"} تحقيق: ${details.title}`}>{isCompleted ? "أعد التحقيق" : "ابدأ التحقيق"}<span aria-hidden="true">←</span></button>
                  <ShareLink url={getShareURL({ view: "investigation", caseId: caseData.id })} label={`نسخ رابط ${caseData.id}`} />
                </div>
              </article>;
            })}
          </div> : <div className="library-empty" role="status"><span aria-hidden="true">⌕</span><h3>لا توجد تحقيقات تطابق بحثك</h3><p>جرّب كلمة أخرى أو وسّع خيارات التصفية.</p><button className="secondary-button" onClick={clearFilters}>مسح البحث والتصفية</button></div>}
        </section>
      </main>
      <footer className="library-footer"><span>CyberTrace / Training Operations</span><a className="library-partner-link" href={partner.url} target="_blank" rel="noopener" onClick={() => trackEvent("partner_click", { destination: "blackbox", context: "library" })}>مسارات التدريب العملي في BlackBox-Lab ↗</a><p>تدرّب. حقّق. اتخذ القرار.</p></footer>
    </div>
  );
}

export default InvestigationLibrary;
