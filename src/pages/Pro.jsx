import "./Pro.css";

const futureFeatures = [
  ["مناوبات SOC متسلسلة", "تحليل أكثر من تنبيه في جلسة واحدة وتحديد أولويات الاستجابة."],
  ["تحقيقات متقدمة مترابطة", "ربط الأدلة والفرضيات عبر سيناريوهات جديدة منفصلة عن المحتوى المجاني."],
  ["تقارير أداء موسّعة", "تقييم مهارات إضافي بعد توفير درجات موثوقة من الخادم."],
  ["تطبيق عملي مع BLACKBOX", "الانتقال إلى تمارين متقدمة مكملة للتحقيقات."],
];

export default function Pro({ onHome, onLibrary, onSoc }) {
  return <div className="suite-pro-page" dir="rtl">
    <nav className="suite-pro-nav" aria-label="التنقل">
      <button type="button" onClick={onHome}>CyberTrace</button>
      <a href="https://blackboxlab.dev/pro.html" target="_blank" rel="noopener noreferrer">BLACKBOX Pro ↗</a>
    </nav>
    <main>
      <section className="suite-pro-hero">
        <span className="suite-pro-status">قيد التطوير · لا يوجد اشتراك مدفوع متاح الآن</span>
        <p className="suite-pro-eyebrow">ONE JOURNEY. TWO LABS.</p>
        <h1>CyberTrace <span>×</span> BLACKBOX <strong>Pro</strong></h1>
        <p>نطوّر اشتراكًا واحدًا يربط التحقيق في الحوادث الأمنية بالتدريب العملي. ما تراه هنا خريطة منتج مستقبلية، وليست صفحة شراء.</p>
      </section>
      <section className="suite-pro-grid" aria-label="المجاني والنسخة المستقبلية">
        <article className="suite-pro-card">
          <span>متاح حاليًا</span><h2>Free</h2>
          <p>نحافظ على المحتوى والتقدّم والأدوات المجانية الحالية دون سحبها لإجبار المستخدم على الدفع.</p>
          <ul><li>مكتبة التحقيقات الحالية وXP</li><li>مركز التحقيق المتقدم المتاح حاليًا</li><li>تقدّم CyberTrace وربط BLACKBOX القائم</li><li>مسارات التدريب والتقارير المجانية</li></ul>
          <button type="button" onClick={onLibrary}>استكشف التحقيقات المجانية ←</button>
          <button type="button" onClick={onSoc}>جرّب مناوبة SOC التدريبية ←</button>
        </article>
        <article className="suite-pro-card planned">
          <span>ميزات مخطط لها، لا تتوفر للبيع</span><h2>Suite Pro</h2>
          <p>بدأت تجربة مناوبة SOC تعليمية مجانية؛ بقية الميزات المدفوعة وتقييمها الموثوق ما زالت قيد التطوير.</p>
          <ul>{futureFeatures.map(([title,detail]) => <li key={title}><strong>{title}</strong><small>{detail}</small></li>)}</ul>
          <p className="suite-pro-disclaimer">لا توجد مدفوعات أو تجربة اشتراك أو سعر نهائي أو صلاحيات Pro مفعّلة الآن.</p>
        </article>
      </section>
      <section className="suite-pro-safety">
        <h2>اشتراك موحّد، دون خلط الحسابات</h2>
        <p>يستخدم CyberTrace وBLACKBOX مشروعَي Firebase مستقلين. لن نستنتج أن حسابين متطابقان من البريد فقط. ستعتمد العضوية مستقبلًا على هوية BLACKBOX بعد تحقق آمن على الخادم؛ ولا تتغير بيانات التحقيقات والتقدّم والمزامنة الحالية.</p>
        <a href="https://blackboxlab.dev/pro.html" target="_blank" rel="noopener noreferrer">اطّلع على التصور من BLACKBOX ↗</a>
      </section>
    </main>
    <footer>CyberTrace × BLACKBOX · بناء تدريجي قبل تفعيل الاشتراكات</footer>
  </div>;
}
