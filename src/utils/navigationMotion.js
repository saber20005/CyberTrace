// Presentation is optional. Each request owns at most one routing commit, even
// if a snapshot fails or a newer navigation supersedes its pending callback.
let current;
let request = 0;

export function animateNavigation(commit, { caseId, prepare } = {}) {
  const id = ++request;
  current?.transition?.skipTransition();
  current?.cleanUp();
  const root = document.documentElement;
  const reduced = root.dataset.ctMotion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof document.startViewTransition !== "function") {
    current = null;
    commit();
    return;
  }
  const source = caseId ? [...document.querySelectorAll(".case-card")].find(node => node.dataset.caseId === caseId) : null;
  let cleaned = false;
  const state = {
    transition: null,
    cleanUp() {
      if (cleaned) return;
      cleaned = true;
      source?.style.removeProperty("view-transition-name");
      if (current === state) { delete root.dataset.ctTransition; current = null; }
    },
  };
  current = state;
  if (source) { source.style.viewTransitionName = "ct-selected-case"; root.dataset.ctTransition = "case"; }
  let committed = false;
  const update = async () => {
    // Preload the actual detail before the first shared card snapshot commits.
    await prepare?.();
    if (!committed && id === request) { committed = true; commit(); }
  };
  try {
    const transition = document.startViewTransition(update);
    state.transition = transition;
    transition.ready.catch(() => {});
    transition.updateCallbackDone.catch(() => {
      // A failed preload/snapshot must still route without a second commit.
      if (!committed && id === request) { committed = true; commit(); }
    });
    transition.finished.catch(() => {}).finally(state.cleanUp);
  } catch {
    state.cleanUp();
    if (!committed && id === request) { committed = true; commit(); }
  }
}
