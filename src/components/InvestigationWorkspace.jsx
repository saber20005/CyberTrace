import { useState } from "react";
import { WORKSPACE_EVENTS, WORKSPACE_FILTERS, WORKSPACE_HYPOTHESES, filterWorkspaceEvents } from "../data/investigationWorkspace.js";
import { createWorkspaceNotesReport, loadWorkspaceNotebook, saveWorkspaceNotebook, toggleWorkspacePin } from "../utils/workspaceNotes.js";
import "./InvestigationWorkspace.css";

export default function InvestigationWorkspace({ caseId }) {
  const [notebook, setNotebook] = useState(() => loadWorkspaceNotebook(caseId));
  const [filter, setFilter] = useState("الكل");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("evt-04");
  const [saveStatus, setSaveStatus] = useState("");
  const visible = filterWorkspaceEvents(WORKSPACE_EVENTS, filter, query);
  const selected = visible.find(event => event.id === selectedId) || visible[0] || null;

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
        <p>حلّل تسلسل الأحداث، قارن المؤشرات المتعارضة، وثبّت الأدلة المهمة قبل اختيار إجابتك.</p>
      </div>
      <span className="iw-count">{WORKSPACE_EVENTS.length} حدثًا</span>
    </div>

    <div className="iw-controls">
      <label className="iw-search-label" htmlFor="iw-event-search">البحث في سجلات المحاكاة
        <input id="iw-event-search" type="search" value={query} onChange={event => setQuery(event.target.value)}
          placeholder="عنوان IP، خدمة، توقيت، حدث..." autoComplete="off" />
      </label>
      <div className="iw-filters" role="group" aria-label="تصفية الأحداث حسب النوع">
        {WORKSPACE_FILTERS.map(value => <button key={value} type="button" className={filter === value ? "active" : ""}
          aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}
      </div>
    </div>

    <div className="iw-grid">
      <div className="iw-timeline">
        <div className="iw-panel-title"><strong>الخط الزمني</strong><span>{visible.length} / {WORKSPACE_EVENTS.length}</span></div>
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
            onClick={() => changeNotebook(state => toggleWorkspacePin(state, selected.id))}>
            {notebook.pinned.includes(selected.id) ? "إزالة من الأدلة المثبّتة" : "ثبّت هذا السجل كدليل"} ({notebook.pinned.length}/6)
          </button>
        </> : <p className="iw-empty">اختر حدثًا من السجل لعرض تفاصيله.</p>}
        <div className="iw-context"><strong>ملاحظة تحليلية</strong><p>الارتباط الزمني مؤشر يستدعي الفحص؛ لا تعدّ جغرافيا IP أو التنبيه الآلي وحدهما إثباتًا قاطعًا للاختراق.</p></div>
      </div>
    </div>

    <div className="iw-notebook">
      <div className="iw-panel-title"><strong>دفتر فرضيات المحلّل</strong><span>{notebook.pinned.length} أدلة مثبتة</span></div>
      <label htmlFor="iw-hypothesis">الفرضية الحالية</label>
      <select id="iw-hypothesis" value={notebook.hypothesis}
        onChange={event => changeNotebook({ ...notebook, hypothesis: event.target.value })}>
        {WORKSPACE_HYPOTHESES.map(option => <option key={option} value={option}>{option}</option>)}
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
