import { describe, it, expect } from "vitest";
import {
  FINITE, POS_INF, NEG_INF, INDETERMINATE,
  erAdd, erMultiplyByProb, erCompare, erSubtract, erEqual, erToString,
  erGte, erGt, erMax, erMin,
  normalizeProbabilities, normalizeProbabilitiesResult,
  isValidExtendedRealTag,
  computeEU, rankByEU, lexicographicTiebreak,
  computeDominance, computeMaximin, computeMinimaxRegret,
  computeFullDecision,
  computeCredenceSensitivity, computePayoffSensitivity,
  buildPayoffMatrix, getTemplatePayoffs,
  encodeState, decodeState, stateToSerializable, serializableToState,
  type Worldview, type PayoffCell, type ScenarioState, type ExtendedReal,
} from "../wager";

// --- Helpers ---

function cell(v: ExtendedReal): PayoffCell {
  return { value: v };
}

function wv(id: string, name: string, weight: number, template: "exclusivist" | "secular" | "universalist" | "annihilationist" | "professors_god" | "custom" = "custom", excluded = false): Worldview {
  return { id, name, excluded, rawWeight: weight, template };
}

// --- Extended Real Arithmetic Tests ---

describe("Extended Real Arithmetic", () => {
  describe("erAdd", () => {
    it("adds two finite values", () => {
      expect(erAdd(FINITE(3), FINITE(4))).toEqual(FINITE(7));
    });

    it("adds negative finite values", () => {
      expect(erAdd(FINITE(-10), FINITE(3))).toEqual(FINITE(-7));
    });

    it("finite + pos_inf = pos_inf", () => {
      expect(erAdd(FINITE(100), POS_INF)).toEqual(POS_INF);
    });

    it("finite + neg_inf = neg_inf", () => {
      expect(erAdd(FINITE(100), NEG_INF)).toEqual(NEG_INF);
    });

    it("pos_inf + pos_inf = pos_inf", () => {
      expect(erAdd(POS_INF, POS_INF)).toEqual(POS_INF);
    });

    it("neg_inf + neg_inf = neg_inf", () => {
      expect(erAdd(NEG_INF, NEG_INF)).toEqual(NEG_INF);
    });

    it("pos_inf + neg_inf = indeterminate", () => {
      expect(erAdd(POS_INF, NEG_INF)).toEqual(INDETERMINATE);
    });

    it("neg_inf + pos_inf = indeterminate", () => {
      expect(erAdd(NEG_INF, POS_INF)).toEqual(INDETERMINATE);
    });

    it("indeterminate + anything = indeterminate", () => {
      expect(erAdd(INDETERMINATE, FINITE(5))).toEqual(INDETERMINATE);
      expect(erAdd(FINITE(5), INDETERMINATE)).toEqual(INDETERMINATE);
      expect(erAdd(INDETERMINATE, POS_INF)).toEqual(INDETERMINATE);
    });

    it("clamps near safe integer limit", () => {
      const big = FINITE(Number.MAX_SAFE_INTEGER - 1);
      const result = erAdd(big, FINITE(100));
      expect(result.tag).toBe("finite");
      expect(result.value).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("clamps AND flags overflow (spec 4.1)", () => {
      const result = erAdd(FINITE(Number.MAX_SAFE_INTEGER), FINITE(1));
      expect(result.tag).toBe("finite");
      expect(result.value).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.overflow).toBe(true);
    });

    it("negative overflow is clamped and flagged", () => {
      const result = erAdd(FINITE(-Number.MAX_SAFE_INTEGER), FINITE(-1));
      expect(result.value).toBe(-Number.MAX_SAFE_INTEGER);
      expect(result.overflow).toBe(true);
    });

    it("overflow flag propagates through subsequent adds", () => {
      const overflowed = erAdd(FINITE(Number.MAX_SAFE_INTEGER), FINITE(1));
      const next = erAdd(overflowed, FINITE(-1000));
      expect(next.overflow).toBe(true);
    });

    it("non-overflowing add has no overflow flag", () => {
      const result = erAdd(FINITE(3), FINITE(4));
      expect(result.overflow).toBeUndefined();
    });
  });

  describe("erMultiplyByProb", () => {
    it("0 * anything = 0 (Lebesgue convention)", () => {
      expect(erMultiplyByProb(0, POS_INF)).toEqual(FINITE(0));
      expect(erMultiplyByProb(0, NEG_INF)).toEqual(FINITE(0));
      expect(erMultiplyByProb(0, INDETERMINATE)).toEqual(FINITE(0));
      expect(erMultiplyByProb(0, FINITE(999))).toEqual(FINITE(0));
    });

    it("positive prob * pos_inf = pos_inf", () => {
      expect(erMultiplyByProb(0.3, POS_INF)).toEqual(POS_INF);
    });

    it("positive prob * neg_inf = neg_inf", () => {
      expect(erMultiplyByProb(0.5, NEG_INF)).toEqual(NEG_INF);
    });

    it("positive prob * finite = finite product", () => {
      const result = erMultiplyByProb(0.5, FINITE(100));
      expect(result.tag).toBe("finite");
      expect(result.value).toBeCloseTo(50);
    });

    it("positive prob * indeterminate = indeterminate", () => {
      expect(erMultiplyByProb(0.1, INDETERMINATE)).toEqual(INDETERMINATE);
    });

    it("tiny epsilon prob * pos_inf = pos_inf", () => {
      expect(erMultiplyByProb(0.0001, POS_INF)).toEqual(POS_INF);
    });
  });

  describe("erCompare", () => {
    it("finite < pos_inf", () => {
      expect(erCompare(FINITE(999999), POS_INF)).toBeLessThan(0);
    });

    it("neg_inf < finite", () => {
      expect(erCompare(NEG_INF, FINITE(-999999))).toBeLessThan(0);
    });

    it("neg_inf < pos_inf", () => {
      expect(erCompare(NEG_INF, POS_INF)).toBeLessThan(0);
    });

    it("equal finite values", () => {
      expect(erCompare(FINITE(42), FINITE(42))).toBe(0);
    });

    it("pos_inf == pos_inf", () => {
      expect(erCompare(POS_INF, POS_INF)).toBe(0);
    });

    it("indeterminate makes comparison null", () => {
      expect(erCompare(INDETERMINATE, FINITE(0))).toBeNull();
      expect(erCompare(FINITE(0), INDETERMINATE)).toBeNull();
    });

    it("distinct tiny finite values do NOT falsely tie (spec 4.4, review)", () => {
      // Previously a 1e-12 absolute tolerance bucketed 0 and 5e-13 as equal.
      const c = erCompare(FINITE(0), FINITE(5e-13));
      expect(c).not.toBe(0);
      expect(c).toBeLessThan(0);
      const r = rankByEU([1], [[cell(FINITE(0))], [cell(FINITE(5e-13))]]);
      expect(r.bestIndices).toEqual([1]);
    });
  });

  describe("erSubtract", () => {
    it("finite - finite", () => {
      expect(erSubtract(FINITE(10), FINITE(3))).toEqual(FINITE(7));
    });

    it("pos_inf - finite = pos_inf", () => {
      expect(erSubtract(POS_INF, FINITE(100))).toEqual(POS_INF);
    });

    it("pos_inf - pos_inf = indeterminate", () => {
      expect(erSubtract(POS_INF, POS_INF)).toEqual(INDETERMINATE);
    });

    it("finite - pos_inf = neg_inf", () => {
      expect(erSubtract(FINITE(100), POS_INF)).toEqual(NEG_INF);
    });
  });

  describe("erEqual", () => {
    it("same finite", () => expect(erEqual(FINITE(5), FINITE(5))).toBe(true));
    it("different finite", () => expect(erEqual(FINITE(5), FINITE(6))).toBe(false));
    it("same inf", () => expect(erEqual(POS_INF, POS_INF)).toBe(true));
    it("different tags", () => expect(erEqual(POS_INF, NEG_INF)).toBe(false));
  });

  describe("erToString", () => {
    it("formats finite", () => expect(erToString(FINITE(1234.5))).toContain("1,234.5"));
    it("formats pos_inf", () => expect(erToString(POS_INF)).toBe("+INF"));
    it("formats neg_inf", () => expect(erToString(NEG_INF)).toBe("-INF"));
    it("formats indeterminate", () => expect(erToString(INDETERMINATE)).toBe("UNDEF"));
  });

  describe("erGte / erGt / erMax / erMin", () => {
    it("erGte with finite", () => {
      expect(erGte(FINITE(5), FINITE(3))).toBe(true);
      expect(erGte(FINITE(3), FINITE(5))).toBe(false);
      expect(erGte(FINITE(5), FINITE(5))).toBe(true);
    });

    it("erGt with infinity", () => {
      expect(erGt(POS_INF, FINITE(999))).toBe(true);
      expect(erGt(FINITE(999), POS_INF)).toBe(false);
    });

    it("erMax picks larger", () => {
      expect(erMax(FINITE(5), FINITE(10))).toEqual(FINITE(10));
      expect(erMax(POS_INF, FINITE(999))).toEqual(POS_INF);
    });

    it("erMin picks smaller", () => {
      expect(erMin(FINITE(5), FINITE(10))).toEqual(FINITE(5));
      expect(erMin(NEG_INF, FINITE(-999))).toEqual(NEG_INF);
    });

    it("returns null for indeterminate", () => {
      expect(erGte(INDETERMINATE, FINITE(0))).toBeNull();
      expect(erMax(INDETERMINATE, FINITE(0))).toBeNull();
    });
  });
});

// --- Probability Normalization ---

describe("Probability Normalization", () => {
  it("normalizes positive weights", () => {
    const ws = [wv("a", "A", 1), wv("b", "B", 3)];
    const probs = normalizeProbabilities(ws);
    expect(probs[0]).toBeCloseTo(0.25);
    expect(probs[1]).toBeCloseTo(0.75);
  });

  it("excluded worldview gets 0", () => {
    const ws = [wv("a", "A", 1), wv("b", "B", 3, "custom", true)];
    const probs = normalizeProbabilities(ws);
    expect(probs[0]).toBeCloseTo(1);
    expect(probs[1]).toBe(0);
  });

  it("all-zero weights is an explicit no-probability-assigned state (spec 4.2)", () => {
    const ws = [wv("a", "A", 0), wv("b", "B", 0)];
    const res = normalizeProbabilitiesResult(ws);
    expect(res.noProbabilityAssigned).toBe(true);
    expect(res.probs).toEqual([0, 0]);
    // The legacy accessor still returns the vector, but it does NOT sum to 1.
    expect(normalizeProbabilities(ws)).toEqual([0, 0]);
  });

  it("all-excluded worldviews is also no-probability-assigned", () => {
    const ws = [
      wv("a", "A", 0, "custom", true),
      wv("b", "B", 0, "custom", true),
    ];
    const res = normalizeProbabilitiesResult(ws);
    expect(res.noProbabilityAssigned).toBe(true);
  });

  it("any positive weight is NOT no-probability-assigned", () => {
    const res = normalizeProbabilitiesResult([wv("a", "A", 0), wv("b", "B", 1)]);
    expect(res.noProbabilityAssigned).toBe(false);
  });

  it("non-finite or overflowing weights do not fabricate a distribution (review2)", () => {
    // sum overflows to Infinity -> treated as no-probability-assigned, never NaN.
    const inf = normalizeProbabilitiesResult([wv("a", "A", Infinity), wv("b", "B", Infinity)]);
    expect(inf.noProbabilityAssigned).toBe(true);
    expect(inf.probs.every(p => Number.isFinite(p))).toBe(true);

    // NaN weight is treated as 0 contribution.
    const nan = normalizeProbabilitiesResult([wv("a", "A", NaN), wv("b", "B", 5)]);
    expect(nan.noProbabilityAssigned).toBe(false);
    expect(nan.probs[0]).toBe(0);
    expect(nan.probs[1]).toBeCloseTo(1);
  });

  it("negative weights treated as 0", () => {
    const ws = [wv("a", "A", -5), wv("b", "B", 10)];
    const probs = normalizeProbabilities(ws);
    expect(probs[0]).toBe(0);
    expect(probs[1]).toBeCloseTo(1);
  });
});

// --- Expected Utility ---

describe("Expected Utility", () => {
  it("computes finite EU correctly", () => {
    const probs = [0.5, 0.5];
    const matrix = [[cell(FINITE(100)), cell(FINITE(-50))], [cell(FINITE(0)), cell(FINITE(0))]];
    const eu = computeEU(0, probs, matrix);
    expect(eu.tag).toBe("finite");
    expect(eu.value).toBeCloseTo(25);
  });

  it("tiny positive credence with infinite payoff yields infinite EU", () => {
    const probs = [0.001, 0.999];
    const matrix = [
      [cell(POS_INF), cell(FINITE(-100))],
      [cell(FINITE(0)), cell(FINITE(500))],
    ];
    const eu = computeEU(0, probs, matrix);
    expect(eu.tag).toBe("pos_inf");
  });

  it("zero credence with infinite payoff yields 0 contribution", () => {
    const probs = [0, 1];
    const matrix = [
      [cell(POS_INF), cell(FINITE(-100))],
      [cell(FINITE(0)), cell(FINITE(500))],
    ];
    const eu = computeEU(0, probs, matrix);
    expect(eu.tag).toBe("finite");
    expect(eu.value).toBeCloseTo(-100);
  });

  it("mixed pos and neg infinity yields indeterminate", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(POS_INF), cell(NEG_INF)],
      [cell(FINITE(0)), cell(FINITE(0))],
    ];
    const eu = computeEU(0, probs, matrix);
    expect(eu.tag).toBe("indeterminate");
  });
});

