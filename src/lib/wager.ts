// Decision engine for Pascal's Wager instrument.
// Pure module: no UI imports, no side effects, fully deterministic.

// --- Extended Real Arithmetic (Section 4.1) ---

export type ExtendedRealTag = "finite" | "pos_inf" | "neg_inf" | "indeterminate";

export interface ExtendedReal {
  tag: ExtendedRealTag;
  value: number; // meaningful only when tag === "finite"
  // Spec 4.1: finite overflow must "clamp and flag". When a finite + finite
  // result is clamped to the safe-integer range, overflow is set to true so
  // the reporting layer can surface that arithmetic overflow occurred.
  overflow?: boolean;
}

export const FINITE = (v: number): ExtendedReal => ({ tag: "finite", value: v });
export const POS_INF: ExtendedReal = { tag: "pos_inf", value: 0 };
export const NEG_INF: ExtendedReal = { tag: "neg_inf", value: 0 };
export const INDETERMINATE: ExtendedReal = { tag: "indeterminate", value: 0 };

const SAFE_INT_LIMIT = Number.MAX_SAFE_INTEGER;

export function erAdd(a: ExtendedReal, b: ExtendedReal): ExtendedReal {
  if (a.tag === "indeterminate" || b.tag === "indeterminate") return INDETERMINATE;

  if (a.tag === "finite" && b.tag === "finite") {
    const sum = a.value + b.value;
    const carriedOverflow = a.overflow === true || b.overflow === true;
    // Keep the true sum rather than clamping intermediate results. Clamping mid
    // accumulation makes the running sum order-dependent and can reverse EU
    // rankings; flag overflow when the magnitude leaves the safe-integer range
    // so the reporting layer can surface it, but never corrupt the value.
    const overflowed = carriedOverflow || Math.abs(sum) > SAFE_INT_LIMIT;
    return overflowed ? { tag: "finite", value: sum, overflow: true } : FINITE(sum);
  }

  if (a.tag === "pos_inf" && b.tag === "neg_inf") return INDETERMINATE;
  if (a.tag === "neg_inf" && b.tag === "pos_inf") return INDETERMINATE;

  if (a.tag === "pos_inf" || b.tag === "pos_inf") return POS_INF;
  if (a.tag === "neg_inf" || b.tag === "neg_inf") return NEG_INF;

  return INDETERMINATE;
}

export function erMultiplyByProb(prob: number, payoff: ExtendedReal): ExtendedReal {
  if (prob === 0) return FINITE(0);
  if (payoff.tag === "indeterminate") return INDETERMINATE;
  if (payoff.tag === "pos_inf") return prob > 0 ? POS_INF : NEG_INF;
  if (payoff.tag === "neg_inf") return prob > 0 ? NEG_INF : POS_INF;
  return FINITE(prob * payoff.value);
}

export function erCompare(a: ExtendedReal, b: ExtendedReal): number | null {
  if (a.tag === "indeterminate" || b.tag === "indeterminate") return null;

  const rank = (x: ExtendedReal): number =>
    x.tag === "neg_inf" ? -2 : x.tag === "finite" ? 0 : 2;

  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (a.tag === "finite" && b.tag === "finite") {
    // Spec 4.4: finite EUs compare normally. No absolute tolerance bucket,
    // so distinct finite values (even tiny ones, e.g. 0 vs 5e-13) never
    // falsely tie.
    if (a.value === b.value) return 0;
    return a.value - b.value;
  }
  return 0;
}

export function erGte(a: ExtendedReal, b: ExtendedReal): boolean | null {
  const c = erCompare(a, b);
  if (c === null) return null;
  return c >= 0;
}

export function erGt(a: ExtendedReal, b: ExtendedReal): boolean | null {
  const c = erCompare(a, b);
  if (c === null) return null;
  return c > 0;
}

export function erMax(a: ExtendedReal, b: ExtendedReal): ExtendedReal | null {
  const c = erCompare(a, b);
  if (c === null) return null;
  return c >= 0 ? a : b;
}

export function erMin(a: ExtendedReal, b: ExtendedReal): ExtendedReal | null {
  const c = erCompare(a, b);
  if (c === null) return null;
  return c <= 0 ? a : b;
}

export function erSubtract(a: ExtendedReal, b: ExtendedReal): ExtendedReal {
  if (a.tag === "indeterminate" || b.tag === "indeterminate") return INDETERMINATE;

  const negB: ExtendedReal =
    b.tag === "finite" ? FINITE(-b.value) :
    b.tag === "pos_inf" ? NEG_INF :
    b.tag === "neg_inf" ? POS_INF :
    INDETERMINATE;

  return erAdd(a, negB);
}

export function erEqual(a: ExtendedReal, b: ExtendedReal): boolean {
  if (a.tag !== b.tag) return false;
  if (a.tag === "finite" && b.tag === "finite") return Math.abs(a.value - b.value) < 1e-12;
  return true;
}

