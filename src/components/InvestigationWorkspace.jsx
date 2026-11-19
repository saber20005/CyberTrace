import { useState } from "react";
import { getWorkspaceCase, correlateWorkspaceEvents, filterWorkspaceEvents } from "../data/investigationWorkspace.js";
import { createWorkspaceNotesReport, loadWorkspaceNotebook, saveWorkspaceNotebook, toggleWorkspacePin } from "../utils/workspaceNotes.js";
import "./InvestigationWorkspace.css";

export default function InvestigationWorkspace({ caseId }) {
  const workspace = getWorkspaceCase(caseId);
  const [notebook, setNotebook] = useState(() => loadWorkspaceNotebook(caseId));
  const [filter, setFilter] = useState("الكل");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => workspace.events[Math.min(3, workspace.events.length - 1)].id);
  const [comparisonIds, setComparisonIds] = useState(["", ""]);
  const [saveStatus, setSaveStatus] = useState("");
  const visible = filterWorkspaceEvents(workspace.events, filter, query);
  const selected = visible.find(event => event.id === selectedId) || visible[0] || null;
  const pinnedEvents = notebook.pinned.map(id => workspace.events.find(event => event.id === id)).filter(Boolean);
  const firstId = pinnedEvents.find(event => event.id === comparisonIds[0])?.id || pinnedEvents[0]?.id;
  const secondId = pinnedEvents.find(event => event.id === comparisonIds[1] && event.id !== firstId)?.id || pinnedEvents.find(event => event.id !== firstId)?.id;
  const comparison = correlateWorkspaceEvents(caseId, firstId, secondId);

  const changeNotebook = update => {
    const next = typeof update === "function" ? update(notebook) : update;
    setNotebook(next);
    try {
      saveWorkspaceNotebook(caseId, next);
      setSaveStatus("حُفظت ملاحظات هذا المتصفح.");
    } catch {
      setSaveStatus("تعذّر الحفظ على هذا الجهاز؛ الملاحظات باقية حتى تغادر هذه الصفحة. انسخها قبل المغادرة.");
    }
  };

  const downloadNotes = () => {
    const report = createWorkspaceNotesReport(caseId, notebook);
    if (!report) return;
    let url, link;
    try {
      url = URL.createObjectURL(new Blob([report], { type: "text/markdown;charset=utf-8" }));
      link = document.createElement("a");
      link.href = url;
      link.download = "cybertrace-" + caseId + "-analyst-notes.md";
      document.body.appendChild(link);
      link.click();
      setSaveStatus("جُهّز سجل الأدلة والفرضيات للتنزيل.");
    } catch {
      setSaveStatus("تعذّر تنزيل التقرير. يمكنك نسخ الملاحظات والأدلة يدويًا.");
    } finally {
      link?.remove();
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  return <section className="iw-workspace" aria-labelledby="iw-heading">
    <div className="iw-heading">
      <div>
        <span className="iw-eyebrow">CYBERTRACE / INVESTIGATION WORKSPACE · PILOT</span>
        <h2 id="iw-heading">مركز التحقيق المتقدم</h2>
        <p>{workspace.summary}</p>
      </div>
      <span className="iw-count">{workspace.events.length} حدثًا</span>
    </div>

    <div className="iw-controls">
      <label className="iw-search-label" htmlFor="iw-event-search">البحث في سجلات المحاكاة
        <input id="iw-event-search" type="search" value={query} onChange={event => setQuery(event.target.value)}
          placeholder="عنوان IP، خدمة، توقيت، حدث..." autoComplete="off" />
      </label>
      <div className="iw-filters" role="group" aria-label="تصفية الأحداث حسب النوع">
        {workspace.filters.map(value => <button key={value} type="button" className={filter === value ? "active" : ""}
          aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}
      </div>
    </div>

    <div className="iw-grid">
      <div className="iw-timeline">
        <div className="iw-panel-title"><strong>الخط الزمني</strong><span>{visible.length} / {workspace.events.length}</span></div>
        <div className="iw-events">
          {visible.map(event => <button type="button" key={event.id}
            className={`iw-event ${selected?.id === event.id ? "selected" : ""}`}
            aria-pressed={selected?.id === event.id} onClick={() => setSelectedId(event.id)}>
            <span className="iw-time" dir="ltr">{event.time}</span>
            <span className="iw-event-body"><strong>{event.title}</strong><small>{event.source} · {event.category}</small></span>
            {notebook.pinned.includes(event.id) && <span className="iw-pin-mark" aria-label="مثبّت">◆</span>}
          </button>)}
          {!visible.length && <p className="iw-empty">لا توجد أحداث تطابق البحث أو الفلتر الحالي.</p>}
        </div>
      </div>

      <div className="iw-inspector">
        <div className="iw-panel-title"><strong>فحص الدليل</strong><span>{selected?.id || "—"}</span></div>
        {selected ? <>
          <span className="iw-source">{selected.source.toUpperCase()} · {selected.category}</span>
          <h3>{selected.title}</h3>
          <p>{selected.detail}</p>
          <pre dir="ltr" className="iw-raw">{selected.raw}</pre>
          <button type="button" className="iw-pin-button" aria-pressed={notebook.pinned.includes(selected.id)}
            onClick={() => changeNotebook(state => toggleWorkspacePin(state, selected.id, caseId))}>
            {notebook.pinned.includes(selected.id) ? "إزالة من الأدلة المثبّتة" : "ثبّت هذا السجل كدليل"} ({notebook.pinned.length}/6)
          </button>
        </> : <p className="iw-empty">اختر حدثًا من السجل لعرض تفاصيله.</p>}
        <div className="iw-context"><strong>ملاحظة تحليلية</strong><p>{workspace.caution}</p></div>
      </div>
    </div>

    <section className="iw-correlation" aria-labelledby="iw-correlation-heading">
      <div className="iw-panel-title"><strong id="iw-correlation-heading">مقارنة الأدلة المثبّتة</strong><span>تحليل الارتباط الزمني</span></div>
      {pinnedEvents.length >= 2 ? <>
        <div className="iw-compare-controls">
          <label htmlFor="iw-first-event">الحدث الأول
            <select id="iw-first-event" value={firstId} onChange={event => setComparisonIds([event.target.value, secondId])}>
              {pinnedEvents.map(event => <option value={event.id} key={event.id}>{event.time} · {event.title}</option>)}
            </select>
          </label>
          <label htmlFor="iw-second-event">الحدث الثاني
            <select id="iw-second-event" value={secondId} onChange={event => setComparisonIds([firstId, event.target.value])}>
              {pinnedEvents.filter(event => event.id !== firstId).map(event => <option value={event.id} key={event.id}>{event.time} · {event.title}</option>)}
            </select>
          </label>
        </div>
        {comparison && <p className="iw-compare-result">الحدث «{comparison.first.title}» سبق «{comparison.second.title}» بمقدار <strong>{comparison.secondsApart} ثانية</strong>.</p>}
      </> : <p className="iw-empty">ثبّت حدثين على الأقل من السجل لبدء مقارنة زمنية بينهما.</p>}
      <p className="iw-compare-warning">التتابع الزمني لا يثبت السببية؛ تحقق من مصدر الجلسة أو التغيير قبل اتخاذ قرار نهائي.</p>
    </section>

    <div className="iw-notebook">
      <div className="iw-panel-title"><strong>دفتر فرضيات المحلّل</strong><span>{notebook.pinned.length} أدلة مثبتة</span></div>
      <label htmlFor="iw-hypothesis">الفرضية الحالية</label>
      <select id="iw-hypothesis" value={notebook.hypothesis}
        onChange={event => changeNotebook({ ...notebook, hypothesis: event.target.value })}>
        {workspace.hypotheses.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      <label htmlFor="iw-notes">ما الذي تؤيده السجلات؟ وما الذي ما زال بحاجة إلى تحقق؟</label>
      <textarea id="iw-notes" value={notebook.notes} maxLength={1200}
        onChange={event => changeNotebook({ ...notebook, notes: event.target.value })}
        rows={4} placeholder="دوّن فرضيتك، الأدلة المؤيدة والمعارضة، وخطوة التحقق التالية..." />
      <div className="iw-notebook-footer">
        <span>{notebook.notes.length}/1200 حرف</span>
        <button type="button" onClick={downloadNotes}>تنزيل سجل الأدلة والفرضيات (.md)</button>
      </div>
      <p className="iw-status" aria-live="polite" role="status">{saveStatus}</p>
      <p className="iw-disclaimer">الملاحظات والأدلة المثبّتة تُحفظ محليًا للحساب الحالي على هذا المتصفح فقط، ولا تدخل في XP أو سجلات BLACKBOX أو المزامنة السحابية. أما نتيجة التحقيق فتستمر بالمزامنة كالمعتاد.</p>
    </div>
  </section>;
}
