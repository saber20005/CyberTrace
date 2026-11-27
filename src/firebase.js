import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4ZcRoXRXA_jFRtR7ziy8pOOxZwyY7tY8",
  authDomain: "cybertrace-48ab0.firebaseapp.com",
  projectId: "cybertrace-48ab0",
  storageBucket: "cybertrace-48ab0.firebasestorage.app",
  messagingSenderId: "647399578008",
  appId: "1:647399578008:web:67d8a59aeb98b59c0cb3ed",
  measurementId: "G-B9KJQGYNY9",
};

const app = initializeApp(firebaseConfig);

// Register the Enterprise provider before Auth or Firestore is initialized.
// Keep unconfigured builds usable while enforcement remains disabled.
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY?.trim();
export const appCheck = appCheckSiteKey && typeof window !== "undefined"
  ? initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  : null;
export const auth = getAuth(app);
export const db = getFirestore(app);