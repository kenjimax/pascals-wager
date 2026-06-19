"use client";
import type { Worldview, PayoffCell, ExtendedReal } from "@/lib/wager";

interface Props {
  worldviews: Worldview[];
  matrix: PayoffCell[][];
}

function cellColor(val: ExtendedReal): string {
  if (val.tag !== "finite") return "";
  const v = val.value;
  const maxAbs = 10000;
  const clamped = Math.max(-maxAbs, Math.min(maxAbs, v));
  const norm = clamped / maxAbs;

  if (norm >= 0) {
    const intensity = Math.min(norm * 0.6, 0.6);
    return `rgba(57, 255, 20, ${intensity})`;
  } else {
    const intensity = Math.min(Math.abs(norm) * 0.6, 0.6);
    return `rgba(255, 0, 60, ${intensity})`;
  }
}

function InfBadge({ tag }: { tag: ExtendedReal["tag"] }) {
  if (tag === "pos_inf") return <span className="font-mono text-[0.625rem] text-cp-green glow-green">+INF</span>;
  if (tag === "neg_inf") return <span className="font-mono text-[0.625rem] text-cp-magenta glow-magenta">-INF</span>;
  if (tag === "indeterminate") return <span className="font-mono text-[0.625rem] text-cp-yellow glow-yellow">UNDEF</span>;
  return null;
}

export function HeatmapViz({ worldviews, matrix }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse" aria-label="Payoff matrix heatmap">
        <thead>
          <tr>
            <th className="p-2 text-left text-[0.625rem] text-cp-text-dim font-rajdhani uppercase tracking-wider border-b border-cp-cyan/10">
              Action / State
            </th>
            {worldviews.map(wv => (
              <th key={wv.id} className="p-2 text-center text-[0.625rem] text-cp-cyan font-rajdhani uppercase tracking-wider border-b border-cp-cyan/10">
                {wv.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {worldviews.map((aWv, a) => (
            <tr key={aWv.id}>
              <td className="p-2 font-rajdhani font-semibold text-[0.6875rem] border-b border-cp-cyan/5 whitespace-nowrap">
                {aWv.name}
              </td>
              {worldviews.map((sWv, s) => {
                const val = matrix[a][s].value;
                return (
                  <td
                    key={`${aWv.id}-${sWv.id}`}
                    className={`p-2 text-center border-b border-cp-cyan/5 ${a === s ? "ring-1 ring-cp-cyan/20 ring-inset" : ""}`}
                    style={val.tag === "finite" ? { backgroundColor: cellColor(val) } : {}}
                  >
                    {val.tag === "finite" ? (
                      <span className={`font-mono text-[0.6875rem] ${val.value >= 0 ? "text-cp-text" : "text-cp-text"}`}>
                        {val.value >= 0 ? "+" : ""}{val.value.toLocaleString()}
                      </span>
                    ) : (
                      <InfBadge tag={val.tag} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