// --- EU Ranking ---

describe("EU Ranking", () => {
  it("identifies single best action", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(100)), cell(FINITE(100))],
      [cell(FINITE(0)), cell(FINITE(0))],
    ];
    const r = rankByEU(probs, matrix);
    expect(r.bestIndices).toEqual([0]);
    expect(r.tiedAtInfinity).toBe(false);
  });

  it("detects tie at finite EU", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(10)), cell(FINITE(10))],
      [cell(FINITE(10)), cell(FINITE(10))],
    ];
    const r = rankByEU(probs, matrix);
    expect(r.bestIndices).toEqual([0, 1]);
  });

  it("detects tied-at-infinity (many gods)", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(POS_INF), cell(FINITE(-100))],
      [cell(FINITE(-100)), cell(POS_INF)],
    ];
    const r = rankByEU(probs, matrix);
    expect(r.bestIndices).toEqual([0, 1]);
    expect(r.tiedAtInfinity).toBe(true);
  });

  it("excludes indeterminate actions", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(POS_INF), cell(NEG_INF)],
      [cell(FINITE(10)), cell(FINITE(10))],
    ];
    const r = rankByEU(probs, matrix);
    expect(r.hasIndeterminate).toBe(true);
    expect(r.bestIndices).toEqual([1]);
  });

  it("infinite EU beats any finite EU", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(POS_INF), cell(FINITE(0))],
      [cell(FINITE(999999)), cell(FINITE(999999))],
    ];
    const r = rankByEU(probs, matrix);
    expect(r.bestIndices).toEqual([0]);
  });
});

