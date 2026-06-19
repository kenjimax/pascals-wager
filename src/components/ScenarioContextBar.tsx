"use client";
import { PRESETS } from "@/lib/presets";
import type { UtilityMode } from "@/lib/wager";

// What each utility mode does to the arithmetic, so switching modes explains
// itself instead of silently changing the verdict. Each line states the rule
// the mode applies and why the verdict can move.
const MODE_NOTES: Record<UtilityMode, { label: string; note: string }> = {
  finite: {
    label: "Finite",
    note: "Every payoff is an ordinary finite number. The verdict is a plain probability-weighted average, with no infinities in play.",
  },
  infinite: {
    label: "Infinite",
    note: "Salvation and damnation are treated as positive and negative infinity. One infinite reward swamps every finite payoff, so any positive credence in that state decides the wager, and two rival infinities collide into a tie.",
  },
  bounded: {
    label: "Bounded",
    note: "Payoffs are capped at a finite ceiling, so no single outcome can swamp the rest. The verdict tracks ordinary expected utility under that bound.",
  },
  lexicographic: {
    label: "Lexicographic",
    note: "Outcomes sit in ranked tiers. A higher tier outweighs any amount of a lower one, and ties inside a tier fall through to the next tier to break them.",
  },
  surreal: {
    label: "Surreal (non-absorptive)",
    note: "Infinities are surreal numbers that do not absorb each other: omega minus omega is zero and half of omega is less than omega. Mixed strategies stop dominating, and rival infinite rewards rank by credence rather than tying.",
  },
  relative: {
    label: "Relative (ratio)",
    note: "Payoffs are measured as ratios against the best outcome, after Bartha. Salvation is one and everything else scales toward zero, so the verdict depends on credence instead of being fixed by an absorbing infinity.",
  },
};

interface Props {
  activePresetId: string | null;
  utilityMode: UtilityMode;
}

export function ScenarioContextBar({ activePresetId, utilityMode }: Props) {
  const preset = activePresetId ? PRESETS.find(p => p.id === activePresetId) : null;
  const mode = MODE_NOTES[utilityMode];

  return (
    <div className="mt-2 flex flex-col gap-1.5 text-[0.6875rem] font-mono leading-snug">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-cp-text-dim uppercase tracking-wider">Scenario</span>
        <span className="text-cp-cyan font-semibold">{preset ? preset.name : "Custom scenario"}</span>
        {preset && <span className="text-cp-text-dim">{preset.description}</span>}
        {!preset && (
          <span className="text-cp-text-dim">Built by hand or loaded from a shared link.</span>
        )}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-cp-text-dim uppercase tracking-wider">Rule set</span>
        <span className="text-cp-magenta font-semibold">{mode.label}</span>
        <span className="text-cp-text-dim">{mode.note}</span>
      </div>
    </div>
  );
}
