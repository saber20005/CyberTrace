import { useState, useEffect, useRef, lazy, Suspense } from "react";
import "./App.css";
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Investigation = lazy(() => import("./pages/Investigation"));
const InvestigationLibrary = lazy(() => import("./pages/InvestigationLibrary"));
const Pro = lazy(() => import("./pages/Pro"));
const SocShift = lazy(() => import("./pages/SocShift"));
import XPBadge from "./components/XPBadge";
import LoadingScreen from "./components/LoadingScreen";
import { CASES } from "./data/cases";
import { pickRandomCase } from "./utils/caseProgress";
import { getCaseDetails } from "./data/caseCatalog";
import { createRouteURL, getBlackBoxLearningLink, readRoute } from "./utils/routes";
import { applyPageMetadata, describePage } from "./utils/pageMetadata";
import { trackEvent, trackPageView } from "./utils/analytics";
import { auth } from "./firebase";
import { setProgressOwner, legacyProgressAvailable, importLegacyProgress } from "./utils/progressScope";
import { onAuthStateChanged, signOut } from "firebase/auth";
import logo from "./assets/logo.svg";
import { startCloudSync, enableCloudSync, cloudSyncEnabled } from "./utils/cloudProgress";
import { useBlackBox } from "./blackbox/useBlackBox";
import BlackBoxAccountButton from "./blackbox/BlackBoxAccountButton";

function routeAtLocation() {
  return {
    ...readRoute(window.location.href, CASES),
    returnView: window.history.state?.cybertraceReturn === "home" ? "home" : "library",
  };
}

function trackStart(route, source) {
  const caseData = CASES.find(item => item.id === route.caseId);
  if (caseData) trackEvent("training_start", { case_id: caseData.id, difficulty: getCaseDetails(caseData).difficulty, source });
}