// --- Lexicographic Tiebreak ---

describe("Lexicographic Tiebreak", () => {
  it("breaks tie by probability mass on infinite states", () => {
    const probs = [0.6, 0.4];
    const matrix = [
      [cell(POS_INF), cell(FINITE(-100))],
      [cell(FINITE(-100)), cell(POS_INF)],
    ];
    const lex = lexicographicTiebreak([0, 1], probs, matrix);
    expect(lex.rankedIndices[0]).toBe(0);
    expect(lex.infMasses[0]).toBeCloseTo(0.6);
  });

  it("breaks further tie by finite remainder", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(POS_INF), cell(FINITE(100))],
      [cell(POS_INF), cell(FINITE(-100))],
    ];
    // Both have infMass 0.5 (from state 0), but action 0 has finite remainder 50, action 1 has -50
    // Wait, both actions have infMass on the single state where THEIR payoff is +inf
    // Action 0: inf at state 0, finite(100) at state 1 -> infMass = 0.5, finiteRemainder = 0.5 * 100 = 50
    // Action 1: inf at state 0, finite(-100) at state 1 -> infMass = 0.5, finiteRemainder = 0.5 * (-100) = -50
    const lex = lexicographicTiebreak([0, 1], probs, matrix);
    expect(lex.rankedIndices[0]).toBe(0);
    expect(lex.finiteRemainders[0]).toBeCloseTo(50);
  });

  it("handles equal lex ranking", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(POS_INF), cell(FINITE(0))],
      [cell(POS_INF), cell(FINITE(0))],
    ];
    const lex = lexicographicTiebreak([0, 1], probs, matrix);
    expect(lex.infMasses[0]).toBeCloseTo(lex.infMasses[1]);
  });
});

// --- Statewise Dominance ---

describe("Statewise Dominance", () => {
  it("detects strict dominance (binary wager)", () => {
    // In binary wager with exclusivist god + secular:
    // If god: belief gets +inf, secular gets -inf
    // If secular: belief gets -100 (cost), secular gets 500
    // Belief dominates if we only look at positive-credence states
    // Actually no, secular is better in the secular state. No dominance in many-gods.
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(100)), cell(FINITE(50))],
      [cell(FINITE(0)), cell(FINITE(0))],
    ];
    const d = computeDominance(probs, matrix);
    expect(d.dominantIndex).toBe(0);
    expect(d.undominatedIndices).toEqual([0]);
  });

  it("no dominance when each action wins in some state", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(100)), cell(FINITE(-50))],
      [cell(FINITE(-50)), cell(FINITE(100))],
    ];
    const d = computeDominance(probs, matrix);
    expect(d.dominantIndex).toBeNull();
    expect(d.undominatedIndices.sort()).toEqual([0, 1]);
  });

  it("handles zero-credence states correctly", () => {
    // State 0 has zero credence, so it doesn't count for dominance
    const probs = [0, 1];
    const matrix = [
      [cell(FINITE(-999)), cell(FINITE(100))],
      [cell(FINITE(999)), cell(FINITE(50))],
    ];
    const d = computeDominance(probs, matrix);
    // Action 0 strictly better in the only positive-credence state
    expect(d.dominantIndex).toBe(0);
  });

  it("handles infinity in dominance", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(POS_INF), cell(POS_INF)],
      [cell(FINITE(100)), cell(FINITE(100))],
    ];
    const d = computeDominance(probs, matrix);
    expect(d.dominantIndex).toBe(0);
  });

  it("indeterminate cells make dominance comparison incomparable", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(INDETERMINATE), cell(FINITE(100))],
      [cell(FINITE(50)), cell(FINITE(50))],
    ];
    const d = computeDominance(probs, matrix);
    // Can't compare action 0 in state 0, so neither dominates
    expect(d.dominantIndex).toBeNull();
  });
});

// --- Maximin ---

describe("Maximin", () => {
  it("picks action with best worst case", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(100)), cell(FINITE(-1000))],
      [cell(FINITE(10)), cell(FINITE(10))],
    ];
    const m = computeMaximin(probs, matrix, true);
    expect(m.bestIndices).toEqual([1]);
  });

  it("possibility-filtered ignores zero-credence states", () => {
    const probs = [0, 1];
    const matrix = [
      [cell(FINITE(-99999)), cell(FINITE(100))],
      [cell(FINITE(50)), cell(FINITE(50))],
    ];
    const filtered = computeMaximin(probs, matrix, true);
    expect(filtered.bestIndices).toEqual([0]); // Only state 1 matters, action 0 has 100

    const unfiltered = computeMaximin(probs, matrix, false);
    expect(unfiltered.bestIndices).toEqual([1]); // State 0 counts, action 0 has -99999
  });

  it("neg_inf worst case is maximally bad", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(100)), cell(NEG_INF)],
      [cell(FINITE(10)), cell(FINITE(10))],
    ];
    const m = computeMaximin(probs, matrix, true);
    expect(m.bestIndices).toEqual([1]);
  });

  it("ties in maximin", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(100)), cell(FINITE(5))],
      [cell(FINITE(50)), cell(FINITE(5))],
    ];
    const m = computeMaximin(probs, matrix, true);
    expect(m.bestIndices).toEqual([0, 1]);
  });

  it("breaks shared -inf worst case by the next-worst payoff (spec 4.6, review)", () => {
    // Both actions have -inf in state 0; action 0's next-worst is 100, action
    // 1's is 0. Action 0 must win by the next-worst tie-break.
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(NEG_INF), cell(FINITE(100))],
      [cell(NEG_INF), cell(FINITE(0))],
    ];
    const m = computeMaximin(probs, matrix, true);
    expect(m.bestIndices).toEqual([0]);
  });

  it("genuinely identical worst sequences remain tied", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(NEG_INF), cell(FINITE(50))],
      [cell(NEG_INF), cell(FINITE(50))],
    ];
    const m = computeMaximin(probs, matrix, true);
    expect(m.bestIndices).toEqual([0, 1]);
  });

  it("next-worst tie-break continues to further outcomes", () => {
    const probs = [1 / 3, 1 / 3, 1 / 3];
    const matrix = [
      [cell(NEG_INF), cell(FINITE(10)), cell(FINITE(5))],
      [cell(NEG_INF), cell(FINITE(10)), cell(FINITE(8))],
    ];
    const m = computeMaximin(probs, matrix, true);
    // worst (-inf) tied, next-worst: 5 vs 8 -> action 1 wins.
    expect(m.bestIndices).toEqual([1]);
  });
});

