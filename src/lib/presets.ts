import {
  type ScenarioState, type Worldview, type PayoffCell,
  FINITE, POS_INF, NEG_INF,
} from "./wager";

function wv(id: string, name: string, weight: number, template: Worldview["template"]): Worldview {
  return { id, name, excluded: false, rawWeight: weight, template };
}

function c(v: typeof POS_INF | typeof NEG_INF | ReturnType<typeof FINITE>): PayoffCell {
  return { value: v };
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  schematic: true;
  state: ScenarioState;
}

export const PRESETS: Preset[] = [
  {
    id: "pascalian_binary",
    name: "Simplified Pascalian Binary Wager",
    description: "Generic God with infinite reward vs secular life. Under infinite reward, any positive credence makes the wager favor belief.",
    schematic: true,
    state: {
      worldviews: [
        wv("belief", "Belief in God", 10, "exclusivist"),
        wv("secular", "Secular Life", 90, "secular"),
      ],
      payoffMatrix: [
        [c(POS_INF), c(FINITE(-100))],
        [c(NEG_INF), c(FINITE(500))],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    },
  },
  {
    id: "many_gods",
    name: "Many Gods",
    description: "Two mutually exclusive deities each promising infinite reward. Shows colliding infinities, the EU tie, and partition sensitivity.",
    schematic: true,
    state: {
      worldviews: [
        wv("god_a", "Deity A (exclusivist)", 30, "exclusivist"),
        wv("god_b", "Deity B (exclusivist)", 30, "exclusivist"),
        wv("secular", "Secular Life", 40, "secular"),
      ],
      payoffMatrix: [
        [c(POS_INF), c(FINITE(-500)), c(FINITE(-100))],
        [c(FINITE(-500)), c(POS_INF), c(FINITE(-100))],
        [c(FINITE(0)), c(FINITE(0)), c(FINITE(500))],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    },
  },
  {
    id: "anti_pascal",
    name: "Anti-Pascal (The Professor's God)",
    description: "A deity who rewards sincere honest disbelief. Shows the wager can be cancelled by a symmetric counter-hypothesis.",
    schematic: true,
    state: {
      worldviews: [
        wv("orthodox", "Orthodox God", 30, "exclusivist"),
        wv("professor", "The Professor's God", 30, "professors_god"),
        wv("secular", "Secular Life", 40, "secular"),
      ],
      payoffMatrix: [
        [c(POS_INF), c(FINITE(-1000)), c(FINITE(-100))],
        [c(NEG_INF), c(FINITE(-1000)), c(FINITE(-100))],
        [c(FINITE(0)), c(POS_INF), c(FINITE(500))],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    },
  },
  {
    id: "finite_stakes",
    name: "Finite Stakes",
    description: "All payoffs finite. The conclusion becomes ordinary and sensitive; break-even intervals become informative.",
    schematic: true,
    state: {
      worldviews: [
        wv("religion_a", "Religious Life", 40, "custom"),
        wv("religion_b", "Spiritual Seeking", 20, "custom"),
        wv("secular", "Secular Life", 40, "secular"),
      ],
      payoffMatrix: [
        [c(FINITE(5000)), c(FINITE(200)), c(FINITE(-200))],
        [c(FINITE(-100)), c(FINITE(3000)), c(FINITE(-100))],
        [c(FINITE(0)), c(FINITE(100)), c(FINITE(500))],
      ],
      utilityMode: "finite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    },
  },
  {
    id: "bounded_utility",
    name: "Bounded Utility",
    description: "Large but finite caps representing a bounded-utility view. Shows how bounding defuses infinity dominance.",
    schematic: true,
    state: {
      worldviews: [
        wv("belief", "Belief in God", 20, "custom"),
        wv("secular", "Secular Life", 80, "secular"),
      ],
      payoffMatrix: [
        [c(FINITE(100000)), c(FINITE(-200))],
        [c(FINITE(-50000)), c(FINITE(500))],
      ],
      utilityMode: "bounded",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    },
  },
  {
    id: "pascal_original",
    name: "Pascal's Original 2x2",
    description: "The simplest reconstruction: one god, two actions, infinite reward for belief if God exists. In the simplified one-infinite-payoff model, any positive credence suffices.",
    schematic: true,
    state: {
      worldviews: [
        wv("god", "God exists", 50, "exclusivist"),
        wv("no_god", "God does not exist", 50, "secular"),
      ],
      payoffMatrix: [
        [c(POS_INF), c(FINITE(-50))],
        [c(FINITE(0)), c(FINITE(100))],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    },
  },
  {
    id: "diderots_imam",
    name: "Diderot's Imam",
    description: "Diderot's objection: an imam can run the same wager for Islam. Two exclusivist deities, each promising infinite reward only to its own adherents, producing a tied or undefined expected-utility verdict.",
    schematic: true,
    state: {
      worldviews: [
        wv("christian_god", "Christian God", 40, "exclusivist"),
        wv("islamic_god", "Islamic God", 40, "exclusivist"),
        wv("secular", "Secular Life", 20, "secular"),
      ],
      payoffMatrix: [
        [c(POS_INF), c(NEG_INF), c(FINITE(-100))],
        [c(NEG_INF), c(POS_INF), c(FINITE(-100))],
        [c(FINITE(0)), c(FINITE(0)), c(FINITE(500))],
      ],
      utilityMode: "infinite",
      lexicographicTiebreak: false,
      possibilityFilteredMaximin: true,
    },
  },
];

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find(p => p.id === id);
}
