// The browser runner supplies a local-only Auth implementation and disables
// the external bridge. The production application and all route components run.
import "../../src/main.jsx";
import { presentationUser, presentationCalls } from "firebase/auth";
window.__pagePresentation = Object.freeze({
  setUser: uid => presentationUser(uid ? { uid, email: uid + "@example.test", displayName: "محلل التدريب", getIdTokenResult: async () => ({ claims: { admin: false } }) } : null),
  calls: presentationCalls,
});
