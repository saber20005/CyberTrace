import { getCaseDetails } from "../data/caseCatalog.js";

export const SITE_ORIGIN = "https://cyber-trace-psi.vercel.app";
const HOME_TITLE = "CyberTrace | منصة التحقيقات الأمنية";
const HOME_DESCRIPTION = "CyberTrace منصة تدريب تفاعلية على التحقيق في الحوادث الأمنية وتحليل الأدلة الرقمية.";

export function describePage(route, cases = []) {
  if (route?.view === "investigation") {
    const caseData = Array.isArray(cases) ? cases.find(item => item?.id === route.caseId) : null;
    if (!caseData) return describePage({ view: "library" }, cases);
    const details = getCaseDetails(caseData);
    const url = new URL("/", SITE_ORIGIN);
    url.searchParams.set("case", caseData.id);
    return {
      title: `${details.title} | CyberTrace`,
      description: `تحقيق ${details.difficultyLabel} في ${details.categoryLabel}: ${caseData.brief}`.slice(0, 180),
      url: url.href,
      noindex: false,
    };
  }
  if (route?.view === "library") {
    const count = Array.isArray(cases) ? cases.length : 0;
    return {
      title: "مكتبة التحقيقات | CyberTrace",
      description: `اختر من ${count} تحقيقًا أمنيًا بالعربية، وابحث حسب المستوى والمجال، وتابع محاولاتك وأفضل نتائجك.`,
      url: `${SITE_ORIGIN}/?view=library`,
      noindex: false,
    };
  }
  return {
    title: route?.view === "auth" ? "تسجيل الدخول | CyberTrace" : HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: `${SITE_ORIGIN}/`,
    noindex: route?.view === "auth",
  };
}

export function applyPageMetadata(metadata) {
  if (typeof document === "undefined") return;
  const setMeta = (attribute, key, value) => {
    let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, key);
      document.head.append(element);
    }
    element.setAttribute("content", value);
  };
  document.title = metadata.title;
  setMeta("name", "description", metadata.description);
  setMeta("name", "robots", metadata.noindex ? "noindex,follow" : "index,follow");
  for (const [key, value] of Object.entries({ title: metadata.title, description: metadata.description, url: metadata.url })) {
    setMeta("property", `og:${key}`, value);
    if (key !== "url") setMeta("name", `twitter:${key}`, value);
  }
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.append(canonical);
  }
  canonical.setAttribute("href", metadata.url);
}
