import { verifyAdminToken } from "../_lib/firebaseToken.mjs";
import { readAuthAccountMetrics } from "../_lib/authMetrics.mjs";

const PROJECT = "cybertrace-48ab0";
const SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const API = "https://identitytoolkit.googleapis.com/v1/projects/" + PROJECT + "/accounts:";
let cache, pending;
async function json(url, options = {}, fetcher = fetch) {
  const response = await fetcher(url, {...options, signal: AbortSignal.timeout(7000)});
  if (!response.ok) throw Error("upstream-failed");
  return response.json();
}
async function accessToken(subject, env, fetcher) {
  const audience = env.ADMIN_METRICS_WIF_AUDIENCE;
  const serviceAccount = env.ADMIN_METRICS_SERVICE_ACCOUNT;
  if (!/^\/\/iam\.googleapis\.com\/projects\/\d+\/locations\/global\/workloadIdentityPools\/[a-z0-9-]+\/providers\/[a-z0-9-]+$/.test(audience ?? "") ||
      !/^[a-z0-9-]+@cybertrace-48ab0\.iam\.gserviceaccount\.com$/.test(serviceAccount ?? "") ||
      typeof subject !== "string" || !subject) throw Error("wif-not-configured");
  const sts = await json("https://sts.googleapis.com/v1/token", {
    method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({audience,grant_type:"urn:ietf:params:oauth:grant-type:token-exchange",
      requested_token_type:"urn:ietf:params:oauth:token-type:access_token",
      subject_token_type:"urn:ietf:params:oauth:token-type:jwt",subject_token:subject,scope:SCOPE})
  },fetcher);
  if (!sts.access_token) throw Error("sts-failed");
  const credential = await json("https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/"+encodeURIComponent(serviceAccount)+":generateAccessToken", {
    method:"POST",headers:{Authorization:"Bearer "+sts.access_token,"Content-Type":"application/json"},
    body:JSON.stringify({scope:[SCOPE],lifetime:"600s"})
  },fetcher);
  if (!credential.accessToken) throw Error("credential-failed");
  return credential.accessToken;
}
const iso = value => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined;
  const d = new Date(Number(value));
  return Number.isFinite(d.getTime()) ? d.toISOString() : undefined;
};
export function makeAuthMetricsHandler({env=process.env,fetcher=fetch,verify=verifyAdminToken}={}) {
  return async function handler(req,res) {
    res.setHeader("Cache-Control","no-store");
    res.setHeader("X-Content-Type-Options","nosniff");
    if (req.method !== "GET") {res.setHeader("Allow","GET");return res.status(405).json({error:"method_not_allowed"});}
    const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(req.headers.authorization || "");
    if (!match) return res.status(401).json({error:"unauthorized"});
    let identity;
    try {identity=await verify(match[1]);} catch {return res.status(401).json({error:"unauthorized"});}
    if (identity.admin !== true) return res.status(403).json({error:"forbidden"});
    if (env.VERCEL_ENV !== "production" || env.ADMIN_AUTH_METRICS_ENABLED !== "true")
      return res.status(200).json({status:"data_source_not_configured",metrics:null});
    try {
      const credential = await accessToken(req.headers["x-vercel-oidc-token"],env,fetcher);
      const headers={Authorization:"Bearer "+credential,"Content-Type":"application/json"};
      const lookup = await json(API+"lookup?fields=users(localId,disabled,customAttributes,validSince)", {
        method:"POST",headers,body:JSON.stringify({localId:[identity.uid]})
      },fetcher);
      const current=lookup.users?.[0];
      // The token was signature-verified above; recheck current account claims and revocation before every response.
      const authTime=JSON.parse(Buffer.from(match[1].split(".")[1],"base64url").toString("utf8")).auth_time;
      const validSince=Number(current?.validSince);
      if (current?.localId !== identity.uid || current.disabled === true ||
          JSON.parse(current.customAttributes || "{}").admin !== true ||
          typeof current.validSince !== "string" || !Number.isSafeInteger(validSince) ||
          !Number.isSafeInteger(authTime) || authTime < validSince) return res.status(403).json({error:"forbidden"});
      if (cache && Date.now()<cache.expires) return res.status(200).json({status:"ready",metrics:cache.metrics});
      pending ??= readAuthAccountMetrics(async (size,token) => {
        const query = new URLSearchParams({maxResults:String(size),fields:"nextPageToken,users(localId,disabled,createdAt,lastLoginAt,providerUserInfo(providerId))"});
        if (token) query.set("nextPageToken",token);
        const result=await json(API+"batchGet?"+query,{headers},fetcher);
        if (result.users !== undefined && !Array.isArray(result.users)) throw Error("invalid-page");
        return {users:(result.users ?? []).map(u=>({uid:u.localId,disabled:u.disabled,
          metadata:{creationTime:iso(u.createdAt),lastSignInTime:iso(u.lastLoginAt)},
          providerData:u.providerUserInfo??[]})),pageToken:result.nextPageToken};
      }).then(metrics=>{cache={metrics,expires:Date.now()+60000};return metrics;}).finally(()=>{pending=undefined;});
      return res.status(200).json({status:"ready",metrics:await pending});
    } catch {return res.status(503).json({error:"metrics_unavailable",metrics:null});}
  };
}
export default makeAuthMetricsHandler();