export function erToString(v: ExtendedReal): string {
  switch (v.tag) {
    case "pos_inf": return "+INF";
    case "neg_inf": return "-INF";
    case "indeterminate": return "UNDEF";
    case "finite": return v.value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
}

// --- Probabilities (Section 4.2) ---

export interface Worldview {
  id: string;
  name: string;
  excluded: boolean;
  rawWeight: number;
  template: TheologyTemplate;
}

export type TheologyTemplate =
  | "exclusivist"
  | "universalist"
  | "annihilationist"
  | "professors_god"
  | "secular"
  | "custom";

export interface PayoffCell {
  value: ExtendedReal;
}

export interface ScenarioState {
  worldviews: Worldview[];
  payoffMatrix: PayoffCell[][]; // [action_row][state_col]
  utilityMode: UtilityMode;
  lexicographicTiebreak: boolean;
  possibilityFilteredMaximin: boolean;
}

export type UtilityMode = "finite" | "infinite" | "bounded" | "lexicographic";

export interface NormalizedProbabilities {
  probs: number[];
  // Spec 4.2: the all-zero case (no eligible worldview has positive weight) is
  // an explicit "no probability assigned" state, never a real distribution.
  noProbabilityAssigned: boolean;
}

/**
 * Normalize raw nonnegative weights to probabilities (spec 4.2).
 *
 * Returns the full result including the explicit "no probability assigned"
 * flag. When every eligible worldview is excluded or has zero weight, probs is
 * all zeros and noProbabilityAssigned is true; downstream code must not treat
 * that as a real distribution (it does not sum to 1).
 */
export function normalizeProbabilitiesResult(worldviews: Worldview[]): NormalizedProbabilities {
  // Guard non-finite / negative raw weights: an excluded worldview is exactly
  // 0; otherwise clamp to a finite nonnegative value. Infinity or NaN weights
  // cannot define a probability and are treated as 0 contribution.
  const weights = worldviews.map(w => {
    if (w.excluded) return 0;
    const raw = w.rawWeight;
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return raw;
  });
  const sum = weights.reduce((s, w) => s + w, 0);
  if (!Number.isFinite(sum) || sum <= 0) {
    // All zero (or non-finite): explicit no-probability-assigned state.
    return { probs: weights.map(() => 0), noProbabilityAssigned: true };
  }
  return { probs: weights.map(w => w / sum), noProbabilityAssigned: false };
}

/** Convenience accessor returning just the probability vector. */
export function normalizeProbabilities(worldviews: Worldview[]): number[] {
  return normalizeProbabilitiesResult(worldviews).probs;
}

// --- Expected Utility (Section 4.3) ---

export function computeEU(
  actionIdx: number,
  probs: number[],
  matrix: PayoffCell[][]
): ExtendedReal {
  let result: ExtendedReal = FINITE(0);
  for (let s = 0; s < probs.length; s++) {
    const term = erMultiplyByProb(probs[s], matrix[actionIdx][s].value);
    result = erAdd(result, term);
  }
  return result;
}

export interface EURanking {
  eus: ExtendedReal[];
  bestIndices: number[];
  tiedAtInfinity: boolean;
  hasIndeterminate: boolean;
}

export function rankByEU(probs: number[], matrix: PayoffCell[][]): EURanking {
  const n = matrix.length;
  const eus: ExtendedReal[] = [];
  for (let a = 0; a < n; a++) {
    eus.push(computeEU(a, probs, matrix));
  }

  let bestIndices: number[] = [];
  let bestEU: ExtendedReal | null = null;
  let hasIndeterminate = false;

  for (let a = 0; a < n; a++) {
    if (eus[a].tag === "indeterminate") {
      hasIndeterminate = true;
      continue;
    }
    if (bestEU === null) {
      bestEU = eus[a];
      bestIndices = [a];
    } else {
      const c = erCompare(eus[a], bestEU);
      if (c !== null && c > 0) {
        bestEU = eus[a];
        bestIndices = [a];
      } else if (c !== null && c === 0) {
        bestIndices.push(a);
      }
    }
  }

  const tiedAtInfinity = bestIndices.length > 1 && bestEU?.tag === "pos_inf";
  return { eus, bestIndices, tiedAtInfinity, hasIndeterminate };
}

// --- Lexicographic Tiebreak (Section 4.5) ---

export interface LexicographicResult {
  rankedIndices: number[];
  infMasses: number[];
  finiteRemainders: number[];
  // The set of top-ranked actions that the lexicographic refinement could NOT
  // separate (equal on both infMass and finiteRemainder). When this has more
  // than one element, even the optional tiebreak leaves a genuine tie; callers
  // must not pick arbitrarily from it.
  topTieSet: number[];
}

export function lexicographicTiebreak(
  tiedIndices: number[],
  probs: number[],
  matrix: PayoffCell[][]
): LexicographicResult {
  const entries = tiedIndices.map(a => {
    let infMass = 0;
    let finiteRemainder = 0;
    for (let s = 0; s < probs.length; s++) {
      if (probs[s] === 0) continue;
      const cell = matrix[a][s].value;
      if (cell.tag === "pos_inf") {
        infMass += probs[s];
      } else if (cell.tag === "finite") {
        finiteRemainder += probs[s] * cell.value;
      }
    }
    return { idx: a, infMass, finiteRemainder };
  });

  entries.sort((x, y) => {
    if (Math.abs(x.infMass - y.infMass) > 1e-15) return y.infMass - x.infMass;
    return y.finiteRemainder - x.finiteRemainder;
  });

  // Determine how many top entries are mutually inseparable on both keys.
  const topTieSet: number[] = [];
  if (entries.length > 0) {
    const top = entries[0];
    for (const e of entries) {
      // Relative tolerance on the finite remainder so this stays consistent
      // with the exact sort above: genuinely distinct remainders (even tiny
      // ones at small magnitudes) separate, while float noise at large
      // magnitudes is still absorbed.
      const remTol = 1e-9 * Math.max(Math.abs(e.finiteRemainder), Math.abs(top.finiteRemainder));
      if (Math.abs(e.infMass - top.infMass) <= 1e-15 &&
          Math.abs(e.finiteRemainder - top.finiteRemainder) <= remTol) {
        topTieSet.push(e.idx);
      } else {
        break;
      }
    }
  }

  return {
    rankedIndices: entries.map(e => e.idx),
    infMasses: entries.map(e => e.infMass),
    finiteRemainders: entries.map(e => e.finiteRemainder),
    topTieSet,
  };
}

// --- Statewise Dominance (Section 4.6) ---

export interface DominanceResult {
  undominatedIndices: number[];
  dominantIndex: number | null; // strictly dominant action, or null
}

export function computeDominance(
  probs: number[],
  matrix: PayoffCell[][]
): DominanceResult {
  const n = matrix.length;
  const dominated = new Set<number>();

  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      if (dominated.has(a)) break;
      let weaklyBetter = true;
      let strictlyBetterSomewhere = false;
      for (let s = 0; s < probs.length; s++) {
        if (probs[s] === 0) continue;
        const cmp = erCompare(matrix[b][s].value, matrix[a][s].value);
        if (cmp === null) { weaklyBetter = false; break; }
        if (cmp < 0) { weaklyBetter = false; break; }
        if (cmp > 0) strictlyBetterSomewhere = true;
      }
      if (weaklyBetter && strictlyBetterSomewhere) {
        dominated.add(a);
        break;
      }
    }
  }

  const undominated = Array.from({ length: n }, (_, i) => i).filter(i => !dominated.has(i));

  let dominantIndex: number | null = null;
  if (undominated.length === 1) {
    let isDominant = true;
    const candidate = undominated[0];
    for (let b = 0; b < n; b++) {
      if (b === candidate) continue;
      let strictlyBetterSomewhere = false;
      for (let s = 0; s < probs.length; s++) {
        if (probs[s] === 0) continue;
        const cmp = erCompare(matrix[candidate][s].value, matrix[b][s].value);
        if (cmp === null || cmp < 0) { isDominant = false; break; }
        if (cmp > 0) strictlyBetterSomewhere = true;
      }
      if (!isDominant || !strictlyBetterSomewhere) { isDominant = false; break; }
    }
    if (isDominant) dominantIndex = candidate;
  }

  return { undominatedIndices: undominated, dominantIndex };
}