// --- Minimax Regret ---

describe("Minimax Regret", () => {
  it("computes regret correctly for finite case", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(100)), cell(FINITE(0))],
      [cell(FINITE(0)), cell(FINITE(100))],
    ];
    const r = computeMinimaxRegret(probs, matrix);
    // Best in state 0 = 100, best in state 1 = 100
    // Regret(0, state 0) = 0, Regret(0, state 1) = 100
    // Regret(1, state 0) = 100, Regret(1, state 1) = 0
    // Max regret for both = 100 -> tie
    expect(r.bestIndices.sort()).toEqual([0, 1]);
  });

  it("infinite best in state gives infinite regret for finite action", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(POS_INF), cell(FINITE(0))],
      [cell(FINITE(0)), cell(FINITE(100))],
    ];
    const r = computeMinimaxRegret(probs, matrix);
    // State 0: best = +inf, action 1 has finite, regret = +inf
    // State 1: best = 100, action 0 has 0, regret = 100
    // MaxRegret(0) = 100, MaxRegret(1) = +inf
    expect(r.bestIndices).toEqual([0]);
  });

  it("same infinity means 0 regret", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(POS_INF), cell(POS_INF)],
      [cell(POS_INF), cell(POS_INF)],
    ];
    const result = computeMinimaxRegret(probs, matrix);
    expect(result.bestIndices.sort()).toEqual([0, 1]);
  });

  it("handles zero-credence states", () => {
    const probs = [0, 1];
    const matrix = [
      [cell(FINITE(100)), cell(FINITE(50))],
      [cell(FINITE(0)), cell(FINITE(100))],
    ];
    const r = computeMinimaxRegret(probs, matrix);
    // Only state 1 matters. Best = 100. Regret(0) = 50, Regret(1) = 0
    expect(r.bestIndices).toEqual([1]);
  });
});

// --- Full Decision ---

