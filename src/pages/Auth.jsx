import { useState } from "react";
import "./Auth.css";
import BlackBoxAccountButton from "../blackbox/BlackBoxAccountButton";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

const ERROR_MESSAGES = {
  "auth/email-already-in-use": "هذا البريد الإلكتروني مسجّل مسبقًا",
  "auth/invalid-email": "البريد الإلكتروني غير صالح",
  "auth/weak-password": "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  "auth/user-not-found": "لا يوجد حساب بهذا البريد الإلكتروني",
  "auth/wrong-password": "كلمة المرور غير صحيحة",
  "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "auth/too-many-requests": "محاولات كثيرة جدًا، حاول لاحقًا",
};

function Auth({ onBack }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const isSignup = mode === "signup";

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess(false);
    setForm({ name: "", email: "", password: "", confirmPassword: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignup && !form.name.trim()) {
      setError("الاسم مطلوب");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("البريد الإلكتروني غير صالح");
      return;
    }
    if (form.password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (isSignup && form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          form.email.trim(),
          form.password
        );
        await updateProfile(credential.user, { displayName: form.name.trim() });
        setDisplayName(form.name.trim());
      } else {
        const credential = await signInWithEmailAndPassword(
          auth,
          form.email.trim(),
          form.password
        );
        setDisplayName(
          credential.user.displayName || credential.user.email.split("@")[0]
        );
      }
      setSuccess(true);
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen" dir="rtl">
      <header className="auth-topbar">
        <button className="auth-back" onClick={onBack}>
          <span>→</span> العودة للرئيسية
        </button>
        <BlackBoxAccountButton />
      </header>

      <div className="auth-card">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span>cybertrace://{isSignup ? "register" : "auth"}</span>
        </div>

        <div className="auth-body">
          {success ? (
            <div className="auth-success">
              <span className="green">✓</span>
              <strong>
                {isSignup ? "تم إنشاء الحساب بنجاح" : "تم تسجيل الدخول بنجاح"}
              </strong>
              <p>
                مرحبًا بك في CyberTrace{displayName ? `، ${displayName}` : ""}. جاهز
                لبدء أول تحقيق؟
              </p>
              <button className="primary-button" onClick={onBack}>
                الانتقال إلى المنصة <span>←</span>
              </button>
            </div>
          ) : (
            <>
              <p className="auth-line">
                <span className="green">$</span>{" "}
                {isSignup ? "register --new-analyst" : "login --analyst"}
              </p>

              <div className="auth-tabs">
                <button
                  className={!isSignup ? "active" : ""}
                  onClick={() => switchMode("login")}
                  type="button"
                >
                  تسجيل الدخول
                </button>
                <button
                  className={isSignup ? "active" : ""}
                  onClick={() => switchMode("signup")}
                  type="button"
                >
                  إنشاء حساب
                </button>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {isSignup && (
                  <label>
                    <span>الاسم الكامل</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={handleChange("name")}
                      placeholder="محلل الأمن"
                    />
                  </label>
                )}

                <label>
                  <span>البريد الإلكتروني</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="analyst@cybertrace.io"
                  />
                </label>

                <label>
                  <span>كلمة المرور</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={handleChange("password")}
                    placeholder="••••••••"
                  />
                </label>

                {isSignup && (
                  <label>
                    <span>تأكيد كلمة المرور</span>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleChange("confirmPassword")}
                      placeholder="••••••••"
                    />
                  </label>
                )}

                {error && <p className="auth-error">! {error}</p>}

                <button
                  className="primary-button auth-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "جارٍ التحقق..." : isSignup ? "إنشاء الحساب" : "دخول"}{" "}
                  <span>←</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
