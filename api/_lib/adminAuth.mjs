import process from "node:process";

const PROJECT_ID = "cybertrace-48ab0";
let cachedAuth;

// This module is NOT wired to production until firebase-admin is dependency-locked,
// and the server-only credential is configured in the protected preview.
export async function getAdminAuth() {
  if (cachedAuth) return cachedAuth;
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Server Firebase Admin credentials not configured");
  }
  let credentials;
  try { credentials = JSON.parse(raw); }
  catch { throw new Error("Invalid Firebase Admin service account configuration"); }
  if (!credentials || typeof credentials !== "object" || Array.isArray(credentials) ||
      credentials.project_id !== PROJECT_ID ||
      typeof credentials.client_email !== "string" || !credentials.client_email.trim() ||
      typeof credentials.private_key !== "string" || !credentials.private_key.includes("BEGIN PRIVATE KEY")) {
    throw new Error("Invalid Firebase Admin service account configuration");
  }

  // Only import privileged SDK modules after validating server configuration.
  // Missing/invalid SDK, project or credentials must fail closed.
  const [{ getApps, initializeApp, cert }, { getAuth }] = await Promise.all([
    import("firebase-admin/app"),
    import("firebase-admin/auth"),
  ]);
  const app = getApps().find(item => item.name === "cybertrace-admin") ||
    initializeApp({ credential: cert(credentials), projectId: PROJECT_ID }, "cybertrace-admin");
  cachedAuth = getAuth(app);
  return cachedAuth;
}

export async function verifyAdminIdentity(token, { authProvider = getAdminAuth } = {}) {
  if (typeof token !== "string" || !token || token.length > 8192 || !/^[A-Za-z0-9._-]+$/.test(token)) {
    throw new Error("Invalid token");
  }
  const auth = await authProvider();
  // Firebase Admin's checkRevoked=true also detects a disabled Firebase account.
  // Do not downgrade this check to simple local JWT verification.
  const claims = await auth.verifyIdToken(token, true);
  const uid = claims?.uid;
  if (typeof uid !== "string" || !uid.trim() || uid.length > 128) {
    throw new Error("Invalid authenticated UID");
  }
  if (claims.admin !== true) return { uid, admin: false };

  // Require current account state: an earlier still-valid admin claim is not enough.
  const user = await auth.getUser(uid);
  if (!user || user.uid !== uid || user.disabled || user.customClaims?.admin !== true) {
    return { uid, admin: false };
  }
  return { uid, admin: true };
}
