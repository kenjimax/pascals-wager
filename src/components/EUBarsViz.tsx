"use client";
import { useMemo } from "react";
import type { EURanking, Worldview } from "@/lib/wager";
import { erToString } from "@/lib/wager";

interface Props {
  euRanking: EURanking;
  worldviews: Worldview[];
}

export function EUBarsViz({ euRanking, worldviews }: Props) {
  const { finiteActions, extendedActions, maxAbs } = useMemo(() => {
    const fin: { idx: number; val: number }[] = [];
    const ext: { idx: number; tag: string }[] = [];

    euRanking.eus.forEach((eu, i) => {
      if (eu.tag === "finite") {
        fin.push({ idx: i, val: eu.value });
      } else {
        ext.push({ idx: i, tag: eu.tag });
      }
    });

    const absMax = fin.reduce((m, f) => Math.max(m, Math.abs(f.val)), 1);
    return { finiteActions: fin, extendedActions: ext, maxAbs: absMax };
  }, [euRanking]);

  return (
    <div className="space-y-2">
      {/* Extended value lane */}
      {extendedActions.length > 0 && (
        <div className="space-y-1 mb-3">
          <div className="text-[9px] font-mono text-cp-text-dim uppercase tracking-wider">Extended Values</div>
          {extendedActions.map(ea => (
            <div key={ea.idx} className="flex items-center gap-2">
              <span className="text-[11px] font-rajdhani font-semibold w-32 truncate">
                {worldviews[ea.idx]?.name}
              </span>
              {ea.tag === "pos_inf" && (
                <span className="cp-tag text-[9px] border-cp-green/30 bg-cp-green/10 text-cp-green">EU = +INF</span>
              )}
              {ea.tag === "neg_inf" && (
                <span className="cp-tag text-[9px] border-cp-magenta/30 bg-cp-magenta/10 text-cp-magenta">EU = -INF</span>
              )}
              {ea.tag === "indeterminate" && (
                <span className="cp-tag text-[9px] border-cp-yellow/30 bg-cp-yellow/10 text-cp-yellow">EU = UNDEF</span>
              )}
            </div>
          ))}
          <div className="border-b border-cp-cyan/10" />
        </div>
      )}

      {/* Finite bars */}
      {finiteActions.length > 0 && (
        <div className="space-y-2">
          {finiteActions
            .sort((a, b) => b.val - a.val)
            .map((fa, i) => {
              const pct = (fa.val / maxAbs) * 50;
              const isPositive = fa.val >= 0;
              const isBest = i === 0;

              return (
                <div key={fa.idx} className="flex items-center gap-2">
                  <span className="text-[11px] font-rajdhani font-semibold w-32 truncate">
                    {worldviews[fa.idx]?.name}
                  </span>
                  <div className="flex-1 h-5 relative">
                    {/* Zero line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cp-text-dim/20" />
                    {/* Bar */}
                    <div
                      className={`absolute top-0.5 h-4 transition-all duration-300 ${
                        isPositive
                          ? isBest ? "bg-cp-green/70 shadow-[0_0_8px_rgba(57,255,20,0.3)]" : "bg-cp-cyan/40"
                          : "bg-cp-magenta/40"
                      }`}
                      style={isPositive
                        ? { left: "50%", width: `${Math.abs(pct)}%` }
                        : { right: "50%", width: `${Math.abs(pct)}%` }
                      }
                    />
                  </div>
                  <span className={`font-mono text-[11px] w-20 text-right ${
                    isPositive ? (isBest ? "text-cp-green glow-green" : "text-cp-cyan") : "text-cp-magenta"
                  }`}>
                    {erToString(euRanking.eus[fa.idx])}
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