// --- Maximin (Section 4.6) ---

export interface MaximinResult {
  bestIndices: number[];
  worstPayoffs: (ExtendedReal | null)[];
  // The full worst-to-best sorted payoff sequence per action (over the
  // in-scope states), used for the spec 4.6 next-worst tie-break. null when
  // the action has an indeterminate cell in scope (worst case undefined).
  sortedPayoffs: (ExtendedReal[] | null)[];
}

/**
 * Compare two actions for maximin (spec 4.6).
 *
 * Primary key: the single worst payoff (extended-real order; any -inf worst
 * case makes the action maximally bad). Standard maximin ties two actions with
 * equal worst cases. The spec adds ONE refinement: when the shared worst case
 * is negative infinity, break the tie by comparing the next-worst outcome, then
 * the next, lexicographically over the ascending sorted sequences (so two
 * actions that are both "maximally bad" at -inf are still distinguished by how
 * bad they are beyond that). If still tied, reported tied. For finite (or
 * +inf) shared worst cases, no next-worst tie-break: they tie as in ordinary
 * maximin. Returns >0 if a is strictly better, <0 if b is, 0 if tied.
 */
function compareMaximinSequences(a: ExtendedReal[], b: ExtendedReal[]): number {
  const wa = a[0];
  const wb = b[0];
  const worstCmp = erCompare(wa, wb);
  if (worstCmp === null) return 0;
  if (worstCmp !== 0) return worstCmp;

  // Worst cases are equal. Only -inf shared worst cases get the next-worst
  // tie-break (spec 4.6). Otherwise, ordinary maximin reports a tie.
  if (wa.tag !== "neg_inf") return 0;

  const len = Math.max(a.length, b.length);
  for (let i = 1; i < len; i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai === undefined && bi === undefined) return 0;
    if (ai === undefined) return -1; // a exhausted, b still has worse-to-go
    if (bi === undefined) return 1;
    const c = erCompare(ai, bi);
    if (c === null) return 0;
    if (c !== 0) return c;
  }
  return 0;
}

export function computeMaximin(
  probs: number[],
  matrix: PayoffCell[][],
  possibilityFiltered: boolean
): MaximinResult {
  const n = matrix.length;
  const worstPayoffs: (ExtendedReal | null)[] = [];
  const sortedPayoffs: (ExtendedReal[] | null)[] = [];

  for (let a = 0; a < n; a++) {
    const inScope: ExtendedReal[] = [];
    let undefinedWorst = false;
    for (let s = 0; s < probs.length; s++) {
      if (possibilityFiltered && probs[s] === 0) continue;
      const cell = matrix[a][s].value;
      if (cell.tag === "indeterminate") {
        undefinedWorst = true;
        break;
      }
      inScope.push(cell);
    }
    if (undefinedWorst || inScope.length === 0) {
      worstPayoffs.push(null);
      sortedPayoffs.push(null);
      continue;
    }
    // Ascending sort: index 0 is the worst, index 1 the next-worst, etc.
    const sorted = inScope.slice().sort((x, y) => {
      const c = erCompare(x, y);
      return c === null ? 0 : c;
    });
    sortedPayoffs.push(sorted);
    worstPayoffs.push(sorted[0]);
  }

  let bestIndices: number[] = [];
  let bestSeq: ExtendedReal[] | null = null;

  for (let a = 0; a < n; a++) {
    const seq = sortedPayoffs[a];
    if (seq === null) continue;
    if (bestSeq === null) {
      bestSeq = seq;
      bestIndices = [a];
    } else {
      const c = compareMaximinSequences(seq, bestSeq);
      if (c > 0) {
        bestSeq = seq;
        bestIndices = [a];
      } else if (c === 0) {
        bestIndices.push(a);
      }
    }
  }

  return { bestIndices, worstPayoffs, sortedPayoffs };
}

// --- Minimax Regret (Section 4.6) ---

export interface MinimaxRegretResult {
  bestIndices: number[];
  maxRegrets: (ExtendedReal | null)[];
  regretMatrix: (ExtendedReal | null)[][];
  // Spec 4.6: an action with any undefined regret (indeterminate cell) or any
  // positive-infinity regret is flagged accordingly, distinctly. undefinedFlags
  // is set when the action has at least one undefined regret cell;
  // infiniteFlags when its max regret is positive infinity. These are kept
  // separate so the reporting layer never collapses "undefined" into "+inf".
  undefinedFlags: boolean[];
  infiniteFlags: boolean[];
}

