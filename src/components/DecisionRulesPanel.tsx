"use client";
import type { DecisionResult, Worldview } from "@/lib/wager";
import { erToString } from "@/lib/wager";
import { worldviewColor } from "@/lib/colors";
import { Term } from "./Term";

interface Pick {
  name: string;
  color: string;
}

interface Props {
  result: DecisionResult;
  worldviews: Worldview[];
  lexicographicEnabled: boolean;
  onToggleLexicographic: (on: boolean) => void;
  possibilityFiltered: boolean;
  onTogglePossibilityFiltered: (on: boolean) => void;
}

// The verdict is shown by coloring each chosen worldview with its own color
// from the shared palette (the same colors the probability simplex uses), so a
// color always identifies a worldview, never the rule. A prefix (for example
// "Undominated:") and a fallback label (for "no defined optimum") are dim, since
// they are not a worldview.
function RuleCard({
  name, termKey, question, whenNote, picks, pickPrefix, pickFallback, why, tied,
}: {
  name: string;
  termKey?: string;
  question: string;
  whenNote: string;
  picks: Pick[];
  pickPrefix?: string;
  pickFallback?: string;
  why: string;
  tied?: boolean;
}) {
  return (
    <div className="cp-panel">
      <div className="cp-panel-header text-[0.6875rem]">
        <span>{termKey ? <Term termKey={termKey}>{name}</Term> : name}</span>
      </div>
      <div className="cp-panel-body">
        <div className="text-[0.625rem] text-cp-text-dim italic mb-2">{question}</div>
        <div className="font-rajdhani font-bold text-sm">
          {pickPrefix && <span className="text-cp-text-dim font-normal mr-1">{pickPrefix}</span>}
          {picks.length > 0 ? (
            picks.map((p, i) => (
              <span key={i}>
                <span style={{ color: p.color }}>{p.name}</span>
                {i < picks.length - 1 && <span className="text-cp-text-dim">, </span>}
              </span>
            ))
          ) : (
            <span className="text-cp-text-dim">{pickFallback}</span>
          )}
        </div>
        {tied && (
          <div className="text-[0.5625rem] text-cp-text-dim mt-1 font-mono">
            These actions are tied under this rule; it does not discriminate between them, and you would pick exactly one.
          </div>
        )}
        <div className="text-[0.625rem] text-cp-text-dim mt-1 leading-relaxed">{why}</div>
        <div className="text-[0.5625rem] text-cp-yellow/70 mt-2 font-mono leading-relaxed">
          {whenNote}
        </div>
      </div>
    </div>
  );
}

