// Pure client response validator. This is a STATUS DISPLAY contract only;
// premium resources must be gated again on the trusted BLACKBOX server.
export const PLAN_ID = "cybertrace-blackbox-pro";
export const ALLOWED_FEATURES = Object.freeze(["advanced-soc", "advanced-reports"]);

export function parseSuiteMembership(value, now = Date.now()) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      value.schemaVersion !== 1 || typeof value.active !== "boolean" ||
      !Array.isArray(value.features)) {
    throw new Error("invalid-membership-response");
  }
  const keys = Object.keys(value);
  if (keys.some(key => !["schemaVersion", "plan", "active", "features", "expiresAt"].includes(key))) {
    throw new Error("unexpected-membership-fields");
  }
  if (value.plan === "free" && !value.active && value.expiresAt === null &&
      value.features.length === 0) {
    return Object.freeze({ active: false, plan: "free", expiresAt: null, features: Object.freeze([]) });
  }
  const expiry = typeof value.expiresAt === "string" ? Date.parse(value.expiresAt) : NaN;
  if (value.plan !== PLAN_ID || value.active !== true ||
      !Number.isFinite(expiry) || expiry <= now ||
      expiry > now + 366 * 24 * 60 * 60 * 1000 ||
      value.features.length !== ALLOWED_FEATURES.length ||
      value.features.some((feature, i) => feature !== ALLOWED_FEATURES[i])) {
    throw new Error("invalid-membership-response");
  }
  return Object.freeze({
    active: true, plan: PLAN_ID,
    expiresAt: new Date(expiry).toISOString(), features: ALLOWED_FEATURES,
  });
}