export function computeMinimaxRegret(
  probs: number[],
  matrix: PayoffCell[][]
): MinimaxRegretResult {
  const n = matrix.length;
  const nStates = probs.length;

  const bestInState: (ExtendedReal | null)[] = [];
  for (let s = 0; s < nStates; s++) {
    if (probs[s] === 0) { bestInState.push(null); continue; }
    let best: ExtendedReal | null = null;
    for (let a = 0; a < n; a++) {
      const cell = matrix[a][s].value;
      if (cell.tag === "indeterminate") continue;
      if (best === null) {
        best = cell;
      } else {
        const m = erMax(best, cell);
        if (m !== null) best = m;
      }
    }
    bestInState.push(best);
  }

  const regretMatrix: (ExtendedReal | null)[][] = [];
  const maxRegrets: (ExtendedReal | null)[] = [];
  const undefinedFlags: boolean[] = [];
  const infiniteFlags: boolean[] = [];

  for (let a = 0; a < n; a++) {
    const row: (ExtendedReal | null)[] = [];
    let maxR: ExtendedReal | null = null;
    let hasUndefined = false;
    let hasInfinite = false;

    for (let s = 0; s < nStates; s++) {
      if (probs[s] === 0) { row.push(null); continue; }
      const best = bestInState[s];
      const cell = matrix[a][s].value;
      if (best === null || cell.tag === "indeterminate") {
        row.push(null);
        hasUndefined = true;
        continue;
      }
      // Spec 4.6: if best(s) and U(a,s) are both pos_inf, regret is 0
      // (erSubtract would give indeterminate, but this is a definitional choice)
      let regret: ExtendedReal;
      if (best.tag === "pos_inf" && cell.tag === "pos_inf") {
        regret = FINITE(0);
      } else if (best.tag === "neg_inf" && cell.tag === "neg_inf") {
        regret = FINITE(0);
      } else {
        regret = erSubtract(best, cell);
      }
      if (regret.tag === "indeterminate") {
        row.push(null);
        hasUndefined = true;
      } else {
        if (regret.tag === "pos_inf") hasInfinite = true;
        row.push(regret);
        if (maxR === null) {
          maxR = regret;
        } else {
          const m = erMax(maxR, regret);
          if (m === null) hasUndefined = true;
          else maxR = m;
        }
      }
    }
    regretMatrix.push(row);
    // Undefined regret makes the action's MAX regret undefined (null), so it is
    // not minimax-eligible. But undefined and +inf are reported as distinct,
    // independent facts (spec 4.6): an action can have BOTH an undefined cell
    // and a +inf cell, and both flags are set.
    maxRegrets.push(hasUndefined ? null : maxR);
    undefinedFlags.push(hasUndefined);
    infiniteFlags.push(hasInfinite);
  }

  let bestIndices: number[] = [];
  let bestMaxRegret: ExtendedReal | null = null;

  for (let a = 0; a < n; a++) {
    const mr = maxRegrets[a];
    if (mr === null) continue;
    if (bestMaxRegret === null) {
      bestMaxRegret = mr;
      bestIndices = [a];
    } else {
      const c = erCompare(mr, bestMaxRegret);
      if (c !== null && c < 0) {
        bestMaxRegret = mr;
        bestIndices = [a];
      } else if (c !== null && c === 0) {
        bestIndices.push(a);
      }
    }
  }

  return { bestIndices, maxRegrets, regretMatrix, undefinedFlags, infiniteFlags };
}

// --- Full Decision Result ---

export interface DecisionResult {
  probs: number[];
  // Spec 4.2: true when no eligible worldview has positive weight. The state
  // carries no probability distribution and no decision rule is evaluated.
  noProbabilityAssigned: boolean;
  euRanking: EURanking;
  lexResult: LexicographicResult | null;
  dominance: DominanceResult;
  maximin: MaximinResult;
  minimaxRegret: MinimaxRegretResult;
  headline: {
    // pick is null whenever expected utility cannot name a unique optimum
    // (genuine +inf tie with tiebreak off, all-indeterminate EU, or no
    // probability assigned). The reporting layer must not fabricate a pick.
    pick: string | null;
    // The EU-optimal action set, honestly: one element for a unique optimum,
    // multiple for a tie, empty when EU has no defined optimum.
    euOptimum: number[];
    // True when EU genuinely cannot discriminate a single optimum.
    euTied: boolean;
    // True when no action has a defined (non-indeterminate) expectation.
    euUndefined: boolean;
    rule: string;
    reason: string;
    disagreement: boolean;
  };
}