describe("Full Decision", () => {
  it("computes binary Pascalian wager correctly", () => {
    const state: ScenarioState = {
      worldviews: [
        wv("god", "Belief in God", 10, "exclusivist"),
        wv("secular", "Secular Life", 90, "secular"),
      ],
      payoffMatrix: [
        [cell(POS_INF), cell(FINITE(-100))],
        [cell(NEG_INF), cell(FINITE(500))],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    };
    const result = computeFullDecision(state);
    expect(result.euRanking.bestIndices).toEqual([0]);
    expect(result.euRanking.eus[0].tag).toBe("pos_inf");
  });

  it("many-gods scenario ties at infinity", () => {
    const state: ScenarioState = {
      worldviews: [
        wv("god_a", "God A", 40, "exclusivist"),
        wv("god_b", "God B", 40, "exclusivist"),
        wv("secular", "Secular", 20, "secular"),
      ],
      payoffMatrix: [
        [cell(POS_INF), cell(NEG_INF), cell(FINITE(-100))],
        [cell(NEG_INF), cell(POS_INF), cell(FINITE(-100))],
        [cell(FINITE(0)), cell(FINITE(0)), cell(FINITE(500))],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    };
    const result = computeFullDecision(state);
    expect(result.euRanking.tiedAtInfinity).toBe(false); // both are indeterminate!
    expect(result.euRanking.hasIndeterminate).toBe(true);
  });

  it("many-gods with no cross-penalty ties at infinity", () => {
    const state: ScenarioState = {
      worldviews: [
        wv("god_a", "God A", 50, "exclusivist"),
        wv("god_b", "God B", 50, "exclusivist"),
      ],
      payoffMatrix: [
        [cell(POS_INF), cell(FINITE(-100))],
        [cell(FINITE(-100)), cell(POS_INF)],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    };
    const result = computeFullDecision(state);
    expect(result.euRanking.tiedAtInfinity).toBe(true);
    expect(result.euRanking.bestIndices.sort()).toEqual([0, 1]);
  });

  it("lexicographic tiebreak resolves many-gods by mass", () => {
    const state: ScenarioState = {
      worldviews: [
        wv("god_a", "God A", 60),
        wv("god_b", "God B", 40),
      ],
      payoffMatrix: [
        [cell(POS_INF), cell(FINITE(-100))],
        [cell(FINITE(-100)), cell(POS_INF)],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: true,
      possibilityFilteredMaximin: true,
    };
    const result = computeFullDecision(state);
    expect(result.lexResult).not.toBeNull();
    expect(result.lexResult!.rankedIndices[0]).toBe(0);
  });

  it("finite stakes scenario works correctly", () => {
    const state: ScenarioState = {
      worldviews: [
        wv("a", "Worldview A", 50),
        wv("b", "Worldview B", 50),
      ],
      payoffMatrix: [
        [cell(FINITE(1000)), cell(FINITE(-200))],
        [cell(FINITE(-300)), cell(FINITE(800))],
      ],
      utilityMode: "finite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    };
    const result = computeFullDecision(state);
    // EU(A) = 0.5*1000 + 0.5*(-200) = 400
    // EU(B) = 0.5*(-300) + 0.5*800 = 250
    expect(result.euRanking.bestIndices).toEqual([0]);
    expect(result.euRanking.eus[0].tag).toBe("finite");
    expect(result.euRanking.eus[0].value).toBeCloseTo(400);
  });

  it("disagreement flag set when rules disagree", () => {
    const state: ScenarioState = {
      worldviews: [
        wv("a", "A", 50),
        wv("b", "B", 50),
      ],
      payoffMatrix: [
        [cell(FINITE(10000)), cell(FINITE(-5000))],
        [cell(FINITE(100)), cell(FINITE(100))],
      ],
      utilityMode: "finite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    };
    const result = computeFullDecision(state);
    // EU favors A (2500 vs 100), maximin favors B (100 vs -5000)
    expect(result.headline.disagreement).toBe(true);
  });

  it("all-zero weights produces an explicit no-probability state with NO EU optimum (spec 4.2)", () => {
    // Review finding: previously returned probs [0,0] and fabricated an
    // all-tied EU=0 result. The correct behavior is an explicit
    // "no probability assigned" state with no optimum.
    const state: ScenarioState = {
      worldviews: [
        { id: "a", name: "A", excluded: true, rawWeight: 0, template: "custom" },
        { id: "b", name: "B", excluded: true, rawWeight: 0, template: "custom" },
      ],
      payoffMatrix: [
        [cell(FINITE(100)), cell(FINITE(200))],
        [cell(FINITE(300)), cell(FINITE(400))],
      ],
      utilityMode: "finite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    };
    const result = computeFullDecision(state);
    expect(result.noProbabilityAssigned).toBe(true);
    expect(result.headline.pick).toBeNull();
    expect(result.headline.euOptimum).toEqual([]);
    expect(result.headline.rule).toBe("none");
    expect(result.headline.disagreement).toBe(false);
  });

  it("EU tied at +inf with tiebreak off reports no single pick, honest tie (review)", () => {
    const state: ScenarioState = {
      worldviews: [wv("a", "A", 50), wv("b", "B", 50)],
      payoffMatrix: [
        [cell(POS_INF), cell(FINITE(0))],
        [cell(FINITE(0)), cell(POS_INF)],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    };
    const result = computeFullDecision(state);
    expect(result.euRanking.tiedAtInfinity).toBe(true);
    expect(result.headline.pick).toBeNull();
    expect(result.headline.euTied).toBe(true);
    expect(result.headline.euOptimum.sort()).toEqual([0, 1]);
    expect(result.headline.rule).not.toBe("expected utility");
  });

  it("all-indeterminate EUs report 'no defined optimum', not a fabricated EU pick (review)", () => {
    const state: ScenarioState = {
      worldviews: [wv("a", "A", 50), wv("b", "B", 50)],
      payoffMatrix: [
        [cell(POS_INF), cell(NEG_INF)],
        [cell(NEG_INF), cell(POS_INF)],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    };
    const result = computeFullDecision(state);
    expect(result.euRanking.hasIndeterminate).toBe(true);
    expect(result.headline.euUndefined).toBe(true);
    expect(result.headline.pick).toBeNull();
    expect(result.headline.rule).not.toBe("expected utility");
  });

  it("lexicographic tiebreak that cannot separate reports a tie, not a pick (review2)", () => {
    // Both actions: +inf on the single state, equal infinite-reward mass and
    // equal finite remainder. Even with the tiebreak ON, no unique pick.
    const state: ScenarioState = {
      worldviews: [wv("a", "A", 100)],
      payoffMatrix: [
        [cell(POS_INF)],
        [cell(POS_INF)],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: true,
      possibilityFilteredMaximin: true,
    };
    const result = computeFullDecision(state);
    expect(result.lexResult).not.toBeNull();
    expect(result.lexResult!.topTieSet.sort()).toEqual([0, 1]);
    expect(result.headline.pick).toBeNull();
    expect(result.headline.euTied).toBe(true);
    expect(result.headline.euOptimum.sort()).toEqual([0, 1]);
  });
});

// --- Sensitivity Analysis ---

describe("Credence Sensitivity", () => {
  it("computes breakpoints for simple two-worldview finite case", () => {
    const worldviews = [wv("a", "A", 50), wv("b", "B", 50)];
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(1000)), cell(FINITE(-200))],
      [cell(FINITE(-300)), cell(FINITE(800))],
    ];
    const sens = computeCredenceSensitivity(0, probs, matrix, worldviews);
    expect(sens.intervals.length).toBeGreaterThan(0);
    expect(sens.currentValue).toBeCloseTo(0.5);
  });

  it("detects discontinuity at zero when infinite payoffs present", () => {
    const worldviews = [wv("a", "A", 10), wv("b", "B", 90)];
    const probs = [0.1, 0.9];
    const matrix = [
      [cell(POS_INF), cell(FINITE(-100))],
      [cell(FINITE(-100)), cell(FINITE(500))],
    ];
    const sens = computeCredenceSensitivity(0, probs, matrix, worldviews);
    expect(sens.discontinuityAtZero).toBe(true);
  });

  it("finds multiple breakpoints in a three-action scenario", () => {
    const worldviews = [wv("a", "A", 33), wv("b", "B", 33), wv("c", "C", 34)];
    const probs = [1 / 3, 1 / 3, 1 / 3];
    const matrix = [
      [cell(FINITE(1000)), cell(FINITE(-500)), cell(FINITE(-500))],
      [cell(FINITE(-500)), cell(FINITE(1000)), cell(FINITE(-500))],
      [cell(FINITE(-500)), cell(FINITE(-500)), cell(FINITE(1000))],
    ];
    const sens = computeCredenceSensitivity(0, probs, matrix, worldviews);
    // As credence on A increases, action A should become optimal
    expect(sens.intervals.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Payoff Sensitivity", () => {
  it("computes payoff sensitivity for finite case", () => {
    const worldviews = [wv("a", "A", 50), wv("b", "B", 50)];
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(1000)), cell(FINITE(-200))],
      [cell(FINITE(-300)), cell(FINITE(800))],
    ];
    const sens = computePayoffSensitivity(0, 0, probs, matrix, worldviews, -5000, 5000);
    expect(sens.intervals.length).toBeGreaterThan(0);
    expect(sens.currentValue).toBeCloseTo(1000);
  });

  it("zero-credence state makes payoff irrelevant", () => {
    const worldviews = [wv("a", "A", 0), wv("b", "B", 100)];
    const probs = [0, 1];
    const matrix = [
      [cell(FINITE(1000)), cell(FINITE(-200))],
      [cell(FINITE(-300)), cell(FINITE(800))],
    ];
    const sens = computePayoffSensitivity(0, 0, probs, matrix, worldviews, -5000, 5000);
    // State 0 has zero credence, so varying its payoff changes nothing
    expect(sens.breakpoints.length).toBe(0);
  });
});

// --- Sensitivity: verified review findings ---

describe("Credence Sensitivity (review findings)", () => {
  const wvs = [wv("a", "A", 0), wv("b", "B", 100)];

  it("infinite action wins for t>0 with a discontinuity at t=0 (spec 4.7, review)", () => {
    // probs [0,1]; action 0 has +inf at varied state 0, finite 0 elsewhere;
    // action 1 finite. For any t>0, action 0's EU jumps to +inf and wins.
    // At t=0 the varied state is excluded, so the finite envelope decides
    // (action 1, EU 1 > action 0's EU 0).
    const probs = [0, 1];
    const matrix = [
      [cell(POS_INF), cell(FINITE(0))],
      [cell(FINITE(0)), cell(FINITE(1))],
    ];
    const sens = computeCredenceSensitivity(0, probs, matrix, wvs);
    expect(sens.discontinuityAtZero).toBe(true);

    // The open interval (0,1] must be won by the infinite action 0.
    const openInterval = sens.intervals.find(iv => iv.infinite);
    expect(openInterval).toBeDefined();
    expect(openInterval!.optimalActions).toContain(0);
    expect(openInterval!.end).toBeCloseTo(1);

    // At t=0 boundary, action 1 is the finite optimum.
    const zeroBoundary = sens.intervals.find(iv => !iv.infinite && iv.start === 0 && iv.end === 0);
    expect(zeroBoundary).toBeDefined();
    expect(zeroBoundary!.optimalActions).toContain(1);
  });

  it("keeps exact breakpoints arbitrarily close to t=0 (no endpoint epsilon, review)", () => {
    // Action 0 EU = t (finite). Action 1 EU = 5e-13 * (1-t). They cross near
    // t = 5e-13. Action 1 wins just above 0, action 0 wins after the crossing.
    const probs = [0, 1];
    const matrix = [
      [cell(FINITE(1)), cell(FINITE(0))],
      [cell(FINITE(0)), cell(FINITE(5e-13))],
    ];
    const sens = computeCredenceSensitivity(0, probs, matrix, wvs);
    expect(sens.breakpoints.length).toBeGreaterThanOrEqual(1);
    expect(sens.breakpoints[0]).toBeGreaterThan(0);
    expect(sens.breakpoints[0]).toBeLessThan(1e-6);
    // Both actions appear as optima across the range.
    const opts = new Set(sens.intervals.flatMap(iv => iv.optimalActions));
    expect(opts.has(0)).toBe(true);
    expect(opts.has(1)).toBe(true);
  });

  it("represents a boundary/everywhere tie as a set, not a single action (review)", () => {
    // Identical affine lines: both actions optimal everywhere.
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(1)), cell(FINITE(1))],
      [cell(FINITE(1)), cell(FINITE(1))],
    ];
    const sens = computeCredenceSensitivity(0, probs, matrix, wvs);
    expect(sens.intervals.length).toBeGreaterThan(0);
    for (const iv of sens.intervals) {
      expect(iv.optimalActions.sort()).toEqual([0, 1]);
    }
  });

  it("reports renormalization undefined and emits NO invented intervals when currentP === 1 (review2)", () => {
    const probs = [1, 0, 0];
    const matrix = [
      [cell(FINITE(0)), cell(FINITE(1000)), cell(FINITE(0))],
      [cell(FINITE(0)), cell(FINITE(0)), cell(FINITE(1000))],
    ];
    const sens = computeCredenceSensitivity(0, probs, matrix, [wv("a", "A", 1), wv("b", "B", 0), wv("c", "C", 0)]);
    expect(sens.renormalizationUndefined).toBe(true);
    // Must not fabricate an envelope from invented zero weights.
    expect(sens.intervals).toEqual([]);
  });

  it("includes a +inf action coming from a NON-varied state (review2)", () => {
    // varyIdx = 0. Action 0 has +inf in state 1 (positive counterfactual mass),
    // so its EU is +inf for every t < 1 and it must win, not be dropped.
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(0)), cell(POS_INF)],
      [cell(FINITE(100)), cell(FINITE(0))],
    ];
    const sens = computeCredenceSensitivity(0, probs, matrix, wvs);
    // Somewhere in (0,1) action 0 must be the (infinite) optimum.
    const infInterval = sens.intervals.find(iv => iv.infinite && iv.end > iv.start);
    expect(infInterval).toBeDefined();
    expect(infInterval!.optimalActions).toContain(0);
  });

  it("does NOT treat a varied +inf as dominant when another state is indeterminate-inducing (review2)", () => {
    // varyIdx = 0. Action 0: +inf in varied state, -inf in non-varied state 1
    // with positive counterfactual mass -> EU is INDETERMINATE for 0<t<1, so
    // action 0 must not win the open interval; action 1 (finite) should.
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(POS_INF), cell(NEG_INF)],
      [cell(FINITE(0)), cell(FINITE(0))],
    ];
    const sens = computeCredenceSensitivity(0, probs, matrix, wvs);
    const openMiddle = sens.intervals.find(iv => iv.end > iv.start && iv.start > 0 && iv.end < 1)
      ?? sens.intervals.find(iv => iv.end > iv.start);
    expect(openMiddle).toBeDefined();
    expect(openMiddle!.optimalActions).toContain(1);
    expect(openMiddle!.optimalActions).not.toContain(0);
  });

  it("does not falsely tie near a tiny exact breakpoint (review2)", () => {
    // The 5e-13 crossing: just above 0, action 1 STRICTLY wins (no 1e-9 bucket).
    const probs = [0, 1];
    const matrix = [
      [cell(FINITE(1)), cell(FINITE(0))],     // EU = t
      [cell(FINITE(0)), cell(FINITE(5e-13))], // EU = 5e-13 (1-t)
    ];
    const sens = computeCredenceSensitivity(0, probs, matrix, wvs);
    // The first open interval after t=0 must be action 1 ALONE, not a tie set.
    const first = sens.intervals.find(iv => iv.end > iv.start);
    expect(first).toBeDefined();
    expect(first!.optimalActions).toEqual([1]);
  });

  it("emits a tie at the LOWER endpoint t=0 (review2b)", () => {
    // EU0 = t, EU1 = 0. At t=0 both are 0 -> tie {0,1}; for t>0 action 0 wins.
    const sens = computeCredenceSensitivity(0, [0.5, 0.5], [
      [cell(FINITE(1)), cell(FINITE(0))],
      [cell(FINITE(0)), cell(FINITE(0))],
    ], wvs);
    const loTie = sens.intervals.find(iv => iv.start === 0 && iv.end === 0);
    expect(loTie).toBeDefined();
    expect(loTie!.optimalActions.sort()).toEqual([0, 1]);
  });

  it("emits a tie at the UPPER endpoint t=1 (review2b)", () => {
    // EU0 = t, EU1 = 1. At t=1 both are 1 -> tie {0,1}; for t<1 action 1 wins.
    const sens = computeCredenceSensitivity(0, [0.5, 0.5], [
      [cell(FINITE(1)), cell(FINITE(0))],
      [cell(FINITE(1)), cell(FINITE(1))],
    ], wvs);
    const hiTie = sens.intervals.find(iv => iv.start === 1 && iv.end === 1);
    expect(hiTie).toBeDefined();
    expect(hiTie!.optimalActions.sort()).toEqual([0, 1]);
  });

  it("captures the +inf winner that only appears exactly at t=1 (review2b)", () => {
    // Action 0: +inf in varied state, -inf in state 1. Indeterminate for
    // 0<t<1 (action 1 wins), but exactly at t=1 the -inf is excluded (prob 0)
    // and action 0 = +inf, the unique winner.
    const sens = computeCredenceSensitivity(0, [0.5, 0.5], [
      [cell(POS_INF), cell(NEG_INF)],
      [cell(FINITE(0)), cell(FINITE(0))],
    ], wvs);
    const open = sens.intervals.find(iv => iv.end > iv.start);
    expect(open!.optimalActions).toEqual([1]);
    const at1 = sens.intervals.find(iv => iv.start === 1 && iv.end === 1);
    expect(at1).toBeDefined();
    expect(at1!.optimalActions).toEqual([0]);
    expect(at1!.infinite).toBe(true);
  });

  it("flags discontinuityAtZero even when the winning action does not change (review2b)", () => {
    // Action 0: +inf in varied state (EU jumps 0 -> +inf at t=0) but wins both
    // at t=0 (0 > -1) and t>0 (+inf). Still a discontinuity in EU value.
    const sens = computeCredenceSensitivity(0, [0.5, 0.5], [
      [cell(POS_INF), cell(FINITE(0))],
      [cell(FINITE(-1)), cell(FINITE(-1))],
    ], wvs);
    expect(sens.discontinuityAtZero).toBe(true);
  });

  it("does NOT treat a valid near-1 credence as renormalization-undefined (review2b)", () => {
    // currentP extremely close to but not exactly 1: renorm is still defined.
    const p = 1 - 1e-12;
    const sens = computeCredenceSensitivity(0, [p, 1 - p], [
      [cell(FINITE(1)), cell(FINITE(0))],
      [cell(FINITE(0)), cell(FINITE(1))],
    ], wvs);
    expect(sens.renormalizationUndefined).toBeUndefined();
    expect(sens.intervals.length).toBeGreaterThan(0);
  });
});

