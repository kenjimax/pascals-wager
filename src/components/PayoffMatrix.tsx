"use client";
import { useState } from "react";
import type { Worldview, PayoffCell, ExtendedReal } from "@/lib/wager";
import { FINITE, POS_INF, NEG_INF, INDETERMINATE, erToString } from "@/lib/wager";

interface Props {
  worldviews: Worldview[];
  matrix: PayoffCell[][];
  onUpdateCell: (row: number, col: number, value: ExtendedReal) => void;
}

function InfinityBadge({ tag }: { tag: ExtendedReal["tag"] }) {
  if (tag === "pos_inf") {
    return <span className="cp-tag text-[9px] cp-tag border-cp-green/30 bg-cp-green/10 text-cp-green" aria-label="positive infinity">+INF</span>;
  }
  if (tag === "neg_inf") {
    return <span className="cp-tag text-[9px] border-cp-magenta/30 bg-cp-magenta/10 text-cp-magenta" aria-label="negative infinity">-INF</span>;
  }
  if (tag === "indeterminate") {
    return <span className="cp-tag text-[9px] border-cp-yellow/30 bg-cp-yellow/10 text-cp-yellow" aria-label="indeterminate">UNDEF</span>;
  }
  return null;
}

function CellEditor({
  value, onChange,
}: {
  value: ExtendedReal;
  onChange: (v: ExtendedReal) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const startEdit = () => {
    if (value.tag === "finite") {
      setEditValue(String(value.value));
    } else {
      setEditValue("");
    }
    setEditing(true);
  };

  const commitEdit = () => {
    setEditing(false);
    const trimmed = editValue.trim().toLowerCase();
    if (trimmed === "+inf" || trimmed === "inf") {
      onChange(POS_INF);
    } else if (trimmed === "-inf") {
      onChange(NEG_INF);
    } else if (trimmed === "undef" || trimmed === "indeterminate") {
      onChange(INDETERMINATE);
    } else {
      const num = parseFloat(trimmed);
      if (!isNaN(num)) onChange(FINITE(num));
    }
  };

  if (editing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={e => {
          if (e.key === "Enter") commitEdit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="cp-input text-[11px] w-20 text-center"
        autoFocus
        aria-label="Edit payoff value"
      />
    );
  }

  if (value.tag !== "finite") {
    return (
      <button onClick={startEdit} className="cursor-pointer" aria-label={`Edit payoff: ${erToString(value)}`}>
        <InfinityBadge tag={value.tag} />
      </button>
    );
  }

  return (
    <button
      onClick={startEdit}
      className={`font-mono text-[11px] cursor-pointer hover:text-cp-cyan transition-colors ${
        value.value >= 0 ? "text-cp-green" : "text-cp-magenta"
      }`}
      aria-label={`Edit payoff: ${value.value}`}
    >
      {value.value >= 0 ? "+" : ""}{value.value.toLocaleString()}
    </button>
  );
}

function InfinityToggle({
  value, onChange
}: {
  value: ExtendedReal;
  onChange: (v: ExtendedReal) => void;
}) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onChange(POS_INF)}
        className={`text-[8px] font-mono px-1 border transition-colors ${
          value.tag === "pos_inf" ? "border-cp-green/50 text-cp-green bg-cp-green/10" : "border-cp-border text-cp-text-dim hover:text-cp-green"
        }`}
        aria-label="Set to positive infinity"
      >
        +INF
      </button>
      <button
        onClick={() => onChange(NEG_INF)}
        className={`text-[8px] font-mono px-1 border transition-colors ${
          value.tag === "neg_inf" ? "border-cp-magenta/50 text-cp-magenta bg-cp-magenta/10" : "border-cp-border text-cp-text-dim hover:text-cp-magenta"
        }`}
        aria-label="Set to negative infinity"
      >
        -INF
      </button>
      <button
        onClick={() => onChange(FINITE(value.tag === "finite" ? value.value : 0))}
        className={`text-[8px] font-mono px-1 border transition-colors ${
          value.tag === "finite" ? "border-cp-cyan/50 text-cp-cyan bg-cp-cyan/10" : "border-cp-border text-cp-text-dim hover:text-cp-cyan"
        }`}
        aria-label="Set to finite value"
      >
        FIN
      </button>
    </div>
  );
}

export function PayoffMatrix({ worldviews, matrix, onUpdateCell }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse" role="grid" aria-label="Payoff matrix">
        <thead>
          <tr>
            <th className="text-left p-2 text-cp-text-dim font-rajdhani uppercase tracking-wider text-[10px] border-b border-cp-cyan/10">
              Action / State
            </th>
            {worldviews.map(wv => (
              <th
                key={`h-${wv.id}`}
                className="p-2 text-center text-cp-cyan font-rajdhani uppercase tracking-wider text-[10px] border-b border-cp-cyan/10"
              >
                {wv.name}
                <br />
                <span className="text-cp-text-dim normal-case tracking-normal">is true</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {worldviews.map((actionWv, a) => (
            <tr key={`r-${actionWv.id}`} className="hover:bg-cp-cyan/[0.02]">
              <td className="p-2 font-rajdhani font-semibold text-[11px] border-b border-cp-cyan/5 whitespace-nowrap">
                Live as {actionWv.name}
              </td>
              {worldviews.map((stateWv, s) => (
                <td
                  key={`c-${actionWv.id}-${stateWv.id}`}
                  className={`p-2 text-center border-b border-cp-cyan/5 ${a === s ? "bg-cp-cyan/[0.03]" : ""}`}
                  role="gridcell"
                >
                  <div className="flex flex-col items-center gap-1">
                    <CellEditor
                      value={matrix[a][s].value}
                      onChange={v => onUpdateCell(a, s, v)}
                    />
                    <InfinityToggle
                      value={matrix[a][s].value}
                      onChange={v => onUpdateCell(a, s, v)}
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