export function computeFullDecision(state: ScenarioState): DecisionResult {
  const norm = normalizeProbabilitiesResult(state.worldviews);
  const probs = norm.probs;
  const euRanking = rankByEU(probs, state.payoffMatrix);
  const dominance = computeDominance(probs, state.payoffMatrix);
  const maximin = computeMaximin(probs, state.payoffMatrix, state.possibilityFilteredMaximin);
  const minimaxRegret = computeMinimaxRegret(probs, state.payoffMatrix);

  let lexResult: LexicographicResult | null = null;
  if (state.lexicographicTiebreak && euRanking.tiedAtInfinity) {
    lexResult = lexicographicTiebreak(euRanking.bestIndices, probs, state.payoffMatrix);
  }

  // Spec 4.2: no probability assigned. Surface explicitly; do not evaluate or
  // fabricate any EU optimum.
  if (norm.noProbabilityAssigned) {
    return {
      probs,
      noProbabilityAssigned: true,
      euRanking,
      lexResult: null,
      dominance,
      maximin,
      minimaxRegret,
      headline: {
        pick: null,
        euOptimum: [],
        euTied: false,
        euUndefined: false,
        rule: "none",
        reason: "No probability is assigned: every worldview is excluded or has zero weight. The model cannot evaluate any decision rule until at least one worldview has positive credence.",
        disagreement: false,
      },
    };
  }

  // Determine the honest EU optimum set.
  // - lexicographic tiebreak, when on and the tie is at +inf, yields the set of
  //   top entries it could separate to; if that top set is still >1 (equal mass
  //   AND remainder), the tiebreak genuinely failed and the tie stands.
  // - otherwise the EU optimum is exactly rankByEU's bestIndices.
  const euOptimum = lexResult && lexResult.topTieSet.length > 0
    ? lexResult.topTieSet
    : euRanking.bestIndices;

  const euUndefined = euRanking.bestIndices.length === 0;
  // A genuine tie EU cannot break: more than one optimum.
  const euTied = euOptimum.length > 1;

  // pick is only defined when EU names exactly one optimal action.
  const uniquePickIdx = euOptimum.length === 1 ? euOptimum[0] : null;
  const pickName = uniquePickIdx !== null
    ? (state.worldviews[uniquePickIdx]?.name ?? null)
    : null;

  // Disagreement compares the rules' optimal sets. When EU has no unique pick,
  // we still compare its optimal SET against the other rules' sets.
  const picks = {
    eu: new Set(euOptimum),
    dom: dominance.dominantIndex !== null ? new Set([dominance.dominantIndex]) : new Set(dominance.undominatedIndices),
    maximin: new Set(maximin.bestIndices),
    regret: new Set(minimaxRegret.bestIndices),
  };
  const allPicksArr = Array.from(picks.eu)
    .concat(Array.from(picks.dom))
    .concat(Array.from(picks.maximin))
    .concat(Array.from(picks.regret));
  const allPicks = new Set(allPicksArr);
  const disagreement = allPicks.size > 1 ||
    !setsEqual(picks.eu, picks.maximin) ||
    !setsEqual(picks.eu, picks.regret);

  let reason: string;
  let rule: string;
  if (euUndefined) {
    rule = "expected utility (undefined)";
    reason = "Expectation is undefined for every action (each combines positive and negative infinity). Expected utility names no optimum here.";
  } else if (euRanking.tiedAtInfinity && !state.lexicographicTiebreak) {
    rule = "expected utility (tied)";
    reason = "Multiple actions have infinite expected utility and are genuinely tied. Expected utility cannot discriminate among them. Enable the lexicographic tiebreak for an optional finer distinction.";
  } else if (euRanking.tiedAtInfinity && lexResult && lexResult.topTieSet.length === 1) {
    rule = "expected utility + lexicographic tiebreak";
    reason = `Infinite EU tie broken lexicographically by probability mass on infinite-reward states (${(lexResult.infMasses[0] * 100).toFixed(1)}%).`;
  } else if (euRanking.tiedAtInfinity && lexResult) {
    // Lexicographic refinement applied but could not separate the top actions
    // (equal infinite-reward mass and finite remainder).
    rule = "expected utility (tied)";
    reason = "Multiple actions have infinite expected utility and remain tied even under the lexicographic tiebreak (equal infinite-reward mass and finite remainder).";
  } else if (euTied) {
    rule = "expected utility (tied)";
    reason = "Multiple actions are tied at the same expected utility; expected utility names no single optimum.";
  } else {
    rule = "expected utility";
    const eu = euRanking.eus[uniquePickIdx!];
    reason = `Highest expected utility: ${erToString(eu)}.`;
  }

  return {
    probs,
    noProbabilityAssigned: false,
    euRanking,
    lexResult,
    dominance,
    maximin,
    minimaxRegret,
    headline: {
      pick: pickName,
      euOptimum,
      euTied,
      euUndefined,
      rule,
      reason,
      disagreement,
    },
  };
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  let equal = true;
  a.forEach(v => { if (!b.has(v)) equal = false; });
  return equal;
}

// --- Sensitivity Analysis (Section 4.7) ---

export interface BreakpointInterval {
  start: number;
  end: number;
  // The first action in the optimal set, kept for back-compatibility and
  // simple display. Always equals optimalActions[0].
  optimalAction: number;
  // The full optimal set over this interval (spec 4.7): more than one entry
  // when actions tie (identical affine lines, or an exact boundary tie). For an
  // interval whose optimum is +inf (the infinite-EU discontinuity case), this
  // is the set of actions whose EU is +inf.
  optimalActions: number[];
  // True when the action(s) here are optimal because EU jumps to +inf for any
  // t > 0 (the contested core of the Wager), not via a finite affine envelope.
  infinite?: boolean;
}

export interface SensitivityResult {
  parameter: string;
  parameterIndex: number;
  intervals: BreakpointInterval[];
  currentValue: number;
  breakpoints: number[];
  discontinuityAtZero: boolean;
  // Set when proportional renormalization of the other states is undefined
  // (currentP === 1, so there is no other positive mass to scale). The affine
  // model does not apply; reported rather than silently invented.
  renormalizationUndefined?: boolean;
}

// Shared helpers for sensitivity merging and tie-aware optima.

function sameOptimalSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function mergeIntervals(intervals: BreakpointInterval[]): BreakpointInterval[] {
  const merged: BreakpointInterval[] = [];
  for (const iv of intervals) {
    const last = merged[merged.length - 1];
    if (last && last.infinite === iv.infinite && sameOptimalSet(last.optimalActions, iv.optimalActions)) {
      last.end = iv.end;
    } else {
      merged.push({ ...iv, optimalActions: [...iv.optimalActions] });
    }
  }
  return merged;
}

/**
 * Build a tie-aware upper envelope from a per-point extended-real evaluator and
 * a set of candidate interior breakpoints, over [lo, hi].
 *
 * For each interval between consecutive breakpoints it samples the winner at
 * the midpoint with EXACT extended-real comparison. It additionally emits a
 * degenerate [b, b] point at any breakpoint OR endpoint whose optimum differs
 * from the adjacent open interval(s): a tie there (set size > 1), or a unique
 * winner that differs from the neighboring open interval (the boundary jump,
 * e.g. the t = 0 / t = 1 degenerate-distribution discontinuities). This honors
 * spec 4.7's "any ties at boundaries" and the boundary-discontinuity rule.
 * Adjacent intervals with the same optimal set are merged.
 */
