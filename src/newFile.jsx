return (
  <div className="app" dir="rtl">
    <nav className="navbar">
      <div className="logo">
        <span className="logo-mark">CT</span>
        <span>CyberTrace</span>
      </div>

      <div className="nav-links">
        <a href="#about">عن المنصة</a>
        <a href="#how">كيف تعمل؟</a>
      </div>

      <button className="nav-button">تسجيل الدخول</button>
    </nav>

    <main>
      <section className="hero">
        <div className="hero-content">
          <div className="badge">
            <span className="status-dot"></span>
            منصة تدريب الأمن السيبراني
          </div>

          <h1>
            لا تكتفِ بتعلّم الأمن السيبراني.
            <span> عِش التحقيق.</span>
          </h1>

          <p className="hero-description">
            CyberTrace منصة تدريب تفاعلية تضعك داخل حوادث أمنية
            واقعية، وتطلب منك تحليل الأدلة، قراءة السجلات، واتخاذ القرار
            الصحيح.
          </p>

          <button className="primary-button" onClick={() => setPage("investigation")}>
            ابدأ أول تحقيق
            <span>←</span>
          </button>

          <button className="secondary-button">
            اكتشف كيف تعمل
          </button>
        </div>

        <div className="hero-stats">
          <div>
            <strong>01</strong>
            <span>تحقيقات واقعية</span>
          </div>

          <div>
            <strong>24/7</strong>
            <span>تدريب متاح</span>
          </div>

          <div>
            <strong>XP</strong>
            <span>نظام تطور</span>
          </div>
        </div>
      </section>

      <div className="terminal-card">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <span>cybertrace://investigation</span>
        </div>

        <div className="terminal-body">
          <p className="terminal-line">
            <span className="green">$</span> investigation --start
          </p>

          <p className="terminal-muted">
            Initializing incident...
          </p>

          <div className="incident-box">
            <span className="incident-label">INCIDENT</span>
            <strong>Suspicious Login Detected</strong>
            <small>Severity: HIGH</small>
          </div>

          <p className="terminal-line">
            <span className="green">✓</span> Evidence collected
          </p>

          <p className="terminal-line">
            <span className="yellow">!</span> Analyst decision required
          </p>

          <div className="terminal-input">
            <span>&gt;</span>
            <span className="cursor"></span>
          </div>
        </div>
      </div>

      <div className="terminal-card">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <span>cybertrace://investigation</span>
        </div>

        <div className="terminal-body">
          <p className="terminal-line">
            <span className="green">$</span> investigation --start
          </p>

          <p className="terminal-muted">
            Initializing incident...
          </p>

          <div className="incident-box">
            <span className="incident-label">INCIDENT</span>
            <strong>Suspicious Login Detected</strong>
            <small>Severity: HIGH</small>
          </div>

          <p className="terminal-line">
            <span className="green">✓</span> Evidence collected
          </p>

          <p className="terminal-line">
            <span className="yellow">!</span> Analyst decision required
          </p>

          <div className="terminal-input">
            <span>&gt;</span>
            <span className="cursor"></span>
          </div>
        </div>
      </div>
    </main>

    <section className="features" id="about">
      <div className="section-heading">
        <span>01 — لماذا CyberTrace؟</span>
        <h2>تعلّم من خلال التحقيق، وليس الحفظ.</h2>
      </div>

      <div className="feature-grid">
        <article className="feature-card">
          <div className="feature-number">01</div>
          <h3>سيناريوهات واقعية</h3>
          <p>
            تعامل مع حوادث تحاكي بيئة العمل الحقيقية بدل الأسئلة
            النظرية التقليدية.
          </p>
        </article>

        <article className="feature-card">
          <div className="feature-number">02</div>
          <h3>حلّل الأدلة</h3>
          <p>
            اقرأ Logs وحلل الأدلة الرقمية واكتشف ما حدث قبل اتخاذ
            قرارك.
          </p>
        </article>

        <article className="feature-card">
          <div className="feature-number">03</div>
          <h3>طوّر مستواك</h3>
          <p>
            احصل على XP ونقاط، وتابع تقدمك وانتقل تدريجيًا إلى
            تحقيقات أكثر صعوبة.
          </p>
        </article>
      </div>
    </section><section className="how" id="how">
      <div className="section-heading">
        <span>02 — كيف تعمل؟</span>
        <h2>ثلاث خطوات تفصلك عن أول تحقيق.</h2>
      </div>

      <div className="steps">
        <div className="step">
          <span>01</span>
          <h3>ابدأ التحقيق</h3>
          <p>استلم الحادثة واعرف المطلوب منك كمحلل.</p>
        </div>

        <div className="step">
          <span>02</span>
          <h3>حلّل الأدلة</h3>
          <p>افحص السجلات والأدلة وابحث عن المؤشرات المشبوهة.</p>
        </div>

        <div className="step">
          <span>03</span>
          <h3>اتخذ القرار</h3>
          <p>حدد الإجراء الصحيح واحصل على تقييم لأدائك.</p>
        </div>
      </div>
    </section><section className="how" id="how">
      <div className="section-heading">
        <span>02 — كيف تعمل؟</span>
        <h2>ثلاث خطوات تفصلك عن أول تحقيق.</h2>
      </div>

      <div className="steps">
        <div className="step">
          <span>01</span>
          <h3>ابدأ التحقيق</h3>
          <p>استلم الحادثة واعرف المطلوب منك كمحلل.</p>
        </div>

        <div className="step">
          <span>02</span>
          <h3>حلّل الأدلة</h3>
          <p>افحص السجلات والأدلة وابحث عن المؤشرات المشبوهة.</p>
        </div>

        <div className="step">
          <span>03</span>
          <h3>اتخذ القرار</h3>
          <p>حدد الإجراء الصحيح واحصل على تقييم لأدائك.</p>
        </div>
      </div>
    </section><footer>
      <div className="logo">
        <span className="logo-mark">CT</span>
        <span>CyberTrace</span>
      </div>

      <p>Train. Investigate. Defend.</p>
    </footer>
  </div>
);
