import { verifyAdminIdentity } from "../_lib/adminAuth.mjs";
import { CASES } from "../../src/data/cases.js";
import { CATEGORIES, DIFFICULTIES, getCaseDetails } from "../../src/data/caseCatalog.js";

// These are source-controlled *training-content* counts, not user activity.
// Never turn client-supplied case scores or browser telemetry into admin KPIs.
export function buildCatalogOverview() {
  const ids = CASES.map(item => item.id);
  const details = CASES.map(item => getCaseDetails(item));
  const duplicates = ids.length - new Set(ids).size;
  const categories = CATEGORIES.map(category => ({
    id: category.id, label: category.label,
    count: details.filter(item => item.category === category.id).length,
  }));
  const difficulties = DIFFICULTIES.map(difficulty => ({
    id: difficulty.id, label: difficulty.label,
    count: details.filter(item => item.difficulty === difficulty.id).length,
  }));
  const uncategorized = details.filter(item => !CATEGORIES.some(category => category.id === item.category)).length;
  const unmatchedDifficulty = details.filter(item => !DIFFICULTIES.some(difficulty => difficulty.id === item.difficulty)).length;
  return {
    source: "published-case-catalog",
    cases: CASES.length,
    categories,
    difficulties,
    integrity: {
      uniqueIds: duplicates === 0,
      mappedCategories: uncategorized === 0,
      mappedDifficulties: unmatchedDifficulty === 0,
    },
  };
}

// Injectable verifier only facilitates isolated authorization regression tests;
// production uses signed Firebase ID token validation on every request.
export function createAdminSummaryHandler(verify = verifyAdminIdentity) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "method_not_allowed" });
    }
    const match = /^Bearer ([A-Za-z0-9._-]{1,8192})$/.exec(req.headers?.authorization || "");
    if (!match) return res.status(401).json({ error: "unauthorized" });
    let identity;
    try { identity = await verify(match[1]); }
    catch (error) {
      // Revoked/invalid tokens fail as unauthorized; missing admin credentials or
      // Firebase backend failures fail as unavailable. Neither reveals internals.
      const invalid = new Set(["auth/invalid-id-token","auth/id-token-revoked",
        "auth/id-token-expired","auth/user-disabled","auth/user-not-found",
        "auth/argument-error","auth/invalid-argument"]);
      if (invalid.has(error?.code) || error?.message === "Invalid token" ||
          error?.message === "Invalid authenticated UID") {
        return res.status(401).json({ error: "unauthorized" });
      }
      return res.status(503).json({ error: "service_unavailable" });
    }
    if (identity?.admin !== true) return res.status(403).json({ error: "forbidden" });

    return res.status(200).json({
      schemaVersion: 1,
      status: "catalog_only",
      catalog: buildCatalogOverview(),
      metrics: null,
      availability: {
        userTotals: "not_configured",
        investigationOutcomes: "not_verified",
        revenue: "not_configured",
        auditEvents: "not_configured",
        revocationAwareAdmin: "enabled",
      },
    });
  };
}
export default createAdminSummaryHandler();
