"use client";
import type { DecisionResult } from "@/lib/wager";

interface Props {
  result: DecisionResult;
}

export function ResultCard({ result }: Props) {
  const { headline } = result;

  return (
    <div className="hud-border bg-surface-1 p-4">
      <div className="text-[10px] font-mono text-cp-text-dim uppercase tracking-wider mb-1">
        Model Result
      </div>
      <div className="text-lg font-rajdhani font-bold glow-cyan">
        {result.noProbabilityAssigned
          ? "No probability assigned"
          : headline.pick === null
            ? (headline.euUndefined
                ? "No defined expected-utility optimum"
                : headline.euTied
                  ? `Expected utility ties: ${headline.euOptimum.length} actions`
                  : "No defined optimum")
            : `Under your assumptions and the ${headline.rule} rule, the model favors: ${headline.pick}`
        }
      </div>
      <div className="text-xs text-cp-text-dim mt-2 leading-relaxed">
        {headline.reason}
      </div>
      {headline.disagreement && (
        <div className="mt-2 flex items-center gap-2">
          <div className="cp-dot bg-cp-yellow shadow-[0_0_6px_rgba(252,238,9,0.5)]" />
          <span className="text-[10px] font-mono text-cp-yellow">
            Decision rules disagree. See the rule-by-rule breakdown below.
          </span>
        </div>
      )}
    </div>
  );
}
