import { SUITE_PATHWAYS } from '../data/unifiedPathways.js';
import { normalizePracticalCompleted, PRACTICAL_TRACK_IDS } from '../blackbox/practicalProgress.js';

/** Read-only curriculum summary. A receipt never confirms a practical stage. */
export function cyberJourneyProgress(path, caseStatus, linkedStatus = {}) {
  if (!SUITE_PATHWAYS.includes(path) || typeof caseStatus !== 'function') throw new TypeError('Invalid learning journey');
  const practical = linkedStatus.practical;
  const ownSnapshot = Boolean(linkedStatus.user?.uid && practical?.ownerUid === linkedStatus.user.uid);
  const completed = ownSnapshot && practical.phase === 'ready' ? normalizePracticalCompleted(practical.completed) : null;
  const remoteKnown = completed !== null;
  const steps = path.steps.map(step => {
    if (step.site === 'cybertrace') {
      const status = caseStatus(step.id);
      return { ...step, status: ['scored', 'historical'].includes(status) ? status : 'not-started', done: ['scored', 'historical'].includes(status), known: true };
    }
    const done = remoteKnown && PRACTICAL_TRACK_IDS.includes(step.id) && [0, 1, 2].every(index => Object.hasOwn(completed, `${step.id}-${index}`));
    return { ...step, status: remoteKnown ? done ? 'completed' : 'not-started' : 'unknown', done, known: remoteKnown };
  });
  return {
    steps,
    done: steps.filter(step => step.done).length,
    total: steps.length,
    unknown: steps.filter(step => !step.known).length,
    localDone: steps.filter(step => step.site === 'cybertrace' && step.done).length,
    remoteKnown,
    fromCache: remoteKnown && practical.fromCache === true,
    remotePhase: ownSnapshot ? practical.phase === 'ready' && !remoteKnown ? 'error' : practical.phase : linkedStatus.user ? 'loading' : 'unlinked',
    next: steps.find(step => !step.done) ?? null,
    credentialEligible: false,
  };
}
