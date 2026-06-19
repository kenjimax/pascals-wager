"use client";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import type { Worldview, TheologyTemplate } from "@/lib/wager";

const TEMPLATE_OPTIONS: { value: TheologyTemplate; label: string; desc: string }[] = [
  { value: "exclusivist", label: "Exclusivist", desc: "Rewards only its own sincere followers" },
  { value: "universalist", label: "Universalist", desc: "Rewards sincere seekers of any path" },
  { value: "annihilationist", label: "Annihilationist", desc: "No eternal penalty; outsiders simply cease" },
  { value: "professors_god", label: "Professor's God", desc: "Rewards honest disbelief" },
  { value: "secular", label: "Secular", desc: "No supernatural reward or penalty" },
  { value: "custom", label: "Custom", desc: "Set your own payoffs" },
];

interface Props {
  worldviews: Worldview[];
  onAdd: (name: string, template: TheologyTemplate) => void;
  onRemove: (idx: number) => void;
  onToggleExclude: (idx: number) => void;
}

export function WorldviewCards({ worldviews, onAdd, onRemove, onToggleExclude }: Props) {
  const [newName, setNewName] = useState("");
  const [newTemplate, setNewTemplate] = useState<TheologyTemplate>("custom");

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAdd(name, newTemplate);
    setNewName("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {worldviews.map((wv, i) => (
          <div
            key={wv.id}
            className={`
              relative group px-3 py-2 border transition-colors
              ${wv.excluded
                ? "border-cp-text-dim/20 bg-surface-2/50 opacity-60"
                : "border-cp-cyan/20 bg-surface-2"}
            `}
          >
            <div className="flex items-center gap-2">
              <div
                className={`cp-dot ${wv.excluded ? "bg-[#3a3a5a]" : "bg-cp-cyan shadow-[0_0_6px_rgba(0,240,255,0.5)]"}`}
              />
              <span className="font-rajdhani font-semibold text-sm">{wv.name}</span>
              <span className="cp-tag text-[9px] ml-1">
                {TEMPLATE_OPTIONS.find(t => t.value === wv.template)?.label ?? wv.template}
              </span>
            </div>
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => onToggleExclude(i)}
                className="text-[10px] font-mono text-cp-text-dim hover:text-cp-cyan transition-colors"
                title={wv.excluded
                  ? `Restore credence for ${wv.name}`
                  : `Set credence to zero for ${wv.name}. Excluding assigns exactly zero probability, which differs from a tiny epsilon: at zero, infinite payoffs contribute nothing to expected utility.`}
                aria-label={wv.excluded
                  ? `Restore credence for ${wv.name}`
                  : `Set credence to zero for ${wv.name}`}
              >
                {wv.excluded ? "[INCLUDE]" : "[EXCLUDE]"}
              </button>
              {worldviews.length > 2 && (
                <button
                  onClick={() => onRemove(i)}
                  className="text-[10px] font-mono text-cp-text-dim hover:text-cp-magenta transition-colors"
                  aria-label={`Remove ${wv.name}`}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Add worldview..."
          className="cp-input text-xs w-40"
          aria-label="New worldview name"
        />
        <select
          value={newTemplate}
          onChange={e => setNewTemplate(e.target.value as TheologyTemplate)}
          className="cp-input text-xs"
          aria-label="Theology template"
        >
          {TEMPLATE_OPTIONS.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button onClick={handleAdd} className="cp-btn text-xs flex items-center gap-1" aria-label="Add worldview">
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}
