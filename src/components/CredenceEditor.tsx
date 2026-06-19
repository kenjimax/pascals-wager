"use client";
import type { Worldview } from "@/lib/wager";
import { normalizeProbabilities } from "@/lib/wager";
import { RangeSlider } from "./RangeSlider";

interface Props {
  worldviews: Worldview[];
  onUpdateWeight: (idx: number, weight: number) => void;
  onToggleExclude: (idx: number) => void;
}

export function CredenceEditor({ worldviews, onUpdateWeight, onToggleExclude }: Props) {
  const probs = normalizeProbabilities(worldviews);
  const totalRaw = worldviews.reduce((s, w) => s + (w.excluded ? 0 : Math.max(0, w.rawWeight)), 0);

  return (
    <div className="space-y-3">
      {worldviews.map((wv, i) => (
        <div key={wv.id} className={`${wv.excluded ? "opacity-40" : ""}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-rajdhani font-semibold truncate max-w-[140px]">{wv.name}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[0.6875rem] text-cp-text-dim">
                w={wv.rawWeight.toFixed(1)}
              </span>
              <span className="font-mono text-[0.6875rem] text-cp-cyan">
                {(probs[i] * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {wv.excluded ? (
            <div className="flex items-center gap-2">
              <span className="text-[0.625rem] font-mono text-cp-magenta">EXCLUDED (P = 0, impossible)</span>
              <button
                onClick={() => onToggleExclude(i)}
                className="text-[0.625rem] font-mono text-cp-text-dim hover:text-cp-cyan"
              >
                [RESTORE]
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <RangeSlider
                min={0}
                max={100}
                step={0.1}
                value={wv.rawWeight}
                onChange={v => onUpdateWeight(i, v)}
                className="flex-1"
                aria-label={`Credence weight for ${wv.name}`}
                aria-valuetext={`${wv.rawWeight.toFixed(1)} weight`}
              />
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={wv.rawWeight}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v >= 0) onUpdateWeight(i, v);
                }}
                className="cp-input text-[0.6875rem] w-16 text-right"
                aria-label={`Credence weight numeric for ${wv.name}`}
              />
            </div>
          )}
        </div>
      ))}

      {/* Allocation bar */}
      <div>
        <div className="text-[0.625rem] font-mono text-cp-text-dim mb-1">
          Normalized allocation (weights rescaled to sum to 100%)
        </div>
        <div className="h-3 flex overflow-hidden border border-cp-cyan/10" role="presentation">
          {worldviews.map((wv, i) => {
            if (wv.excluded || probs[i] === 0) return null;
            const colors = [
              "bg-cp-cyan/60", "bg-cp-magenta/60", "bg-cp-yellow/60",
              "bg-cp-green/60", "bg-cp-orange/60", "bg-[#7b68ee]/60",
              "bg-cp-cyan/40", "bg-cp-magenta/40",
            ];
            return (
              <div
                key={wv.id}
                className={`${colors[i % colors.length]} transition-all duration-300`}
                style={{ width: `${probs[i] * 100}%` }}
                title={`${wv.name}: ${(probs[i] * 100).toFixed(1)}%`}
              />
            );
          })}
        </div>
      </div>

      {totalRaw === 0 && (
        <div className="text-[0.625rem] font-mono text-cp-magenta">
          No probability assigned. All weights are zero or excluded.
        </div>
      )}
    </div>
  );
}
