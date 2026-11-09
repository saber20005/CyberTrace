import { useState, useEffect } from "react";
import "./App.css";
import Auth from "./pages/Auth";
import Investigation from "./pages/Investigation";
import XPBadge from "./components/XPBadge";
import { CASES } from "./data/cases";
import { pickRandomCase } from "./utils/caseProgress";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import logo from "./assets/logo.svg";

function App() {
  const [view, setView] = useState("home"); // 'home' | 'auth' | 'investigation'
  const [selectedCase, setSelectedCase] = useState(null);
  const [investigationRun, setInvestigationRun] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  const goHome = () => setView("home");

  const handleLogout = () => {
    signOut(auth);
  };

  const startInvestigation = () => {
    setSelectedCase(pickRandomCase(CASES));
    setInvestigationRun((run) => run + 1);
    setView("investigation");
  };

  if (view === "auth") {
    return <Auth onBack={goHome} />;
  }

  if (view === "investigation" && selectedCase) {
    return (
      <Investigation
        key={investigationRun}
        caseData={selectedCase}
        onBack={goHome}
        onNext={startInvestigation}
      />
    );
  }

  return (
    <div className="app" dir="rtl">
      <nav className="navbar">
        <div className="logo" onClick={goHome} style={{ cursor: "pointer" }}>
          <img src={logo} alt="CyberTrace" className="logo-mark" />
          <span>CyberTrace</span>
        </div>

        <div className="nav-links">
          <a href="#about">عن المنصة</a>
          <a href="#how">كيف تعمل؟</a>
        </div>

        <div className="nav-right">
          <XPBadge />
          {user ? (
            <div className="nav-user">
              <span>مرحبًا، {user.displayName || user.email.split("@")[0]}</span>
              <button className="nav-logout" onClick={handleLogout}>
                خروج
              </button>
            </div>
          ) : (
            <button className="nav-button" onClick={() => setView("auth")}>
              تسجيل الدخول
            </button>
          )}
        </div>
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

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={startInvestigation}
              >
                ابدأ أول تحقيق
                <span>←</span>
              </button>

              <button
                className="secondary-button"
                onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
              >
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
        </section>

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
        </section>

        <section className="how" id="how">
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
        </section>
      </main>

      <footer>
        <div className="logo">
          <img src={logo} alt="CyberTrace" className="logo-mark" />
          <span>CyberTrace</span>
        </div>

        <p>Train. Investigate. Defend.</p>
      </footer>
    </div>
  );
}

export default App;
