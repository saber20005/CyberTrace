import logo from "../assets/logo.svg";
import ProMembershipPanel from "../components/ProMembershipPanel";
import "./Pro.css";

const futureFeatures = [
  ["مناوبات SOC موسعة بتقييم خادمي", "مناوبات جديدة متعددة المراحل، مع تقييم يُتحقق منه على الخادم بعد إنجاز البنية الأمنية."],
  ["تحقيقات متقدمة مترابطة", "سيناريوهات جديدة لربط الأحداث والأدلة والتحقيقات عبر مراحل متصلة."],
  ["تقارير أداء موسّعة", "قراءة أعمق لمهارات التحليل والاستجابة بعد تأسيس نتائج موثوقة."],
  ["تطبيق عملي مع BLACKBOX", "مسارات تدريب مكملة تربط تحليل الحادثة بالتجربة العملية في المختبر."],
];

const currentFeatures = [
  "مكتبة التحقيقات الحالية والتقدم ونقاط XP",
  "مركز التحقيق المتقدم وأدوات تحليل الأدلة",
  "ثلاث مناوبات SOC تدريبية بمستويات مختلفة",
  "المزامنة القائمة وربط مهارات BLACKBOX الحالي",
];

export default function Pro({ embedded = false, onHome, onLibrary, onSoc, onVerify }) {
  return <div className="suite-pro-page" dir="rtl">
    {!embedded && <header className="suite-pro-nav">
      <button type="button" className="suite-pro-logo" onClick={onHome} aria-label="العودة إلى الرئيسية">
        <img src={logo} alt="" />
        <span>CyberTrace</span>
      </button>
      <nav className="suite-pro-nav-actions" aria-label="صفحات التدريب">
        <button type="button" onClick={onLibrary}>التحقيقات</button>
        <button type="button" onClick={onSoc}>مناوبات SOC</button>
        <a href="https://blackboxlab.dev/pro.html" target="_blank" rel="noopener noreferrer">BLACKBOX ↗</a>
      </nav>
    </header>}

    <main className="suite-pro-main">
      <section className="suite-pro-hero" aria-labelledby="suite-pro-title">
        <span className="suite-pro-status"><span aria-hidden="true" className="suite-pro-status-dot" /> الاشتراك الموحّد قيد التطوير — لا يوجد دفع حاليًا</span>
        <p className="suite-pro-eyebrow">CYBERTRACE × BLACKBOX / ONE LEARNING JOURNEY</p>
        <h1 id="suite-pro-title">تحقيقات أعمق.<br /><span>تدريب عملي أقوى.</span></h1>
        <p className="suite-pro-lead">نبني تجربة تجمع التحقيق في الحوادث الأمنية داخل CyberTrace مع المختبرات العملية في BLACKBOX، من دون إلغاء ما هو مجاني اليوم.</p>
        <div className="suite-pro-hero-actions">
          <button type="button" className="suite-pro-button suite-pro-button-primary" onClick={onSoc}>استكشف مناوبات SOC <span aria-hidden="true">←</span></button>
          <button type="button" className="suite-pro-button suite-pro-button-outline" onClick={onLibrary}>تصفح مكتبة التحقيقات</button>
        </div>
        <p className="suite-pro-hero-note">التجربة الحالية مجانية · لا اشتراك ولا بطاقة دفع · الدرجات الحالية تدريبية وغير موثّقة خادميًا</p>
      </section>

      <section className="suite-pro-plans" aria-labelledby="suite-pro-plans-title">
        <div className="suite-pro-section-heading">
          <div>
            <span className="suite-pro-kicker">الخطة الحالية والمستقبلية</span>
            <h2 id="suite-pro-plans-title">اختر ما تريد تعلمه، لا ما يجب عليك دفعه.</h2>
          </div>
          <p>التفريق واضح بين الأدوات المنشورة فعلًا والميزات التي ما زلنا نطوّرها.</p>
        </div>

        <div className="suite-pro-grid">
          <article className="suite-pro-card suite-pro-free">
            <div className="suite-pro-card-top">
              <span className="suite-pro-plan-label">متاحة الآن</span>
              <span className="suite-pro-plan-marker">FREE ACCESS</span>
            </div>
            <h3>Free</h3>
            <p className="suite-pro-card-intro">تدريب حقيقي ومفيد دون قيود مدفوعة على المحتوى الحالي.</p>
            <ul className="suite-pro-feature-list">{currentFeatures.map(feature => <li key={feature}>{feature}</li>)}</ul>
            <div className="suite-pro-card-actions" aria-label="الخيارات المجانية">
              <button type="button" className="suite-pro-button suite-pro-button-primary" onClick={onLibrary}>
                <span>استكشف التحقيقات المجانية</span><span aria-hidden="true">←</span>
              </button>
              <button type="button" className="suite-pro-button suite-pro-button-secondary" onClick={onSoc}>
                <span>جرّب مناوبة SOC التدريبية</span><span aria-hidden="true">←</span>
              </button>
            </div>
          </article>

          <article className="suite-pro-card suite-pro-planned">
            <div className="suite-pro-card-top">
              <span className="suite-pro-plan-label">قيد التطوير</span>
              <span className="suite-pro-plan-marker">FUTURE RELEASE</span>
            </div>
            <h3>Suite <span>Pro</span></h3>
            <p className="suite-pro-card-intro">ميزات جديدة أكثر عمقًا، وليست إقفالًا لميزات المستخدمين الحاليين.</p>
            <ul className="suite-pro-feature-list suite-pro-planned-features">
              {futureFeatures.map(([title, detail]) => <li key={title}><strong>{title}</strong><small>{detail}</small></li>)}
            </ul>
            <div className="suite-pro-coming" role="note">
              <strong>لم يبدأ البيع بعد</strong>
              <p>لا توجد مدفوعات أو تجربة اشتراك أو سعر نهائي أو صلاحيات Pro مفعّلة الآن.</p>
              <button type="button" className="suite-pro-verify-link" onClick={onVerify}>اطّلع على محرك التقييم الخادمي قيد التجهيز ←</button>
            </div>
          </article>
        </div>
      </section>

      <section className="suite-pro-journey" aria-labelledby="suite-journey-title">
        <div>
          <span className="suite-pro-kicker">من التحقيق إلى التطبيق</span>
          <h2 id="suite-journey-title">رحلتك التعليمية بين المنصتين</h2>
          <p>ابدأ بتحليل الأدلة، اختبر قراراتك في مناوبة SOC، ثم انتقل إلى مسارات BLACKBOX العملية. الروابط التعليمية متاحة الآن، لكن لا يوجد نظام اشتراكات مدفوعة مشترك بعد.</p>
        </div>
        <div className="suite-pro-journey-steps">
          <div><span>01</span><strong>حلّل</strong><small>CyberTrace</small></div>
          <div><span>02</span><strong>استجب</strong><small>SOC Shift</small></div>
          <div><span>03</span><strong>طبّق</strong><small>BLACKBOX</small></div>
        </div>
      </section>

      <ProMembershipPanel />

      <section className="suite-pro-safety">
        <div className="suite-pro-safety-icon" aria-hidden="true">◇</div>
        <div>
          <h2>أمان الحسابات والتقدم أولًا</h2>
          <p>يستخدم CyberTrace وBLACKBOX مشروعَي Firebase مستقلين؛ لذلك لا نعتمد على تطابق البريد لربط الحسابات. حقوق الاشتراك المستقبلية ستُراجع من الخادم، بينما تبقى بيانات المستخدمين وميزات التدريب المجانية كما هي.</p>
          <a href="https://blackboxlab.dev/pro.html" target="_blank" rel="noopener noreferrer">اطّلع على الخطة في BLACKBOX <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </main>

    {!embedded && <footer className="suite-pro-footer"><span>CyberTrace × BLACKBOX</span><span>تدريب عملي. قرارات أفضل. دون وعود مدفوعة مبكرة.</span></footer>}
  </div>;
}
