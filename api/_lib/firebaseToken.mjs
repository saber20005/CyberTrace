import { createPublicKey, verify as verifySignature } from "node:crypto";

const PROJECT_ID = "cybertrace-48ab0";
const CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
let cached = { expires: 0, certs: null };
const decode = value => {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Malformed token");
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
};

export async function verifyAdminToken(token, { now = Date.now(), fetchCerts = fetch } = {}) {
  if (typeof token !== "string" || token.length > 8192) throw new Error("Invalid token");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed token");
  const header = decode(parts[0]);
  const payload = decode(parts[1]);
  const seconds = Math.floor(now / 1000);
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid || header.typ && header.typ !== "JWT") throw new Error("Invalid JWT header");
  if (payload.aud !== PROJECT_ID || payload.iss !== `https://securetoken.google.com/${PROJECT_ID}` ||
      typeof payload.sub !== "string" || !payload.sub || payload.sub.length > 128 ||
      !Number.isInteger(payload.iat) || payload.iat > seconds ||
      !Number.isInteger(payload.exp) || payload.exp <= seconds ||
      !Number.isInteger(payload.auth_time) || payload.auth_time > seconds) throw new Error("Invalid JWT claims");
  if (!cached.certs || cached.expires <= now) {
    const response = await fetchCerts(CERT_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Firebase certificate fetch failed");
    const certs = await response.json();
    if (!certs || typeof certs !== "object" || Array.isArray(certs)) throw new Error("Invalid certificates");
    const maxAge = Number(/max-age=(\d+)/i.exec(response.headers.get("cache-control") || "")?.[1] || 300);
    cached = { certs, expires: now + Math.min(Math.max(maxAge, 60), 3600) * 1000 };
  }
  const pem = cached.certs[header.kid];
  if (typeof pem !== "string") throw new Error("Unknown signing key");
  const valid = verifySignature("RSA-SHA256", Buffer.from(parts[0] + "." + parts[1]), createPublicKey(pem), Buffer.from(parts[2], "base64url"));
  if (!valid) throw new Error("Invalid signature");
  return { uid: payload.sub, admin: payload.admin === true };
}
