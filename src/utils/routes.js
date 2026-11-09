export const SITE_ORIGIN = "https://cyber-trace-psi.vercel.app";
const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

function parseURL(value) {
  try { return new URL(value, SITE_ORIGIN); }
  catch { return new URL(SITE_ORIGIN); }
}

export function readRoute(value, cases = []) {
  const params = parseURL(value).searchParams;
  if (params.has("case")) {
    const ids = params.getAll("case");
    if (ids.length === 1 && Array.isArray(cases) && cases.some(item => item?.id === ids[0])) {
      return { view: "investigation", caseId: ids[0] };
    }
    return { view: "library" };
  }
  const views = params.getAll("view");
  if (views.length === 1 && ["library", "auth"].includes(views[0])) return { view: views[0] };
  return { view: "home" };
}

// Navigation keeps campaign attribution, while copied/canonical links stay clean.
export function createRouteURL(route, currentURL, { preserveHash = false } = {}) {
  const current = parseURL(currentURL);
  const next = new URL("/", current.origin);
  if (route.view === "investigation" && route.caseId) next.searchParams.set("case", route.caseId);
  else if (["library", "auth"].includes(route.view)) next.searchParams.set("view", route.view);
  for (const key of CAMPAIGN_KEYS) {
    const value = current.searchParams.get(key)?.trim();
    if (value) next.searchParams.set(key, value.slice(0, 200));
  }
  if (preserveHash && route.view === "home") next.hash = current.hash;
  return next;
}

export function getShareURL(route) {
  return createRouteURL(route, SITE_ORIGIN).href;
}

export function getBlackBoxLearningLink(caseId) {
  const url = new URL("https://blackboxlab.dev/");
  url.searchParams.set("view", "tracks");
  let label = "استكشف مسارات BlackBox-Lab";
  if (["INC-1101", "INC-0701"].includes(caseId)) {
    url.searchParams.set("track", "webgoat");
    label = "تابع مهارة تطبيقات الويب في BlackBox-Lab";
  } else if (["INC-1104", "INC-0944"].includes(caseId)) {
    url.searchParams.set("track", "network");
    label = "تابع تحليل الشبكات في BlackBox-Lab";
  }
  url.searchParams.set("utm_source", "cybertrace");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "learning_path");
  return { url: url.href, label };
}
