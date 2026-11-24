// UI status must be driven by a confirmed Firestore server response,
// never by a cached snapshot, an opt-in flag, or a translated status string.
export function nextSyncVerified(previous, result = {}) {
  if (result.failed === true) return false;
  if (result.verified === true) return true;
  return Boolean(previous);
}
export function showSyncPrompt(user, verified) {
  return Boolean(user) && !verified;
}
