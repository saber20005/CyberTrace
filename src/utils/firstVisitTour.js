// First-visit discovery is device-local UX state, never an account/profile field.
export const FIRST_VISIT_TOUR_KEY = "cybertrace.first-visit-tour.v1";
export const FIRST_VISIT_TOUR_DONE = "done";

function safeRead(store) {
  try { return store?.getItem(FIRST_VISIT_TOUR_KEY) === FIRST_VISIT_TOUR_DONE; }
  catch { return false; }
}
function localStore() {
  try { return typeof window === "undefined" ? null : window.localStorage; }
  catch { return null; }
}
function sessionStore() {
  try { return typeof window === "undefined" ? null : window.sessionStorage; }
  catch { return null; }
}
export function hasFinishedFirstVisitTour(local = localStore(), session = sessionStore()) {
  return safeRead(local) || safeRead(session);
}
export function shouldOpenFirstVisitTour(route, local = localStore(), session = sessionStore()) {
  // Never interrupt deep links, log-in recovery, certificate verification or existing investigations.
  return route?.view === "home" && !hasFinishedFirstVisitTour(local, session);
}
export function finishFirstVisitTour(local = localStore(), session = sessionStore()) {
  let saved = false;
  for (const store of [local, session]) {
    try {
      store?.setItem(FIRST_VISIT_TOUR_KEY, FIRST_VISIT_TOUR_DONE);
      if (store) saved = true;
    } catch { /* Browser may block storage: the in-memory close still works. */ }
  }
  return saved;
}