function buildEnvelope(
  n: number,
  lo: number,
  hi: number,
  interiorBreakpoints: number[],
  euAtT: (a: number, t: number) => ExtendedReal,
): BreakpointInterval[] {
  const optimalSetAt = (t: number): { set: number[]; infinite: boolean } => {
    let best: ExtendedReal | null = null;
    for (let a = 0; a < n; a++) {
      const v = euAtT(a, t);
      if (v.tag === "indeterminate") continue;
      if (best === null) { best = v; continue; }
      const c = erCompare(v, best);
      if (c !== null && c > 0) best = v;
    }
    const set: number[] = [];
    if (best === null) return { set, infinite: false };
    for (let a = 0; a < n; a++) {
      const v = euAtT(a, t);
      if (v.tag === "indeterminate") continue;
      if (erCompare(v, best) === 0) set.push(a);
    }
    return { set, infinite: best.tag === "pos_inf" };
  };

  const bps = Array.from(new Set([lo, hi, ...interiorBreakpoints]))
    .filter(t => t >= lo && t <= hi)
    .sort((a, b) => a - b);

  if (bps.length === 1) {
    // Degenerate range: a single point. Report its optimum (tie or single).
    const { set, infinite } = optimalSetAt(bps[0]);
    return set.length > 0
      ? [{ start: bps[0], end: bps[0], optimalAction: set[0], optimalActions: set, infinite: infinite || undefined }]
      : [];
  }

  // Open-interval winners between consecutive breakpoints.
  const openSets: { set: number[]; infinite: boolean }[] = [];
  for (let i = 0; i < bps.length - 1; i++) {
    openSets.push(optimalSetAt((bps[i] + bps[i + 1]) / 2));
  }

  const raw: BreakpointInterval[] = [];
  const pushPoint = (t: number) => {
    const { set, infinite } = optimalSetAt(t);
    if (set.length > 0) {
      raw.push({ start: t, end: t, optimalAction: set[0], optimalActions: set, infinite: infinite || undefined });
    }
  };

  for (let i = 0; i < bps.length - 1; i++) {
    const start = bps[i];
    const end = bps[i + 1];
    if (end <= start) continue;

    // Emit a degenerate point at `start` when the point optimum differs from
    // the open interval on either side (a tie, or a boundary jump to/from a
    // unique winner). For the lower endpoint (i === 0) there is no left side.
    const here = optimalSetAt(start);
    const left = openSets[i - 1]; // open interval ending at `start`, if any
    const right = openSets[i];
    const differsRight = !sameOptimalSet(here.set, right.set);
    const differsLeft = left !== undefined && !sameOptimalSet(here.set, left.set);
    if (here.set.length > 0 && (differsRight || differsLeft)) {
      pushPoint(start);
    }

    // Skip open intervals where NO action has a defined optimum (every action
    // indeterminate across the interior): there is no EU optimum to report, and
    // emitting an empty optimalActions would violate the type. The endpoints,
    // handled as degenerate points above/below, may still carry a defined
    // optimum (e.g. anti-diagonal infinities define +inf only at t = 0 and 1).
    if (right.set.length > 0) {
      raw.push({ start, end, optimalAction: right.set[0], optimalActions: right.set, infinite: right.infinite || undefined });
    }
  }
  // Upper endpoint: emit when its optimum differs from the last open interval.
  const hiPoint = optimalSetAt(bps[bps.length - 1]);
  const lastOpen = openSets[openSets.length - 1];
  if (hiPoint.set.length > 0 && !sameOptimalSet(hiPoint.set, lastOpen.set)) {
    pushPoint(bps[bps.length - 1]);
  }

  return mergeIntervals(raw);
}

export function computeCredenceSensitivity(
  varyIdx: number,
  probs: number[],
  matrix: PayoffCell[][],
  worldviews: Worldview[]
): SensitivityResult {
  const n = matrix.length;
  const nStates = probs.length;

  const currentP = probs[varyIdx];
  const otherSum = 1 - currentP;
  const parameter = worldviews[varyIdx]?.name ?? `Worldview ${varyIdx}`;

  // Undefined ONLY when there is genuinely no other mass to renormalize (the
  // varied state already holds all probability). A tiny-but-positive otherSum
  // still defines proportional renormalization, so do not over-trigger on a
  // near-1 credence.
  const renormalizationUndefined = otherSum <= 0;

  const hasInfAtPositive = matrix.some((row) => {
    const cell = row[varyIdx]?.value;
    return cell && (cell.tag === "pos_inf" || cell.tag === "neg_inf");
  });

  // Spec 4.7 / review: when currentP === 1 there is no other positive mass to
  // renormalize, so the proportional-renormalization model is undefined. Do not
  // invent weights; report no determinate sensitivity.
  if (renormalizationUndefined) {
    return {
      parameter,
      parameterIndex: varyIdx,
      intervals: [],
      currentValue: currentP,
      breakpoints: [],
      discontinuityAtZero: hasInfAtPositive,
      renormalizationUndefined: true,
    };
  }

  // Counterfactual proportional weights for the non-varied states (sum to 1).
  const baseP: number[] = [];
  for (let s = 0; s < nStates; s++) baseP.push(s === varyIdx ? 0 : probs[s] / otherSum);

  // EU of action a as a function of t, in extended-real arithmetic. The varied
  // state gets probability t; every other state gets (1 - t) * baseP[s]. This
  // honors +inf / -inf / indeterminate cells exactly (spec 4.1, 4.3).
  const euAtT = (a: number, t: number): ExtendedReal => {
    let acc: ExtendedReal = FINITE(0);
    for (let s = 0; s < nStates; s++) {
      const ps = s === varyIdx ? t : (1 - t) * baseP[s];
      acc = erAdd(acc, erMultiplyByProb(ps, matrix[a][s].value));
    }
    return acc;
  };

  // Interior breakpoints come from crossings of FINITE affine pieces. An action
  // whose EU is finite for all t in (0,1) has affine EU(t). Compute its coeffs;
  // non-finite actions are flat extended lines (handled by euAtT/optimalSetAt at
  // sample points), so they contribute no finite crossing.
  const affine: ({ slope: number; intercept: number } | null)[] = [];
  for (let a = 0; a < n; a++) {
    // EU(t) = t*varied + (1-t)*sum(baseP[s]*cell_s). Finite only if the varied
    // cell and every positive-baseP cell are finite.
    let varied = 0;
    let otherC = 0;
    let finite = true;
    for (let s = 0; s < nStates; s++) {
      const cell = matrix[a][s].value;
      if (s === varyIdx) {
        if (cell.tag !== "finite") { finite = false; break; }
        varied = cell.value;
      } else if (baseP[s] > 0) {
        if (cell.tag !== "finite") { finite = false; break; }
        otherC += baseP[s] * cell.value;
      }
    }
    // EU(t) = t*varied + (1-t)*otherC = otherC + t*(varied - otherC).
    affine.push(finite ? { slope: varied - otherC, intercept: otherC } : null);
  }

  const interior: number[] = [];
  // Clamp-boundary candidates (spec 4.1): where a finite affine line would
  // reach ±MAX_SAFE_INTEGER, the clamped extended-real EU stops being affine, so
  // a switch can occur there that the unclamped affine crossing would miss. Add
  // those t values as candidate breakpoints (the midpoint sampling, which uses
  // the true clamped EU, then assigns the correct winner per sub-interval).
  for (let a = 0; a < n; a++) {
    const c = affine[a];
    if (!c || c.slope === 0) continue;
    for (const bound of [SAFE_INT_LIMIT, -SAFE_INT_LIMIT]) {
      const t = (bound - c.intercept) / c.slope;
      if (t > 0 && t < 1) interior.push(t);
    }
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const ci = affine[i];
      const cj = affine[j];
      if (!ci || !cj) continue;
      const dSlope = ci.slope - cj.slope;
      if (dSlope === 0) continue;
      const t = (cj.intercept - ci.intercept) / dSlope;
      if (t > 0 && t < 1) interior.push(t);
    }
  }

  // Build the open-interval envelope over (0, 1) plus boundary ties. We use a
  // tiny inset to sample the OPEN interval near the endpoints (the endpoints
  // themselves are degenerate distributions handled separately below).
  const intervals = buildEnvelope(n, 0, 1, interior, euAtT);

  // A discontinuity at t = 0 exists whenever some action's varied-state cell is
  // ±inf: its EU jumps between finite (at t = 0, varied excluded) and ±inf (at
  // any t > 0). Spec 4.7 wants this reported as a discontinuity, independent of
  // whether the winning ACTION changes. buildEnvelope already emits the t = 0
  // boundary point when its optimum differs from the interior.
  const discontinuityAtZero = hasInfAtPositive;

  const breakpoints = intervals.filter(iv => iv.end > iv.start).slice(1).map(iv => iv.start);

  return {
    parameter,
    parameterIndex: varyIdx,
    intervals,
    currentValue: currentP,
    breakpoints,
    discontinuityAtZero,
  };
}

