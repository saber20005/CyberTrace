// Device-only display preferences. Never reuse account progress keys.
// Do not synchronize these values or treat a chosen training level as a credential.
export const UI_PREFERENCES_KEY = "cybertrace.ui-preferences.v1";
export const DEFAULT_UI_PREFERENCES = Object.freeze({
  theme: "dark", textSize: "normal", motion: "system", level: "unset",
});
const allowed = Object.freeze({
  theme: ["dark", "light"],
  textSize: ["normal", "large"],
  motion: ["system", "reduce"],
  level: ["unset", "beginner", "intermediate", "advanced"],
});

export function normalizeUIPreferences(input) {
  const obj = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  return Object.fromEntries(Object.entries(DEFAULT_UI_PREFERENCES).map(([key, fallback]) => [
    key, allowed[key].includes(obj[key]) ? obj[key] : fallback,
  ]));
}
export function readUIPreferences(storage) {
  try {
    const deviceStorage = storage === undefined ? (typeof window === "undefined" ? null : window.localStorage) : storage;
    const raw = deviceStorage?.getItem(UI_PREFERENCES_KEY);
    if (!raw) return normalizeUIPreferences(null);
    return normalizeUIPreferences(JSON.parse(raw));
  } catch { return normalizeUIPreferences(null); }
}
export function saveUIPreferences(value, storage) {
  const normalized = normalizeUIPreferences(value);
  try {
    const deviceStorage = storage === undefined ? (typeof window === "undefined" ? null : window.localStorage) : storage;
    if (!deviceStorage) return false;
    deviceStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(normalized));
    return true;
  } catch { return false; }
}
export function applyUIPreferences(value, target) {
  const normalized = normalizeUIPreferences(value);
  const root = target === undefined ? (typeof document === "undefined" ? null : document.documentElement) : target;
  if (root?.dataset) {
    root.dataset.ctTheme = normalized.theme;
    root.dataset.ctText = normalized.textSize;
    root.dataset.ctMotion = normalized.motion;
  }
  return normalized;
}
