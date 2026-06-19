"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ScenarioState } from "@/lib/wager";
import { FINITE, POS_INF, NEG_INF } from "@/lib/wager";

interface Props {
  onLoadFraming: (state: ScenarioState) => void;
}

function cell(v: ScenarioState["payoffMatrix"][number][number]["value"]) {
  return { value: v };
}

function wv(id: string, name: string, weight: number, template: ScenarioState["worldviews"][number]["template"]) {
  return { id, name, excluded: false, rawWeight: weight, template } as ScenarioState["worldviews"][number];
}

interface Framing {
  id: string;
  name: string;
  assumptions: string;
  description: string;
  state: ScenarioState;
}

const FRAMINGS: Framing[] = [
  {
    id: "superdominance",
    name: "Superdominance",
    assumptions: "Belief carries no finite earthly cost and no wrong-religion penalty.",
    description:
      "Wagering for God is at least as good in every state and strictly better in one. " +
      "This is decision under uncertainty with no probabilities needed. It breaks as soon " +
      "as you add even a modest finite cost to belief.",
    state: {
      worldviews: [
        wv("god_exists", "God exists", 50, "custom"),
        wv("god_absent", "God does not exist", 50, "custom"),
      ],
      payoffMatrix: [
        [cell(FINITE(1000)), cell(FINITE(100))],
        [cell(FINITE(0)), cell(FINITE(100))],
      ],
      utilityMode: "finite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    },
  },
  {
    id: "equal_chance",
    name: "Equal-chance form",
    assumptions: "p = 1/2 and infinite reward for belief if God exists.",
    description:
      "Pascal's text assigns equal probability to God's existence. With an infinite payoff " +
      "on one side, the expected utility for belief is infinite. This is a real step in the " +
      "textual development, not merely a student error, but it is not the strongest or final form.",
    state: {
      worldviews: [
        wv("god_exists", "God exists", 50, "exclusivist"),
        wv("god_absent", "God does not exist", 50, "secular"),
      ],
      payoffMatrix: [
        [cell(POS_INF), cell(FINITE(-100))],
        [cell(NEG_INF), cell(FINITE(500))],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    },
  },
  {
    id: "generalized",
    name: "Generalized expectations",
    assumptions: "Any positive credence, infinite reward, and expected-utility maximization.",
    description:
      "In the simplified one-infinite-payoff model, any positive credence, however small, " +
      "yields infinite expected utility for belief. The probability value stops mattering. " +
      "This conclusion holds only in this simplified model: once rival infinities or undefined " +
      "infinite arithmetic enter, it is no longer true.",
    state: {
      worldviews: [
        wv("god_exists", "God exists", 1, "exclusivist"),
        wv("god_absent", "God does not exist", 99, "secular"),
      ],
      payoffMatrix: [
        [cell(POS_INF), cell(FINITE(-100))],
        [cell(FINITE(0)), cell(FINITE(500))],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    },
  },
];

function FramingCard({
  framing,
  onLoad,
}: {
  framing: Framing;
  onLoad: () => void;
}) {
  return (
    <div className="cp-panel">
      <div className="cp-panel-header text-[0.6875rem]">
        <span>{framing.name}</span>
      </div>
      <div className="cp-panel-body space-y-2">
        <div className="text-[0.625rem] font-mono text-cp-yellow px-2 py-1 bg-cp-yellow/5 border border-cp-yellow/10">
          Assumes: {framing.assumptions}
        </div>
        <p className="text-[0.6875rem] text-cp-text-dim leading-relaxed">
          {framing.description}
        </p>
        <button
          onClick={onLoad}
          className="cp-btn text-[0.625rem] w-full"
        >
          Load this framing
        </button>
      </div>
    </div>
  );
}

export function ThreeFramingsPanel({ onLoadFraming }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="cp-panel">
      <button
        className="cp-panel-header w-full cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls="three-framings-content"
      >
        <span className="flex items-center gap-2">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          The argument, three framings
        </span>
      </button>
      {expanded && (
        <div className="cp-panel-body" id="three-framings-content">
          <p className="text-[0.625rem] text-cp-text-dim mb-3">
            Three reconstructions of the wager, each valid only under its stated assumptions.
            They are not a strength ranking; they form a conditional map of what follows from what.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {FRAMINGS.map((f) => (
              <FramingCard
                key={f.id}
                framing={f}
                onLoad={() => onLoadFraming(f.state)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
