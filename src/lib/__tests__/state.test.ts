import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { type ScenarioState, FINITE, POS_INF, NEG_INF } from "../wager";
import {
  compressState,
  decompressState,
  shareIdFor,
  generateShareResult,
  generateShareURL,
} from "../state";

function cell(v: ScenarioState["payoffMatrix"][number][number]["value"]) {
  return { value: v };
}

function makeState(): ScenarioState {
  return {
    worldviews: [
      { id: "god", name: "Belief in God", excluded: false, rawWeight: 50, template: "exclusivist" },
      { id: "sec", name: "Secular Life", excluded: false, rawWeight: 50, template: "secular" },
    ],
    payoffMatrix: [
      [cell(POS_INF), cell(FINITE(-100))],
      [cell(NEG_INF), cell(FINITE(500))],
    ],
    utilityMode: "infinite",
    lexicographicTiebreak: false,
    possibilityFilteredMaximin: true,
  };
}

// Minimal localStorage + window stubs for the node test environment.
class MemStorage {
  private store = new Map<string, string>();
  getItem(k: string) { return this.store.has(k) ? this.store.get(k)! : null; }
  setItem(k: string, v: string) { this.store.set(k, v); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

describe("state share/codec", () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>).localStorage = new MemStorage();
    (globalThis as Record<string, unknown>).window = {
      location: { origin: "https://example.com", pathname: "/wager", search: "" },
    };
  });
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).localStorage;
    delete (globalThis as Record<string, unknown>).window;
  });

  it("round-trips a state through compress/decompress", () => {
    const state = makeState();
    const decoded = decompressState(compressState(state));
    expect(decoded).not.toBeNull();
    expect(decoded!.worldviews[0].name).toBe("Belief in God");
    expect(decoded!.payoffMatrix[0][0].value.tag).toBe("pos_inf");
  });

  it("shareIdFor is deterministic and content-addressed (spec 8, review)", () => {
    const state = makeState();
    expect(shareIdFor(state)).toBe(shareIdFor(state));
    // A different state yields a different id.
    const other = makeState();
    other.worldviews[0].rawWeight = 999;
    expect(shareIdFor(other)).not.toBe(shareIdFor(state));
  });

  it("generateShareURL is deterministic for the same state (review)", () => {
    const state = makeState();
    expect(generateShareURL(state)).toBe(generateShareURL(state));
  });

  it("short inline state produces a portable ?s= URL, no fallback", () => {
    const res = generateShareResult(makeState());
    expect(res.localFallback).toBe(false);
    expect(res.url).toContain("?s=");
  });

  it("long state falls back to a deterministic ?id= URL stored in localStorage (spec 8)", () => {
    // Build an oversized but highly-incompressible state so the inline URL
    // exceeds the 2000-char length budget. Random-ish distinct names defeat
    // LZString's dictionary so the compressed payload stays large.
    const state = makeState();
    const n = 30;
    state.worldviews = [];
    for (let i = 0; i < n; i++) {
      // Pseudo-random but deterministic distinct names (no Math.random).
      const noise = ((i * 2654435761) >>> 0).toString(36) + ((i * 40503) >>> 0).toString(36);
      state.worldviews.push({
        id: `w${i}-${noise}`, name: `WV-${noise}-${i}-${noise.split("").reverse().join("")}`,
        excluded: i % 3 === 0, rawWeight: (i * 7) % 13, template: "custom",
      });
    }
    state.payoffMatrix = Array.from({ length: n }, (_, a) =>
      Array.from({ length: n }, (_, s) => cell(FINITE(((a * 31 + s * 17) % 9973) - 4000)))
    );
    const res1 = generateShareResult(state);
    const res2 = generateShareResult(state);
    expect(res1.localFallback).toBe(true);
    expect(res1.url).toContain("?id=");
    // Deterministic: two calls give the same id-based URL.
    expect(res1.url).toBe(res2.url);
  });
});