export function DecisionRulesPanel({
  result, worldviews,
  lexicographicEnabled, onToggleLexicographic,
  possibilityFiltered, onTogglePossibilityFiltered,
}: Props) {
  const getName = (idx: number) => worldviews[idx]?.name ?? "?";
  const picksOf = (indices: number[]): Pick[] =>
    indices.map(i => ({ name: getName(i), color: worldviewColor(i) }));

  // EU
  let euPicks: Pick[];
  let euFallback: string | undefined;
  let euWhy: string;
  if (result.euRanking.bestIndices.length === 0) {
    euPicks = [];
    euFallback = "No defined optimum";
    euWhy = "All actions have indeterminate expected utility.";
  } else if (result.euRanking.tiedAtInfinity) {
    if (result.lexResult && result.lexResult.topTieSet.length === 1) {
      euPicks = picksOf([result.lexResult.rankedIndices[0]]);
      euWhy = `Infinite EU tie broken lexicographically. Probability mass on infinite-reward states: ${(result.lexResult.infMasses[0] * 100).toFixed(1)}%.`;
    } else if (result.lexResult) {
      euPicks = picksOf(result.lexResult.topTieSet);
      euWhy = "Even the lexicographic tiebreak cannot separate these: equal infinite-reward mass and finite remainder.";
    } else {
      euPicks = picksOf(result.euRanking.bestIndices);
      euWhy = "Multiple actions have infinite expected utility. They are genuinely tied; enable lexicographic tiebreak for a finer distinction.";
    }
  } else if (result.euRanking.bestIndices.length > 1) {
    euPicks = picksOf(result.euRanking.bestIndices);
    euWhy = `These actions are tied at EU = ${erToString(result.euRanking.eus[result.euRanking.bestIndices[0]])}.`;
  } else {
    const idx = result.euRanking.bestIndices[0];
    euPicks = picksOf([idx]);
    euWhy = `EU = ${erToString(result.euRanking.eus[idx])}`;
  }

  // Dominance
  let domPicks: Pick[];
  let domPrefix: string | undefined;
  let domFallback: string | undefined;
  let domWhy: string;
  if (result.dominance.dominantIndex !== null) {
    domPicks = picksOf([result.dominance.dominantIndex]);
    domWhy = "This action weakly dominates all others: at least as good in every possible state and strictly better in at least one.";
  } else if (result.dominance.undominatedIndices.length === worldviews.length) {
    domPicks = [];
    domFallback = "No dominant action";
    domWhy = "No action is weakly dominated. Each has at least one state where it outperforms.";
  } else {
    domPicks = picksOf(result.dominance.undominatedIndices);
    domPrefix = "Undominated:";
    domWhy = `${worldviews.length - result.dominance.undominatedIndices.length} action(s) dominated and removed.`;
  }

  // Maximin
  let maximinPicks: Pick[];
  let maximinFallback: string | undefined;
  let maximinWhy: string;
  if (result.maximin.bestIndices.length === 0) {
    maximinPicks = [];
    maximinFallback = "Undefined";
    maximinWhy = "Cannot determine worst case (indeterminate payoffs).";
  } else {
    maximinPicks = picksOf(result.maximin.bestIndices);
    const worstVal = result.maximin.worstPayoffs[result.maximin.bestIndices[0]];
    maximinWhy = `Best worst-case payoff: ${worstVal ? erToString(worstVal) : "undefined"}.`;
  }

  // Minimax regret
  let regretPicks: Pick[];
  let regretFallback: string | undefined;
  let regretWhy: string;
  if (result.minimaxRegret.bestIndices.length === 0) {
    regretPicks = [];
    regretFallback = "Undefined";
    regretWhy = "Cannot compute regret (indeterminate or infinite regret for all actions).";
  } else {
    regretPicks = picksOf(result.minimaxRegret.bestIndices);
    const maxR = result.minimaxRegret.maxRegrets[result.minimaxRegret.bestIndices[0]];
    regretWhy = `Lowest maximum regret: ${maxR ? erToString(maxR) : "undefined"}.`;
  }

  // Expected utility needs a probability distribution. When none is assigned
  // (every credence zero or excluded) the EU verdict is not a real decision, so
  // do not claim the actions are "tied". Maximin and minimax regret are
  // probability-free and report an empty best set in that state on their own.
  const euTied =
    result.noProbabilityAssigned || result.euRanking.bestIndices.length === 0 ? false :
    result.euRanking.tiedAtInfinity
      ? (result.lexResult ? result.lexResult.topTieSet.length > 1 : true)
      : result.euRanking.bestIndices.length > 1;
  const maximinTied = result.maximin.bestIndices.length > 1;
  const regretTied = result.minimaxRegret.bestIndices.length > 1;

  return (
    <div className="space-y-3">
      <div className="text-[0.625rem] font-mono text-cp-text-dim">
        These are different normative questions, not a poll. Each asks something distinct about the decision.
        Finite utilities are defined only up to positive affine rescaling.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RuleCard
          name="Expected Utility"
          termKey="expected_utility"
          question="Which choice has the best probability-weighted average outcome?"
          whenNote="Use when you commit to probabilities and accept expected-utility maximization as the decision criterion."
          picks={euPicks}
          pickFallback={euFallback}
          why={euWhy}
          tied={euTied}
        />
        <RuleCard
          name="Statewise Dominance"
          termKey="statewise_dominance"
          question="Is there a choice at least as good in every possible state and strictly better in at least one?"
          whenNote="Use when one option is never worse. Requires no probabilities or utility comparisons."
          picks={domPicks}
          pickPrefix={domPrefix}
          pickFallback={domFallback}
          why={domWhy}
        />
        <RuleCard
          name="Maximin"
          termKey="maximin"
          question={`Which choice has the least-bad worst case (${possibilityFiltered ? "over states you consider possible" : "over all listed states"})?`}
          whenNote="Encodes a cautious attitude: prioritize avoiding the worst outcome. Does not require probabilities but does encode a distinct value judgment about caution."
          picks={maximinPicks}
          pickFallback={maximinFallback}
          why={maximinWhy}
          tied={maximinTied}
        />
        <RuleCard
          name="Minimax Regret"
          termKey="minimax_regret"
          question="Which choice minimizes your largest possible regret?"
          whenNote="Encodes a distinct attitude toward regret: minimize how much you could wish you had chosen differently. Does not require probabilities."
          picks={regretPicks}
          pickFallback={regretFallback}
          why={regretWhy}
          tied={regretTied}
        />
      </div>

      <div className="flex flex-wrap gap-3 text-[0.625rem]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={lexicographicEnabled}
            onChange={e => onToggleLexicographic(e.target.checked)}
            className="accent-[#00f0ff]"
          />
          <span className="text-cp-text-dim">
            <Term termKey="lexicographic_tiebreak">Lexicographic tiebreak</Term>
            <span className="text-cp-yellow ml-1">(optional convention, not standard EU)</span>
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={possibilityFiltered}
            onChange={e => onTogglePossibilityFiltered(e.target.checked)}
            className="accent-[#00f0ff]"
          />
          <span className="text-cp-text-dim">
            <Term termKey="possibility_filtered">Possibility-filtered</Term> maximin (ignore worlds you have ruled out)
          </span>
        </label>
      </div>
    </div>
  );
}
