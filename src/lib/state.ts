import LZString from "lz-string";
import { type ScenarioState, stateToSerializable, serializableToState } from "./wager";

const STORAGE_KEY = "pascals-wager-state";
const URL_PARAM = "s";
const MAX_URL_LENGTH = 2000;

export function compressState(state: ScenarioState): string {
  const json = JSON.stringify(stateToSerializable(state));
  return LZString.compressToEncodedURIComponent(json);
}

export function decompressState(encoded: string): ScenarioState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!parsed.worldviews || !parsed.matrix) return null;
    return serializableToState(parsed);
  } catch {
    return null;
  }
}

export function saveToLocalStorage(state: ScenarioState): void {
  try {
    const json = JSON.stringify(stateToSerializable(state));
    localStorage.setItem(STORAGE_KEY, json);
  } catch {
    // localStorage may be unavailable
  }
}

export function loadFromLocalStorage(): ScenarioState | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!parsed.worldviews || !parsed.matrix) return null;
    return serializableToState(parsed);
  } catch {
    return null;
  }
}

export function generateShareURL(state: ScenarioState): string {
  const compressed = compressState(state);
  const base = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const url = `${base}?${URL_PARAM}=${compressed}`;

  if (url.length > MAX_URL_LENGTH) {
    saveToLocalStorage(state);
    const shortId = btoa(String(Date.now())).replace(/[=+/]/g, "").slice(0, 8);
    try {
      localStorage.setItem(`pw-share-${shortId}`, JSON.stringify(stateToSerializable(state)));
    } catch {
      // fallback: just use the long URL
      return url;
    }
    return `${base}?id=${shortId}`;
  }

  return url;
}

export function loadFromURL(): ScenarioState | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);

  const compressed = params.get(URL_PARAM);
  if (compressed) {
    return decompressState(compressed);
  }

  const shortId = params.get("id");
  if (shortId) {
    try {
      const json = localStorage.getItem(`pw-share-${shortId}`);
      if (json) {
        const parsed = JSON.parse(json);
        if (parsed.worldviews && parsed.matrix) {
          return serializableToState(parsed);
        }
      }
    } catch {
      // invalid
    }
  }

  return null;
}
