"use client";
import type { DecisionResult, Worldview } from "@/lib/wager";
import { erToString } from "@/lib/wager";

interface Props {
  result: DecisionResult;
  worldviews: Worldview[];
  lexicographicEnabled: boolean;
  onToggleLexicographic: (on: boolean) => void;
  possibilityFiltered: boolean;
  onTogglePossibilityFiltered: (on: boolean) => void;
}

function RuleCard({
  name, question, pick, why, color, dotColor,
}: {
  name: string;
  question: string;
  pick: string;
  why: string;
  color: string;
  dotColor: string;
}) {
  return (
    <div className="cp-panel">
      <div className="cp-panel-header text-[11px]">
        <span>{name}</span>
        <div className={`cp-dot ${dotColor}`} />
      </div>
      <div className="cp-panel-body">
        <div className="text-[10px] text-cp-text-dim italic mb-2">{question}</div>
        <div className={`font-rajdhani font-bold text-sm ${color}`}>{pick}</div>
        <div className="text-[10px] text-cp-text-dim mt-1 leading-relaxed">{why}</div>
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
  const getNames = (indices: number[]) => {
    if (indices.length === 0) return "None";
    if (indices.length === 1) return getName(indices[0]);
    return indices.map(getName).join(", ");
  };

  // EU
  let euPick: string;
  let euWhy: string;
  if (result.euRanking.bestIndices.length === 0) {
    euPick = "No defined optimum";
    euWhy = "All actions have indeterminate expected utility.";
  } else if (result.euRanking.tiedAtInfinity) {
    if (result.lexResult) {
      euPick = getName(result.lexResult.rankedIndices[0]);
      euWhy = `Infinite EU tie broken lexicographically. Probability mass on infinite-reward states: ${(result.lexResult.infMasses[0] * 100).toFixed(1)}%.`;
    } else {
      euPick = `Tied: ${getNames(result.euRanking.bestIndices)}`;
      euWhy = "Multiple actions have infinite expected utility. They are genuinely tied; enable lexicographic tiebreak for a finer distinction.";
    }
  } else if (result.euRanking.bestIndices.length > 1) {
    euPick = `Tied: ${getNames(result.euRanking.bestIndices)}`;
    euWhy = `These actions are tied at EU = ${erToString(result.euRanking.eus[result.euRanking.bestIndices[0]])}.`;
  } else {
    const idx = result.euRanking.bestIndices[0];
    euPick = getName(idx);
    euWhy = `EU = ${erToString(result.euRanking.eus[idx])}`;
  }

  // Dominance
  let domPick: string;
  let domWhy: string;
  if (result.dominance.dominantIndex !== null) {
    domPick = getName(result.dominance.dominantIndex);
    domWhy = "This action weakly dominates all others: at least as good in every possible state and strictly better in at least one.";
  } else if (result.dominance.undominatedIndices.length === worldviews.length) {
    domPick = "No dominant action";
    domWhy = "No action is weakly dominated. Each has at least one state where it outperforms.";
  } else {
    domPick = `Undominated: ${getNames(result.dominance.undominatedIndices)}`;
    domWhy = `${worldviews.length - result.dominance.undominatedIndices.length} action(s) dominated and removed.`;
  }

  // Maximin
  let maximinPick: string;
  let maximinWhy: string;
  if (result.maximin.bestIndices.length === 0) {
    maximinPick = "Undefined";
    maximinWhy = "Cannot determine worst case (indeterminate payoffs).";
  } else {
    maximinPick = getNames(result.maximin.bestIndices);
    const worstVal = result.maximin.worstPayoffs[result.maximin.bestIndices[0]];
    maximinWhy = `Best worst-case payoff: ${worstVal ? erToString(worstVal) : "undefined"}.`;
  }

  // Minimax regret
  let regretPick: string;
  let regretWhy: string;
  if (result.minimaxRegret.bestIndices.length === 0) {
    regretPick = "Undefined";
    regretWhy = "Cannot compute regret (indeterminate or infinite regret for all actions).";
  } else {
    regretPick = getNames(result.minimaxRegret.bestIndices);
    const maxR = result.minimaxRegret.maxRegrets[result.minimaxRegret.bestIndices[0]];
    regretWhy = `Lowest maximum regret: ${maxR ? erToString(maxR) : "undefined"}.`;
  }

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-mono text-cp-text-dim">
        These are different normative questions, not a poll. Each asks something distinct about the decision.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RuleCard
          name="Expected Utility"
          question="Which choice has the best probability-weighted average outcome?"
          pick={euPick}
          why={euWhy}
          color="text-cp-cyan"
          dotColor="bg-cp-cyan shadow-[0_0_6px_rgba(0,240,255,0.5)]"
        />
        <RuleCard
          name="Statewise Dominance"
          question="Is there a choice at least as good in every possible state and strictly better in at least one?"
          pick={domPick}
          why={domWhy}
          color="text-cp-green"
          dotColor="bg-cp-green shadow-[0_0_6px_rgba(57,255,20,0.5)]"
        />
        <RuleCard
          name="Maximin"
          question={`Which choice has the least-bad worst case (${possibilityFiltered ? "over states you consider possible" : "over all listed states"})?`}
          pick={maximinPick}
          why={maximinWhy}
          color="text-cp-yellow"
          dotColor="bg-cp-yellow shadow-[0_0_6px_rgba(252,238,9,0.5)]"
        />
        <RuleCard
          name="Minimax Regret"
          question="Which choice minimizes your largest possible regret?"
          pick={regretPick}
          why={regretWhy}
          color="text-cp-magenta"
          dotColor="bg-cp-magenta shadow-[0_0_6px_rgba(255,0,60,0.5)]"
        />
      </div>

      <div className="flex flex-wrap gap-3 text-[10px]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={lexicographicEnabled}
            onChange={e => onToggleLexicographic(e.target.checked)}
            className="accent-[#00f0ff]"
          />
          <span className="text-cp-text-dim">
            Lexicographic tiebreak
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
            Possibility-filtered maximin (only states with positive credence)
          </span>
        </label>
      </div>
    </div>
  );
}