export function computePayoffSensitivity(
  actionIdx: number,
  stateIdx: number,
  probs: number[],
  matrix: PayoffCell[][],
  worldviews: Worldview[],
  rangeMin: number,
  rangeMax: number
): SensitivityResult {
  const n = matrix.length;
  const p = probs[stateIdx];
  const parameter = `Payoff(${worldviews[actionIdx]?.name}, ${worldviews[stateIdx]?.name})`;
  const cur = matrix[actionIdx][stateIdx].value;
  const currentValue = cur.tag === "finite" ? cur.value : 0;

  // The EU of the unvaried actions is constant across t; the EU of actionIdx is
  // baseEU(without the varied cell) + p * t, when that base is finite. We model
  // every action's EU as an extended real so +inf / -inf / indeterminate cells
  // are honored (spec 4.8). Non-finite EUs are NOT dropped from the envelope.
  const baseEU = (a: number): ExtendedReal => {
    // EU excluding the varied cell for actionIdx, full EU otherwise.
    let acc: ExtendedReal = FINITE(0);
    for (let s = 0; s < probs.length; s++) {
      if (a === actionIdx && s === stateIdx) continue;
      acc = erAdd(acc, erMultiplyByProb(probs[s], matrix[a][s].value));
    }
    return acc;
  };
  const bases: ExtendedReal[] = [];
  for (let a = 0; a < n; a++) bases.push(baseEU(a));

  // EU of action a as a function of t. For the varied action, add p*t to its
  // base (only meaningful when its base is finite; if its base is already
  // infinite/indeterminate the varied finite cell cannot change the tag).
  const euAt = (a: number, t: number): ExtendedReal => {
    if (a !== actionIdx) return bases[a];
    const base = bases[a];
    if (base.tag !== "finite") return base; // varied finite cell can't flip an infinite/indeterminate base
    return erAdd(base, FINITE(p * t));
  };

  // Spec 4.7 / review #2: if the varied state has probability 0, varying the
  // payoff cannot change any EU. The current EU optimum holds across the whole
  // range. Report it explicitly rather than a placeholder action 0.
  if (p === 0) {
    // Sample the (constant) optimum once at any t.
    let best: ExtendedReal | null = null;
    for (let a = 0; a < n; a++) {
      const v = euAt(a, 0);
      if (v.tag === "indeterminate") continue;
      if (best === null) { best = v; continue; }
      const c = erCompare(v, best);
      if (c !== null && c > 0) best = v;
    }
    const set: number[] = [];
    if (best !== null) {
      for (let a = 0; a < n; a++) {
        const v = euAt(a, 0);
        if (v.tag !== "indeterminate" && erCompare(v, best) === 0) set.push(a);
      }
    }
    return {
      parameter,
      parameterIndex: stateIdx,
      intervals: set.length > 0
        ? [{ start: rangeMin, end: rangeMax, optimalAction: set[0], optimalActions: set, infinite: best?.tag === "pos_inf" || undefined }]
        : [],
      currentValue,
      breakpoints: [],
      discontinuityAtZero: false,
    };
  }

  // Interior breakpoints: pairwise crossings of the affine lines of FINITE-base
  // actions. Only actionIdx has nonzero slope (p); the others are flat. An
  // action with +inf/-inf base is a flat extended line that never produces a
  // finite crossing, but it is captured exactly by the per-point evaluator in
  // buildEnvelope, so it is NOT dropped from the envelope (review #8).
  const interior: number[] = [];
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      const baseA = bases[a].tag === "finite" ? bases[a].value : null;
      const baseB = bases[b].tag === "finite" ? bases[b].value : null;
      if (baseA === null || baseB === null) continue;
      const slopeA = a === actionIdx ? p : 0;
      const slopeB = b === actionIdx ? p : 0;
      const dSlope = slopeA - slopeB;
      if (dSlope === 0) continue;
      const t = (baseB - baseA) / dSlope;
      if (t > rangeMin && t < rangeMax) interior.push(t);
    }
  }
  // Clamp-boundary candidate for the varied action (spec 4.1): where its EU
  // base + p*t would reach ±MAX_SAFE_INTEGER, the clamped EU stops being affine.
  if (p !== 0 && bases[actionIdx].tag === "finite") {
    const base = bases[actionIdx].value;
    for (const bound of [SAFE_INT_LIMIT, -SAFE_INT_LIMIT]) {
      const t = (bound - base) / p;
      if (t > rangeMin && t < rangeMax) interior.push(t);
    }
  }

  const merged = buildEnvelope(n, rangeMin, rangeMax, interior, euAt);
  const breakpoints = merged.filter(iv => iv.end > iv.start).slice(1).map(iv => iv.start);

  return {
    parameter,
    parameterIndex: stateIdx,
    intervals: merged,
    currentValue,
    breakpoints,
    discontinuityAtZero: false,
  };
}

