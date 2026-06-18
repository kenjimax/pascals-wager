"use client";
import { PRESETS } from "@/lib/presets";

interface Props {
  onSelect: (presetId: string) => void;
}

export function PresetSelector({ onSelect }: Props) {
  return (
    <select
      onChange={e => { if (e.target.value) onSelect(e.target.value); e.target.value = ""; }}
      defaultValue=""
      className="cp-input text-xs"
      aria-label="Load scenario preset"
    >
      <option value="" disabled>Load Preset...</option>
      {PRESETS.map(p => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
