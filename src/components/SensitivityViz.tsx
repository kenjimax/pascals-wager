"use client";
import { useMemo } from "react";
import type { Worldview, PayoffCell } from "@/lib/wager";
import { computeCredenceSensitivity, computePayoffSensitivity, type SensitivityResult } from "@/lib/wager";
import { Term } from "./Term";

interface Props {
  worldviews: Worldview[];
  probs: number[];
  matrix: PayoffCell[][];
  tab: "credence" | "payoff";
}

const ACTION_COLORS = [
  { bg: "rgba(0, 240, 255, 0.5)", label: "text-cp-cyan" },
  { bg: "rgba(255, 0, 60, 0.5)", label: "text-cp-magenta" },
  { bg: "rgba(252, 238, 9, 0.5)", label: "text-cp-yellow" },
  { bg: "rgba(57, 255, 20, 0.5)", label: "text-cp-green" },
  { bg: "rgba(255, 107, 53, 0.5)", label: "text-cp-orange" },
  { bg: "rgba(123, 104, 238, 0.5)", label: "text-[#7b68ee]" },
];

function SensBar({ result, worldviews }: { result: SensitivityResult; worldviews: Worldview[] }) {
  if (result.intervals.length === 0) {
    return (
      <div className="text-[0.625rem] text-cp-text-dim font-mono">
        No finite sensitivity data (infinite payoffs in this dimension).
      </div>
    );
  }

  const range = result.intervals[result.intervals.length - 1].end - result.intervals[0].start;
  if (range === 0) return null;

  return (
    <div className="space-y-1">
      <div className="text-[0.6875rem] font-rajdhani font-semibold">{result.parameter}</div>

      <div className="relative h-6 border border-cp-cyan/10 overflow-hidden">
        {result.intervals.map((iv, i) => {
          const left = ((iv.start - result.intervals[0].start) / range) * 100;
          const width = ((iv.end - iv.start) / range) * 100;
          const c = ACTION_COLORS[iv.optimalAction % ACTION_COLORS.length];
          return (
            <div
              key={i}
              className="absolute top-0 bottom-0"
              style={{ left: `${left}%`, width: `${width}%`, backgroundColor: c.bg }}
              title={`${worldviews[iv.optimalAction]?.name}: ${(iv.start * 100).toFixed(1)}% - ${(iv.end * 100).toFixed(1)}%`}
            />
          );
        })}

        {/* Current point marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
          style={{ left: `${((result.currentValue - result.intervals[0].start) / range) * 100}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[0.5625rem]">
        {result.breakpoints.length > 0 && (
          <span className="font-mono text-cp-text-dim/80">
            <Term termKey="break_even_interval">break-even</Term>:
          </span>
        )}
        {result.breakpoints.map((bp, i) => (
          <span key={i} className="font-mono text-cp-text-dim">
            switch at {(bp * 100).toFixed(1)}%
          </span>
        ))}
        {result.discontinuityAtZero && (
          <span className="font-mono text-cp-yellow">
            Discontinuity at 0 (excluding vs. any positive credence jumps EU)
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[0.5625rem]">
        {Array.from(new Set(result.intervals.map(iv => iv.optimalAction))).map(idx => {
          const c = ACTION_COLORS[idx % ACTION_COLORS.length];
          return (
            <span key={idx} className={`${c.label}`}>
              {worldviews[idx]?.name}
            </span>
          );
        })}
        <span className="text-white">| = current</span>
      </div>
    </div>
  );
}

export function SensitivityViz({ worldviews, probs, matrix, tab }: Props) {
  const credenceSensitivities = useMemo(() => {
    if (tab !== "credence") return [];
    return worldviews.map((_, i) =>
      computeCredenceSensitivity(i, probs, matrix, worldviews)
    );
  }, [worldviews, probs, matrix, tab]);

  const payoffSensitivities = useMemo(() => {
    if (tab !== "payoff") return [];
    const results: SensitivityResult[] = [];
    for (let a = 0; a < worldviews.length; a++) {
      for (let s = 0; s < worldviews.length; s++) {
        if (matrix[a][s].value.tag !== "finite") continue;
        results.push(
          computePayoffSensitivity(a, s, probs, matrix, worldviews, -10000, 10000)
        );
      }
    }
    return results;
  }, [worldviews, probs, matrix, tab]);

  const sensitivities = tab === "credence" ? credenceSensitivities : payoffSensitivities;

  if (sensitivities.length === 0) {
    return <div className="text-xs text-cp-text-dim">No sensitivity data available.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-[0.625rem] font-mono text-cp-text-dim">
        {tab === "credence"
          ? "Each bar shows which action is EU-optimal as that worldview's probability varies (holding other odds fixed)."
          : "Each bar shows which action is EU-optimal as a payoff value varies."
        }
        {" "}One-at-a-time sensitivity; joint perturbations can differ.
      </div>
      {sensitivities.map((s, i) => (
        <SensBar key={`${s.parameter}-${i}`} result={s} worldviews={worldviews} />
      ))}
    </div>
  );
}