// --- Payoff Templates (Section 3.B.1) ---

export function getTemplatePayoffs(
  template: TheologyTemplate,
  isSelf: boolean,
  otherTemplate?: TheologyTemplate
): ExtendedReal {
  if (isSelf) {
    switch (template) {
      case "exclusivist": return POS_INF;
      case "universalist": return POS_INF;
      case "annihilationist": return POS_INF;
      case "professors_god": return FINITE(-1000);
      case "secular": return FINITE(500);
      case "custom": return FINITE(1000);
    }
  }

  switch (template) {
    case "exclusivist": return NEG_INF;
    case "universalist":
      if (otherTemplate === "secular") return FINITE(100);
      return FINITE(500);
    case "annihilationist": return FINITE(0);
    case "professors_god": return POS_INF;
    case "secular": return FINITE(0);
    case "custom": return FINITE(-500);
  }
}

export function buildPayoffMatrix(worldviews: Worldview[]): PayoffCell[][] {
  const n = worldviews.length;
  const matrix: PayoffCell[][] = [];
  for (let a = 0; a < n; a++) {
    const row: PayoffCell[] = [];
    for (let s = 0; s < n; s++) {
      const isSelf = a === s;
      const value = getTemplatePayoffs(
        worldviews[s].template,
        isSelf,
        isSelf ? undefined : worldviews[a].template
      );
      row.push({ value });
    }
    matrix.push(row);
  }
  return matrix;
}

// --- URL State Codec (Section 8) ---

export interface SerializableState {
  worldviews: Array<{
    id: string;
    name: string;
    excluded: boolean;
    rawWeight: number;
    template: TheologyTemplate;
  }>;
  matrix: Array<Array<{
    tag: ExtendedRealTag;
    value: number;
  }>>;
  utilityMode: UtilityMode;
  lexicographicTiebreak: boolean;
  possibilityFilteredMaximin: boolean;
}

export function stateToSerializable(state: ScenarioState): SerializableState {
  return {
    worldviews: state.worldviews.map(w => ({
      id: w.id,
      name: w.name,
      excluded: w.excluded,
      rawWeight: w.rawWeight,
      template: w.template,
    })),
    matrix: state.payoffMatrix.map(row =>
      row.map(cell => ({ tag: cell.value.tag, value: cell.value.value }))
    ),
    utilityMode: state.utilityMode,
    lexicographicTiebreak: state.lexicographicTiebreak,
    possibilityFilteredMaximin: state.possibilityFilteredMaximin,
  };
}

const VALID_ER_TAGS: ReadonlySet<string> = new Set<ExtendedRealTag>([
  "finite", "pos_inf", "neg_inf", "indeterminate",
]);
const VALID_TEMPLATES: ReadonlySet<string> = new Set<TheologyTemplate>([
  "exclusivist", "universalist", "annihilationist", "professors_god", "secular", "custom",
]);
const VALID_UTILITY_MODES: ReadonlySet<string> = new Set<UtilityMode>([
  "finite", "infinite", "bounded", "lexicographic",
]);

export function isValidExtendedRealTag(tag: unknown): tag is ExtendedRealTag {
  return typeof tag === "string" && VALID_ER_TAGS.has(tag);
}

/**
 * Convert a serializable state back into a runtime ScenarioState, validating
 * every ExtendedReal tag and template (spec 4.8 / 8). Returns null on any
 * invalid tag rather than letting an unknown tag (e.g. "bogus") fall through
 * and be ranked like +inf by erCompare.
 */
export function serializableToState(s: SerializableState): ScenarioState | null {
  if (!Array.isArray(s.worldviews) || !Array.isArray(s.matrix)) return null;

  for (const w of s.worldviews) {
    if (!VALID_TEMPLATES.has(w.template)) return null;
  }
  if (!VALID_UTILITY_MODES.has(s.utilityMode)) return null;

  const payoffMatrix: PayoffCell[][] = [];
  for (const row of s.matrix) {
    if (!Array.isArray(row)) return null;
    const outRow: PayoffCell[] = [];
    for (const cell of row) {
      if (!isValidExtendedRealTag(cell.tag)) return null;
      const value = typeof cell.value === "number" && Number.isFinite(cell.value) ? cell.value : 0;
      outRow.push({ value: { tag: cell.tag, value: cell.tag === "finite" ? value : 0 } });
    }
    payoffMatrix.push(outRow);
  }

  // Spec 8: a decoded matrix must be square and match the worldview count, or
  // downstream cell access (matrix[a][s]) goes out of bounds and throws on a
  // hand-crafted or corrupted share link.
  const n = s.worldviews.length;
  if (payoffMatrix.length !== n || payoffMatrix.some(r => r.length !== n)) return null;

  return {
    worldviews: s.worldviews.map(w => ({
      id: String(w.id),
      name: String(w.name),
      excluded: Boolean(w.excluded),
      rawWeight: typeof w.rawWeight === "number" && Number.isFinite(w.rawWeight) ? w.rawWeight : 0,
      template: w.template,
    })),
    payoffMatrix,
    utilityMode: s.utilityMode,
    lexicographicTiebreak: Boolean(s.lexicographicTiebreak),
    possibilityFilteredMaximin: Boolean(s.possibilityFilteredMaximin),
  };
}

export function encodeState(state: ScenarioState): string {
  const s = stateToSerializable(state);
  // Deterministic: JSON.stringify over a fixed key order (spec 4.8). No
  // randomness, no time dependence. Compression is handled at the call site.
  const json = JSON.stringify(s);
  return json;
}

export function decodeState(encoded: string): ScenarioState | null {
  try {
    const s: SerializableState = JSON.parse(encoded);
    if (!s || !s.worldviews || !s.matrix) return null;
    return serializableToState(s);
  } catch {
    return null;
  }
}