function App() {
  const blackBox = useBlackBox();
  const [route, setRoute] = useState(routeAtLocation);
  const [investigationRun, setInvestigationRun] = useState(0);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [legacyNotice, setLegacyNotice] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const syncNowRef = useRef(null);
  const [progressVersion, setProgressVersion] = useState(0);
  const initialVisitTracked = useRef(false);
  const { view, returnView } = route;
  const selectedCase = CASES.find(item => item.id === route.caseId);
  const partner = getBlackBoxLearningLink();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setProgressOwner(firebaseUser?.uid ?? null);
      window.dispatchEvent(new Event("cybertrace-progress-synced"));
      setSyncStatus("");
      setSyncEnabled(Boolean(firebaseUser && cloudSyncEnabled(firebaseUser.uid)));
      setUser(firebaseUser);
      setLegacyNotice(Boolean(firebaseUser && legacyProgressAvailable()));
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const refresh = () => setProgressVersion(n => n + 1);
    window.addEventListener("cybertrace-progress-synced", refresh);
    return () => window.removeEventListener("cybertrace-progress-synced", refresh);
  }, []);

  useEffect(() => {
    syncNowRef.current = null;
    if (!user || !syncEnabled) return undefined;
    const stop = startCloudSync(user.uid, setSyncStatus);
    syncNowRef.current = stop.syncNow;
    return () => {
      syncNowRef.current = null;
      stop();
    };
  }, [user, syncEnabled]);

  useEffect(() => {
    const initial = routeAtLocation();
    window.history.replaceState(window.history.state, "", createRouteURL(initial, window.location.href, { preserveHash: true }));
    if (initial.view === "investigation" && !initialVisitTracked.current) {
      initialVisitTracked.current = true;
      trackStart(initial, "direct_link");
    }
    const restore = () => {
      const next = routeAtLocation();
      window.history.replaceState(window.history.state, "", createRouteURL(next, window.location.href, { preserveHash: true }));
      setRoute(next);
      setInvestigationRun(run => run + 1);
      if (next.view === "investigation") trackStart(next, "history");
      if (!window.location.hash) window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    applyPageMetadata(describePage(route, CASES));
    trackPageView();
  }, [route]);

  const navigate = next => {
    window.history.pushState({ cybertraceReturn: next.returnView || "library" }, "", createRouteURL(next, window.location.href));
    setRoute(next);
    setInvestigationRun(run => run + 1);
    window.scrollTo(0, 0);
  };
  const goHome = () => navigate({ view: "home" });
  const goLibrary = () => navigate({ view: "library" });

  const enableSync = () => {
    if (!user) return;
    try {
      enableCloudSync(user.uid);
      setSyncStatus("جارٍ فتح اتصال CyberTrace السحابي...");
      setSyncEnabled(true);
    } catch (error) { setSyncStatus("تعذّر تفعيل المزامنة: " + error.message); }
  };

  const syncNow = async () => {
    if (syncBusy) return;
    if (!syncNowRef.current) { setSyncStatus("لم يجهز اتصال CyberTrace؛ تأكد من تسجيل الدخول وتفعيل المزامنة."); return; }
    setSyncBusy(true);
    try { await syncNowRef.current(); }
    catch (error) { setSyncStatus("فشلت المزامنة: " + (error.code || error.message)); }
    finally { setSyncBusy(false); }
  };

  const cloudSyncPanel = user ? <section aria-label="مزامنة تقدم CyberTrace" style={{margin:"1rem auto",padding:"1rem",maxWidth:900,border:"1px solid #4d728d",borderRadius:12}}>
    <strong>مزامنة تقدم CyberTrace بين الأجهزة</strong>
    <p role="status" aria-live="polite">{syncStatus || (syncEnabled ? "جارٍ الاتصال بسجل حسابك..." : "نتائج هذا الجهاز محلية. فعّل مزامنة هذا الحساب لاستعادتها على جهاز آخر.")}</p>
    {syncEnabled
      ? <button type="button" disabled={syncBusy} onClick={() => { void syncNow(); }}>{syncBusy ? "جارٍ التحقق..." : "مزامنة تقدم CyberTrace الآن"}</button>
      : <button type="button" onClick={enableSync}>تفعيل مزامنة هذا الحساب</button>}
    <p style={{fontSize:".85rem",opacity:".8"}}>هذه المزامنة تخص CyberTrace فقط. نتائج BLACKBOX منفصلة ولا تُنقل تلقائيًا.</p>
  </section> : null;

  const handleLogout = async () => {
    await Promise.allSettled([blackBox.disconnect(), signOut(auth)]);
  };

  const startInvestigation = (caseData = null, origin = "library", source = origin) => {
    const nextCase = caseData ?? pickRandomCase(CASES);
    if (!nextCase) return;
    const next = { view: "investigation", caseId: nextCase.id, returnView: origin };
    navigate(next);
    trackStart(next, source);
  };

  if (!authReady) return <LoadingScreen message="جارٍ التحقق من حساب التدريب..." />;

  if (view === "admin") {
    return <Suspense fallback={<LoadingScreen inline message="جارٍ التحقق من صلاحيات الإدارة..." />}><Admin user={user} onHome={goHome} /></Suspense>;
  }

  if (view === "auth") {
    return <Suspense fallback={<LoadingScreen inline message="جارٍ تحميل صفحة الحساب..." />}><Auth onBack={goHome} /></Suspense>;
  }

  if (view === "soc") {
    return <Suspense fallback={<LoadingScreen inline message="جارٍ فتح مناوبة SOC التدريبية..." />}><SocShift key={user?.uid ?? "guest"} onHome={goHome} onLibrary={goLibrary} onPro={() => navigate({ view: "pro" })} /></Suspense>;
  }
  if (view === "pro") {
    return <Suspense fallback={<LoadingScreen inline message="جارٍ تحميل خطة CyberTrace × BLACKBOX Pro..." />}><Pro onHome={goHome} onLibrary={goLibrary} onSoc={() => navigate({ view: "soc" })} /></Suspense>;
  }

  if (view === "library") {
    return <Suspense fallback={<LoadingScreen inline message="جارٍ تحميل مكتبة التحقيقات..." />}><InvestigationLibrary key={`${user?.uid ?? "guest"}:${progressVersion}`} cloudSyncPanel={cloudSyncPanel} cases={CASES} onStart={(caseData) => startInvestigation(caseData, "library")} onHome={goHome} /></Suspense>;
  }

  if (view === "investigation" && selectedCase) {
    return (
      <Suspense fallback={<LoadingScreen inline message="جارٍ تحميل التحقيق..." />}><Investigation
        key={`${investigationRun}:${user?.uid ?? "guest"}`}
        caseData={selectedCase}
        onBack={returnView === "library" ? goLibrary : goHome}
        backLabel={returnView === "library" ? "العودة لمكتبة التحقيقات" : "العودة للرئيسية"}
        onNext={() => startInvestigation(null, returnView, "next_case")}
      /></Suspense>
    );
  }

  return (
    <div className="app" dir="rtl">
      <nav className="navbar">
        <button className="logo logo-button" onClick={goHome} aria-label="CyberTrace — الرئيسية">
          <img src={logo} alt="CyberTrace" className="logo-mark" />
          <span>CyberTrace</span>
        </button>

        <div className="nav-links">
          <a href="#about">عن المنصة</a>
          <a href="#how">كيف تعمل؟</a>
        </div>

        <div className="nav-right">
          <button type="button" className="suite-nav-promo" onClick={() => navigate({ view: "soc" })}>مناوبة SOC</button>
          <button type="button" className="suite-nav-promo" onClick={() => navigate({ view: "pro" })}>Suite Pro · قريبًا</button>
          <XPBadge />
          <BlackBoxAccountButton />
          <button className="nav-library" onClick={goLibrary}>مكتبة التحقيقات</button>
          {user ? (
            <div className="nav-user">
              <span>مرحبًا، {user.displayName || user.email.split("@")[0]}</span>
              <button className="nav-logout" onClick={handleLogout}>
                خروج
              </button>
            </div>
          ) : (
            <button className="nav-button" onClick={() => navigate({ view: "auth" })}>
              تسجيل الدخول
            </button>
          )}
        </div>
      </nav>

      <main>
        {cloudSyncPanel}
        {legacyNotice && <section role="status" style={{margin:"1rem auto",padding:"1rem",maxWidth:900,border:"1px solid #4d728d",borderRadius:12}}><p>توجد نتائج تدريب قديمة محفوظة على هذا المتصفح دون هوية حساب مؤكدة. لن تُنسب لأي حساب تلقائيًا. استوردها فقط إذا كانت تخص حسابك الحالي.</p><button type="button" onClick={() => { if (!window.confirm("هل تؤكد أن النتائج القديمة تخص حساب CyberTrace الحالي؟ لا يمكن التحقق من مالكها السابق.")) return; const ok=importLegacyProgress(); if (ok) { setLegacyNotice(false); window.location.reload(); } else window.alert("تعذّر الاستيراد، أو توجد نتائج مسبقًا لهذا الحساب. لم تُحذف البيانات القديمة."); }}>استيراد نتائجي القديمة لهذا الحساب</button><button type="button" onClick={() => setLegacyNotice(false)}>ليس الآن</button></section>}
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
                onClick={goLibrary}
              >
                استكشف مكتبة التحقيقات
                <span>←</span>
              </button>

              <button
                className="secondary-button"
                onClick={() => startInvestigation(null, "home")}
              >
                ابدأ تحقيقًا عشوائيًا
              </button>
            </div>

            <div className="hero-stats">
              <div>
                <strong>{String(CASES.length).padStart(2, "0")}</strong>
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
        <section className="launch-partner" aria-labelledby="partner-title">
          <h2 id="partner-title">من تحليل الحادثة إلى تنظيم التدريب</h2>
          <p>واصل رحلتك في BlackBox-Lab: مسارات تدريب عملية، وملاحظات محفوظة، وتقارير تجمع ما تعلّمته.</p>
          <a href={partner.url} target="_blank" rel="noopener" onClick={() => trackEvent("partner_click", { destination: "blackbox", context: "home" })}>{partner.label} ↗</a>
          <small>تعليمات المختبر والأدوات تُنفّذ في بيئتك المحلية.</small>
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