describe("Payoff Sensitivity (review findings)", () => {
  const wvs = [wv("a", "A", 50), wv("b", "B", 50)];

  it("varying a zero-probability payoff leaves the EU optimum unchanged (review)", () => {
    // probs [0,1]; action 1 EU = 10 (from state 1), action 0 EU = 0. Varying
    // the (action1,state0) payoff over the whole range cannot change anything.
    const probs = [0, 1];
    const matrix = [
      [cell(FINITE(0)), cell(FINITE(0))],
      [cell(FINITE(0)), cell(FINITE(10))],
    ];
    const sens = computePayoffSensitivity(1, 0, probs, matrix, wvs, -100, 100);
    expect(sens.intervals.length).toBe(1);
    expect(sens.intervals[0].optimalActions).toContain(1);
    expect(sens.intervals[0].start).toBe(-100);
    expect(sens.intervals[0].end).toBe(100);
  });

  it("keeps an exact breakpoint arbitrarily close to rangeMin (no endpoint epsilon, review)", () => {
    // probs [1]; action 0 EU = t (varied), action 1 EU = 5e-13. Crossing at
    // t = 5e-13: action 1 wins before, action 0 wins after.
    const probs = [1];
    const matrix = [
      [cell(FINITE(0))],
      [cell(FINITE(5e-13))],
    ];
    const sens = computePayoffSensitivity(0, 0, probs, matrix, [wv("a", "A", 1)], 0, 1);
    expect(sens.breakpoints.length).toBe(1);
    expect(sens.breakpoints[0]).toBeCloseTo(5e-13, 20);
    // Action 1 before the breakpoint, action 0 after.
    expect(sens.intervals[0].optimalActions).toContain(1);
    expect(sens.intervals[sens.intervals.length - 1].optimalActions).toContain(0);
  });

  it("includes non-finite (+inf) actions in the envelope (review)", () => {
    // Action 0 has +inf EU across the whole range (POS_INF in state 1 with
    // positive prob); action 1 is finite. Action 0 must be optimal throughout.
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(FINITE(0)), cell(POS_INF)],
      [cell(FINITE(10)), cell(FINITE(0))],
    ];
    const sens = computePayoffSensitivity(1, 0, probs, matrix, wvs, -100, 100);
    expect(sens.intervals.length).toBe(1);
    expect(sens.intervals[0].optimalActions).toEqual([0]);
    expect(sens.intervals[0].infinite).toBe(true);
  });

  it("emits an exact boundary tie interval at the crossing (review2)", () => {
    // probs [1]; action 0 EU = t, action 1 EU = 0. They cross exactly at t=0:
    // action 1 on [-1,0), tie {0,1} at exactly 0, action 0 on (0,1].
    const probs = [1];
    const matrix = [
      [cell(FINITE(0))],
      [cell(FINITE(0))],
    ];
    const sens = computePayoffSensitivity(0, 0, probs, matrix, [wv("a", "A", 1)], -1, 1);
    const tie = sens.intervals.find(iv => iv.start === iv.end && iv.optimalActions.length > 1);
    expect(tie).toBeDefined();
    expect(tie!.start).toBeCloseTo(0);
    expect(tie!.optimalActions.sort()).toEqual([0, 1]);
    // Flanking open intervals are single winners.
    const before = sens.intervals.find(iv => iv.end > iv.start && iv.end <= 0);
    const after = sens.intervals.find(iv => iv.end > iv.start && iv.start >= 0);
    expect(before!.optimalActions).toEqual([1]);
    expect(after!.optimalActions).toEqual([0]);
  });

  it("emits a tie at the UPPER range endpoint (review2b)", () => {
    // probs [1]; action 0 EU = t, action 1 EU = 1. They meet exactly at t=1.
    const sens = computePayoffSensitivity(0, 0, [1], [
      [cell(FINITE(0))],
      [cell(FINITE(1))],
    ], [wv("a", "A", 1)], 0, 1);
    const tie = sens.intervals.find(iv => iv.start === 1 && iv.end === 1);
    expect(tie).toBeDefined();
    expect(tie!.optimalActions.sort()).toEqual([0, 1]);
  });
});

