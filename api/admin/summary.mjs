import { verifyAdminToken } from "../_lib/firebaseToken.mjs";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(req.headers.authorization || "");
  if (!match) return res.status(401).json({ error: "unauthorized" });
  let identity;
  try { identity = await verifyAdminToken(match[1]); }
  catch { return res.status(401).json({ error: "unauthorized" }); }
  if (!identity.admin) return res.status(403).json({ error: "forbidden" });
  // Fail closed: CyberTrace scores are browser-local and cannot be treated as verified platform statistics.
  return res.status(200).json({
    status: "data_source_not_configured",
    metrics: null,
    message: "Verified admin access; trusted aggregate data is not yet available."
  });
}
