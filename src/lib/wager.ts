// Decision engine for Pascal's Wager instrument.
// Pure module: no UI imports, no side effects, fully deterministic.

// --- Extended Real Arithmetic (Section 4.1) ---

export type ExtendedRealTag = "finite" | "pos_inf" | "neg_inf" | "indeterminate";

export interface ExtendedReal {
  tag: ExtendedRealTag;
  value: number; // meaningful only when tag === "finite"
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
    if (sum > SAFE_INT_LIMIT) return FINITE(SAFE_INT_LIMIT);
    if (sum < -SAFE_INT_LIMIT) return FINITE(-SAFE_INT_LIMIT);
    return FINITE(sum);
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
    if (Math.abs(a.value - b.value) < 1e-12) return 0;
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

export function normalizeProbabilities(worldviews: Worldview[]): number[] {
  const weights = worldviews.map(w => w.excluded ? 0 : Math.max(0, w.rawWeight));
  const sum = weights.reduce((s, w) => s + w, 0);
  if (sum === 0) return weights.map(() => 0);
  return weights.map(w => w / sum);
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

  return {
    rankedIndices: entries.map(e => e.idx),
    infMasses: entries.map(e => e.infMass),
    finiteRemainders: entries.map(e => e.finiteRemainder),
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
}

export function computeMaximin(
  probs: number[],
  matrix: PayoffCell[][],
  possibilityFiltered: boolean
): MaximinResult {
  const n = matrix.length;
  const worstPayoffs: (ExtendedReal | null)[] = [];

  for (let a = 0; a < n; a++) {
    let worst: ExtendedReal | null = null;
    for (let s = 0; s < probs.length; s++) {
      if (possibilityFiltered && probs[s] === 0) continue;
      const cell = matrix[a][s].value;
      if (cell.tag === "indeterminate") {
        worst = null;
        break;
      }
      if (worst === null) {
        worst = cell;
      } else {
        const m = erMin(worst, cell);
        if (m === null) { worst = null; break; }
        worst = m;
      }
    }
    worstPayoffs.push(worst);
  }

  let bestIndices: number[] = [];
  let bestWorst: ExtendedReal | null = null;

  for (let a = 0; a < n; a++) {
    const w = worstPayoffs[a];
    if (w === null) continue;
    if (bestWorst === null) {
      bestWorst = w;
      bestIndices = [a];
    } else {
      const c = erCompare(w, bestWorst);
      if (c !== null && c > 0) {
        bestWorst = w;
        bestIndices = [a];
      } else if (c !== null && c === 0) {
        bestIndices.push(a);
      }
    }
  }

  return { bestIndices, worstPayoffs };
}

// --- Minimax Regret (Section 4.6) ---

export interface MinimaxRegretResult {
  bestIndices: number[];
  maxRegrets: (ExtendedReal | null)[];
  regretMatrix: (ExtendedReal | null)[][];
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

  for (let a = 0; a < n; a++) {
    const row: (ExtendedReal | null)[] = [];
    let maxR: ExtendedReal | null = null;
    let hasUndefined = false;

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
    maxRegrets.push(hasUndefined ? null : maxR);
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

  return { bestIndices, maxRegrets, regretMatrix };
}

// --- Full Decision Result ---

export interface DecisionResult {
  probs: number[];
  euRanking: EURanking;
  lexResult: LexicographicResult | null;
  dominance: DominanceResult;
  maximin: MaximinResult;
  minimaxRegret: MinimaxRegretResult;
  headline: {
    pick: string;
    rule: string;
    reason: string;
    disagreement: boolean;
  };
}

export function computeFullDecision(state: ScenarioState): DecisionResult {
  const probs = normalizeProbabilities(state.worldviews);
  const euRanking = rankByEU(probs, state.payoffMatrix);
  const dominance = computeDominance(probs, state.payoffMatrix);
  const maximin = computeMaximin(probs, state.payoffMatrix, state.possibilityFilteredMaximin);
  const minimaxRegret = computeMinimaxRegret(probs, state.payoffMatrix);

  let lexResult: LexicographicResult | null = null;
  if (state.lexicographicTiebreak && euRanking.tiedAtInfinity) {
    lexResult = lexicographicTiebreak(euRanking.bestIndices, probs, state.payoffMatrix);
  }

  const euPick = lexResult && lexResult.rankedIndices.length > 0
    ? [lexResult.rankedIndices[0]]
    : euRanking.bestIndices;

  const picks = {
    eu: new Set(euPick),
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

  const primaryPick = euPick.length > 0 ? euPick[0] : (maximin.bestIndices[0] ?? 0);
  const pickName = state.worldviews[primaryPick]?.name ?? "Unknown";

  let reason: string;
  if (euRanking.tiedAtInfinity && !state.lexicographicTiebreak) {
    reason = "Multiple actions have infinite expected utility and are tied. Enable the lexicographic tiebreak for a finer distinction.";
  } else if (euRanking.tiedAtInfinity && lexResult) {
    reason = `Infinite EU tie broken lexicographically by probability mass on infinite-reward states (${(lexResult.infMasses[0] * 100).toFixed(1)}%).`;
  } else if (euRanking.bestIndices.length > 1) {
    reason = "Multiple actions are tied at the same expected utility.";
  } else if (euRanking.bestIndices.length === 0) {
    reason = "All actions have indeterminate expected utility.";
  } else {
    const eu = euRanking.eus[primaryPick];
    reason = `Highest expected utility: ${erToString(eu)}.`;
  }

  return {
    probs,
    euRanking,
    lexResult,
    dominance,
    maximin,
    minimaxRegret,
    headline: {
      pick: pickName,
      rule: "expected utility",
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
  optimalAction: number;
}

export interface SensitivityResult {
  parameter: string;
  parameterIndex: number;
  intervals: BreakpointInterval[];
  currentValue: number;
  breakpoints: number[];
  discontinuityAtZero: boolean;
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

  const getAffineCoeffs = (actionIdx: number): { slope: number; intercept: number } | null => {
    let slope = 0;
    let intercept = 0;
    for (let s = 0; s < nStates; s++) {
      const cell = matrix[actionIdx][s].value;
      if (cell.tag !== "finite") return null;
      if (s === varyIdx) {
        slope += cell.value;
      } else {
        const baseP = otherSum > 1e-15 ? probs[s] / otherSum : (1 / (nStates - 1));
        slope -= baseP * cell.value;
        intercept += baseP * cell.value;
      }
    }
    return { slope, intercept };
  };

  const coeffs: ({ slope: number; intercept: number } | null)[] = [];
  for (let a = 0; a < n; a++) {
    coeffs.push(getAffineCoeffs(a));
  }

  const finiteActions = coeffs.map((c, i) => c !== null ? i : -1).filter(i => i >= 0);
  if (finiteActions.length === 0) {
    return {
      parameter: worldviews[varyIdx]?.name ?? `Worldview ${varyIdx}`,
      parameterIndex: varyIdx,
      intervals: [],
      currentValue: currentP,
      breakpoints: [],
      discontinuityAtZero: false,
    };
  }

  const EPS = 1e-12;
  const rawBreakpoints = new Set<number>();
  rawBreakpoints.add(0);
  rawBreakpoints.add(1);

  for (let i = 0; i < finiteActions.length; i++) {
    for (let j = i + 1; j < finiteActions.length; j++) {
      const ci = coeffs[finiteActions[i]]!;
      const cj = coeffs[finiteActions[j]]!;
      const dSlope = ci.slope - cj.slope;
      if (Math.abs(dSlope) < EPS) continue;
      const t = (cj.intercept - ci.intercept) / dSlope;
      if (t > EPS && t < 1 - EPS) {
        rawBreakpoints.add(t);
      }
    }
  }

  const sortedBps = Array.from(rawBreakpoints).sort((a, b) => a - b);

  const evalAt = (t: number): number => {
    let bestAction = finiteActions[0];
    let bestVal = -Infinity;
    for (const a of finiteActions) {
      const c = coeffs[a]!;
      const val = c.slope * t + c.intercept;
      if (val > bestVal + EPS) {
        bestVal = val;
        bestAction = a;
      }
    }
    return bestAction;
  };

  const intervals: BreakpointInterval[] = [];
  for (let i = 0; i < sortedBps.length - 1; i++) {
    const mid = (sortedBps[i] + sortedBps[i + 1]) / 2;
    const opt = evalAt(mid);
    intervals.push({ start: sortedBps[i], end: sortedBps[i + 1], optimalAction: opt });
  }

  const mergedIntervals: BreakpointInterval[] = [];
  for (const iv of intervals) {
    if (mergedIntervals.length > 0 && mergedIntervals[mergedIntervals.length - 1].optimalAction === iv.optimalAction) {
      mergedIntervals[mergedIntervals.length - 1].end = iv.end;
    } else {
      mergedIntervals.push({ ...iv });
    }
  }

  const breakpoints = mergedIntervals.slice(1).map(iv => iv.start);

  const hasInfAtPositive = matrix.some((row) => {
    const cell = row[varyIdx]?.value;
    return cell && (cell.tag === "pos_inf" || cell.tag === "neg_inf");
  });

  return {
    parameter: worldviews[varyIdx]?.name ?? `Worldview ${varyIdx}`,
    parameterIndex: varyIdx,
    intervals: mergedIntervals,
    currentValue: currentP,
    breakpoints,
    discontinuityAtZero: hasInfAtPositive,
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

  if (p === 0) {
    return {
      parameter: `Payoff(${worldviews[actionIdx]?.name}, ${worldviews[stateIdx]?.name})`,
      parameterIndex: stateIdx,
      intervals: [{ start: rangeMin, end: rangeMax, optimalAction: 0 }],
      currentValue: matrix[actionIdx][stateIdx].value.tag === "finite" ? matrix[actionIdx][stateIdx].value.value : 0,
      breakpoints: [],
      discontinuityAtZero: false,
    };
  }

  const getBaseEU = (a: number, excludeCell: boolean): number | null => {
    let sum = 0;
    for (let s = 0; s < probs.length; s++) {
      if (excludeCell && a === actionIdx && s === stateIdx) continue;
      const cell = matrix[a][s].value;
      if (cell.tag !== "finite") return null;
      sum += probs[s] * cell.value;
    }
    return sum;
  };

  const baseEUs: (number | null)[] = [];
  for (let a = 0; a < n; a++) {
    baseEUs.push(getBaseEU(a, a === actionIdx));
  }

  if (baseEUs[actionIdx] === null) {
    return {
      parameter: `Payoff(${worldviews[actionIdx]?.name}, ${worldviews[stateIdx]?.name})`,
      parameterIndex: stateIdx,
      intervals: [],
      currentValue: 0,
      breakpoints: [],
      discontinuityAtZero: false,
    };
  }

  const EPS = 1e-12;
  const rawBps = new Set<number>();
  rawBps.add(rangeMin);
  rawBps.add(rangeMax);

  for (let a = 0; a < n; a++) {
    if (baseEUs[a] === null) continue;
    const otherEU = baseEUs[a]!;
    const baseEU = baseEUs[actionIdx]!;
    const t = (otherEU - baseEU) / p;
    if (t > rangeMin + EPS && t < rangeMax - EPS) {
      rawBps.add(t);
    }
  }

  const sortedBps = Array.from(rawBps).sort((a, b) => a - b);

  const evalAt = (t: number): number => {
    let bestAction = 0;
    let bestVal = -Infinity;
    for (let a = 0; a < n; a++) {
      if (baseEUs[a] === null) continue;
      const val = a === actionIdx
        ? baseEUs[a]! + p * t
        : baseEUs[a]!;
      if (val > bestVal + EPS) {
        bestVal = val;
        bestAction = a;
      }
    }
    return bestAction;
  };

  const intervals: BreakpointInterval[] = [];
  for (let i = 0; i < sortedBps.length - 1; i++) {
    const mid = (sortedBps[i] + sortedBps[i + 1]) / 2;
    intervals.push({ start: sortedBps[i], end: sortedBps[i + 1], optimalAction: evalAt(mid) });
  }

  const merged: BreakpointInterval[] = [];
  for (const iv of intervals) {
    if (merged.length > 0 && merged[merged.length - 1].optimalAction === iv.optimalAction) {
      merged[merged.length - 1].end = iv.end;
    } else {
      merged.push({ ...iv });
    }
  }

  const breakpoints = merged.slice(1).map(iv => iv.start);
  const cur = matrix[actionIdx][stateIdx].value;

  return {
    parameter: `Payoff(${worldviews[actionIdx]?.name}, ${worldviews[stateIdx]?.name})`,
    parameterIndex: stateIdx,
    intervals: merged,
    currentValue: cur.tag === "finite" ? cur.value : 0,
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

export function serializableToState(s: SerializableState): ScenarioState {
  return {
    worldviews: s.worldviews.map(w => ({
      id: w.id,
      name: w.name,
      excluded: w.excluded,
      rawWeight: w.rawWeight,
      template: w.template,
    })),
    payoffMatrix: s.matrix.map(row =>
      row.map(cell => ({ value: { tag: cell.tag, value: cell.value } }))
    ),
    utilityMode: s.utilityMode,
    lexicographicTiebreak: s.lexicographicTiebreak,
    possibilityFilteredMaximin: s.possibilityFilteredMaximin,
  };
}

export function encodeState(state: ScenarioState): string {
  const s = stateToSerializable(state);
  const json = JSON.stringify(s);
  // lz-string import is handled at the call site to keep this module pure
  return json;
}

export function decodeState(encoded: string): ScenarioState | null {
  try {
    const s: SerializableState = JSON.parse(encoded);
    if (!s.worldviews || !s.matrix) return null;
    return serializableToState(s);
  } catch {
    return null;
  }
}
