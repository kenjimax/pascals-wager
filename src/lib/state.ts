import LZString from "lz-string";
import { type ScenarioState, stateToSerializable, serializableToState } from "./wager";

const STORAGE_KEY = "pascals-wager-state";
const URL_PARAM = "s";
const MAX_URL_LENGTH = 2000;
const SHARE_PREFIX = "pw-share-";

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

/**
 * Deterministic, content-addressed short id for a state (spec 8 fallback).
 *
 * Uses a stable hash (FNV-1a) over the compressed payload, so the SAME state
 * always yields the SAME id on any device and across calls. No Date.now(), no
 * randomness. This makes the long-state fallback link stable: the id is the
 * fingerprint of the state, and reopening it on this device restores exactly.
 */
export function shareIdFor(state: ScenarioState): string {
  const payload = compressState(state);
  let h = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Unsigned 32-bit, base36, zero-padded for a stable fixed-width id.
  return (h >>> 0).toString(36).padStart(7, "0");
}

export interface ShareResult {
  url: string;
  // True when the state was too long for an inline URL and is stored under a
  // short id in localStorage instead (spec 8). The link only restores on this
  // device; the UI surfaces that.
  localFallback: boolean;
}

/**
 * Build a shareable link for the state (spec 8). Deterministic for a given
 * state and origin.
 *
 * Primary: a compressed inline URL (?s=...), which round-trips anywhere.
 * Fallback: when the inline URL would exceed MAX_URL_LENGTH, store the state
 * under a deterministic short id in localStorage and put ?id=<id> in the URL.
 * The id is content-addressed, so two calls for the same state produce the
 * same URL.
 */
export function generateShareResult(state: ScenarioState): ShareResult {
  const compressed = compressState(state);
  const base = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const inlineUrl = `${base}?${URL_PARAM}=${compressed}`;

  if (inlineUrl.length <= MAX_URL_LENGTH) {
    return { url: inlineUrl, localFallback: false };
  }

  const shortId = shareIdFor(state);
  try {
    localStorage.setItem(`${SHARE_PREFIX}${shortId}`, JSON.stringify(stateToSerializable(state)));
  } catch {
    // localStorage unavailable: fall back to the (long) inline URL, which is
    // still deterministic and portable, just long.
    return { url: inlineUrl, localFallback: false };
  }
  return { url: `${base}?id=${shortId}`, localFallback: true };
}

/** Back-compatible accessor returning just the URL string. */
export function generateShareURL(state: ScenarioState): string {
  return generateShareResult(state).url;
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
      const json = localStorage.getItem(`${SHARE_PREFIX}${shortId}`);
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