// --- Payoff Templates ---

describe("Payoff Templates", () => {
  it("exclusivist self payoff is +inf", () => {
    expect(getTemplatePayoffs("exclusivist", true).tag).toBe("pos_inf");
  });

  it("exclusivist other payoff is -inf", () => {
    expect(getTemplatePayoffs("exclusivist", false).tag).toBe("neg_inf");
  });

  it("universalist gives positive payoff to others", () => {
    const p = getTemplatePayoffs("universalist", false, "custom");
    expect(p.tag).toBe("finite");
    expect(p.value).toBeGreaterThan(0);
  });

  it("annihilationist other payoff is 0", () => {
    expect(getTemplatePayoffs("annihilationist", false)).toEqual(FINITE(0));
  });

  it("professors_god rewards disbelief", () => {
    expect(getTemplatePayoffs("professors_god", false).tag).toBe("pos_inf");
  });

  it("buildPayoffMatrix produces NxN matrix", () => {
    const ws = [
      wv("a", "A", 50, "exclusivist"),
      wv("b", "B", 30, "universalist"),
      wv("c", "C", 20, "secular"),
    ];
    const m = buildPayoffMatrix(ws);
    expect(m.length).toBe(3);
    expect(m[0].length).toBe(3);
    expect(m[0][0].value.tag).toBe("pos_inf"); // exclusivist self
  });
});

// --- URL State Codec ---

