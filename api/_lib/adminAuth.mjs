import process from "node:process";
const PROJECT_ID = "cybertrace-48ab0";
let cachedAuth;

export async function getAdminAuth() {
  if (cachedAuth) return cachedAuth;
  // The firebase-admin dependency must be installed and locked before deployment.
  const [{ getApps, initializeApp, cert }, { getAuth }] = await Promise.all([
    import("firebase-admin/app"),
    import("firebase-admin/auth"),
  ]);
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Server Firebase Admin credentials not configured");
  const credentials = JSON.parse(raw);
  if (credentials.project_id !== PROJECT_ID || !credentials.client_email || !credentials.private_key) {
    throw new Error("Invalid Firebase Admin service account configuration");
  }
  const app = getApps().find(item => item.name === "cybertrace-admin") ||
    initializeApp({ credential: cert(credentials), projectId: PROJECT_ID }, "cybertrace-admin");
  cachedAuth = getAuth(app);
  return cachedAuth;
}

export async function verifyAdminIdentity(token, { authProvider = getAdminAuth } = {}) {
  if (typeof token !== "string" || token.length > 8192 || token.length === 0) {
    throw new Error("Invalid token");
  }
  const auth = await authProvider();
  // checkRevoked=true verifies revoked sessions and disabled users with Firebase.
  const claims = await auth.verifyIdToken(token, true);
  if (claims.admin !== true) return { uid: claims.uid, admin: false };
  // Do not trust the claim alone: require current user state too.
  const user = await auth.getUser(claims.uid);
  if (user.disabled || user.customClaims?.admin !== true) {
    return { uid: claims.uid, admin: false };
  }
  return { uid: claims.uid, admin: true };
}