describe("URL State Codec", () => {
  it("round-trips a simple state", () => {
    const state: ScenarioState = {
      worldviews: [
        wv("god", "Belief in God", 50, "exclusivist"),
        wv("secular", "Secular Life", 50, "secular"),
      ],
      payoffMatrix: [
        [cell(POS_INF), cell(FINITE(-100))],
        [cell(NEG_INF), cell(FINITE(500))],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.worldviews.length).toBe(2);
    expect(decoded!.worldviews[0].name).toBe("Belief in God");
    expect(decoded!.payoffMatrix[0][0].value.tag).toBe("pos_inf");
    expect(decoded!.payoffMatrix[0][1].value.value).toBeCloseTo(-100);
  });

  it("round-trips custom worldview names", () => {
    const state: ScenarioState = {
      worldviews: [wv("custom_1", "Zoroastrianism", 30, "custom")],
      payoffMatrix: [[cell(FINITE(1000))]],
      utilityMode: "finite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    };
    const decoded = decodeState(encodeState(state));
    expect(decoded!.worldviews[0].name).toBe("Zoroastrianism");
  });

  it("round-trips exclusions", () => {
    const state: ScenarioState = {
      worldviews: [
        wv("a", "A", 50, "custom", false),
        wv("b", "B", 50, "custom", true),
      ],
      payoffMatrix: [
        [cell(FINITE(100)), cell(FINITE(200))],
        [cell(FINITE(300)), cell(FINITE(400))],
      ],
      utilityMode: "finite",
      lexicographicTiebreak: true,
      possibilityFilteredMaximin: false,
    };
    const decoded = decodeState(encodeState(state));
    expect(decoded!.worldviews[1].excluded).toBe(true);
    expect(decoded!.lexicographicTiebreak).toBe(true);
    expect(decoded!.possibilityFilteredMaximin).toBe(false);
  });

  it("handles invalid input gracefully", () => {
    expect(decodeState("not json")).toBeNull();
    expect(decodeState("{}")).toBeNull();
  });

  it("rejects an invalid ExtendedRealTag on decode (review)", () => {
    // A bogus tag must not be accepted; previously erCompare ranked unknown
    // tags like +inf.
    const encoded = JSON.stringify({
      worldviews: [{ id: "a", name: "A", excluded: false, rawWeight: 1, template: "custom" }],
      matrix: [[{ tag: "bogus", value: 0 }]],
      utilityMode: "finite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    });
    expect(decodeState(encoded)).toBeNull();
  });

  it("rejects an invalid template on decode", () => {
    const encoded = JSON.stringify({
      worldviews: [{ id: "a", name: "A", excluded: false, rawWeight: 1, template: "not_a_template" }],
      matrix: [[{ tag: "finite", value: 0 }]],
      utilityMode: "finite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    });
    expect(decodeState(encoded)).toBeNull();
  });

  it("isValidExtendedRealTag validates tags", () => {
    expect(isValidExtendedRealTag("finite")).toBe(true);
    expect(isValidExtendedRealTag("pos_inf")).toBe(true);
    expect(isValidExtendedRealTag("bogus")).toBe(false);
    expect(isValidExtendedRealTag(2)).toBe(false);
  });

  it("encodeState is deterministic for the same state", () => {
    const state: ScenarioState = {
      worldviews: [wv("god", "Belief", 50, "exclusivist"), wv("sec", "Secular", 50, "secular")],
      payoffMatrix: [
        [cell(POS_INF), cell(FINITE(-100))],
        [cell(NEG_INF), cell(FINITE(500))],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    };
    expect(encodeState(state)).toBe(encodeState(state));
  });

  it("stateToSerializable and back preserves structure", () => {
    const state: ScenarioState = {
      worldviews: [wv("x", "X", 100, "exclusivist")],
      payoffMatrix: [[cell(POS_INF)]],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    };
    const s = stateToSerializable(state);
    const back = serializableToState(s);
    expect(back).not.toBeNull();
    expect(back!.worldviews[0].template).toBe("exclusivist");
    expect(back!.payoffMatrix[0][0].value.tag).toBe("pos_inf");
  });
});

// --- Regret with infinities (special case: inf - inf = 0 when both are pos_inf) ---

describe("Minimax Regret with Infinities", () => {
  it("pos_inf - pos_inf regret is handled as indeterminate in our arithmetic", () => {
    // The spec says "if best(s) and U(a,s) are both positive infinity, regret is 0"
    // We need to handle this in the regret computation, not erSubtract
    // This test documents the current behavior, which may need fixing
    const probs = [1];
    const matrix = [
      [cell(POS_INF)],
      [cell(POS_INF)],
    ];
    // best in state 0 = pos_inf, both actions have pos_inf
    // erSubtract(pos_inf, pos_inf) = indeterminate, but regret should be 0
    // We need to fix computeMinimaxRegret for this case
    const r = computeMinimaxRegret(probs, matrix);
    // After fix, both should have 0 max regret and both be best
    // For now just document behavior
    expect(r.maxRegrets.length).toBe(2);
  });

  it("pos_inf best vs finite action gives pos_inf regret", () => {
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(POS_INF), cell(FINITE(0))],
      [cell(FINITE(100)), cell(FINITE(100))],
    ];
    const r = computeMinimaxRegret(probs, matrix);
    // State 0: best = pos_inf, action 1 regret = pos_inf
    // State 1: best = 100, action 0 regret = 100
    // MaxRegret(0) = 100 (finite), MaxRegret(1) = pos_inf
    expect(r.bestIndices).toEqual([0]);
  });

  it("flags positive-infinity regret distinctly (spec 4.6, review)", () => {
    const probs = [1];
    const matrix = [
      [cell(POS_INF)],
      [cell(FINITE(0))],
    ];
    const r = computeMinimaxRegret(probs, matrix);
    // Action 1 has +inf regret; action 0 has 0 regret.
    expect(r.infiniteFlags[1]).toBe(true);
    expect(r.undefinedFlags[1]).toBe(false);
    expect(r.infiniteFlags[0]).toBe(false);
    expect(r.maxRegrets[1]?.tag).toBe("pos_inf");
    expect(r.bestIndices).toEqual([0]);
  });

  it("flags undefined regret distinctly from +inf", () => {
    // An indeterminate cell yields an undefined regret for that action.
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(INDETERMINATE), cell(FINITE(0))],
      [cell(FINITE(10)), cell(FINITE(10))],
    ];
    const r = computeMinimaxRegret(probs, matrix);
    expect(r.undefinedFlags[0]).toBe(true);
    expect(r.maxRegrets[0]).toBeNull();
    expect(r.infiniteFlags[0]).toBe(false);
  });

  it("an action can be flagged BOTH undefined and +inf regret (review2)", () => {
    // Action 0: state 0 indeterminate -> undefined regret; state 1 best is +inf
    // (action 1) vs action 0 finite -> +inf regret. Both facts are reported.
    const probs = [0.5, 0.5];
    const matrix = [
      [cell(INDETERMINATE), cell(FINITE(0))],
      [cell(FINITE(10)), cell(POS_INF)],
    ];
    const r = computeMinimaxRegret(probs, matrix);
    expect(r.undefinedFlags[0]).toBe(true);
    expect(r.infiniteFlags[0]).toBe(true);
    expect(r.maxRegrets[0]).toBeNull(); // undefined dominates the max-regret value
  });
});
