export interface GlossaryEntry {
  term: string;
  gloss: string;
  inline: boolean;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  credence: {
    term: "Credence",
    gloss:
      "Your subjective probability that a worldview is true, expressed as a weight that gets normalized to a probability between 0 and 1.",
    inline: true,
  },
  expected_utility: {
    term: "Expected utility",
    gloss:
      "The probability-weighted average payoff of an action across all possible states of the world.",
    inline: true,
  },
  statewise_dominance: {
    term: "Statewise dominance",
    gloss:
      "An action statewise dominates another if it is at least as good in every possible state and strictly better in at least one.",
    inline: true,
  },
  maximin: {
    term: "Maximin",
    gloss:
      "A decision rule that ranks actions by their worst-case payoff, choosing the action whose worst outcome is least bad.",
    inline: true,
  },
  minimax_regret: {
    term: "Minimax regret",
    gloss:
      "A decision rule that minimizes your largest possible regret, where regret is the difference between the best available payoff in each state and what your action actually gets.",
    inline: true,
  },
  lexicographic_tiebreak: {
    term: "Lexicographic tiebreak",
    gloss:
      "When multiple actions tie at infinite expected utility, this convention ranks them first by probability mass on infinite-reward states, then by finite remainder.",
    inline: true,
  },
  possibility_filtered: {
    term: "Possibility-filtered",
    gloss:
      "A variant that ignores states you have ruled out (assigned zero credence) when evaluating worst cases.",
    inline: true,
  },
  break_even_interval: {
    term: "Break-even interval",
    gloss:
      "The range of credence values over which a given action remains optimal under expected utility.",
    inline: true,
  },
  affine_rescaling: {
    term: "Affine rescaling",
    gloss:
      "Finite utilities are meaningful only up to positive affine rescaling: multiplying all payoffs by a positive constant and adding any constant does not change the decision.",
    inline: false,
  },
  partition_sensitivity: {
    term: "Partition sensitivity",
    gloss:
      "The result can change depending on how you carve the space of possibilities into worldviews. How fine or coarse the partition is matters.",
    inline: false,
  },
  extended_reals: {
    term: "Extended reals",
    gloss:
      "The real number line augmented with positive and negative infinity, used here to represent infinite rewards or penalties.",
    inline: false,
  },
  exclusivist: {
    term: "Exclusivist",
    gloss:
      "A theology where only adherents of that specific religion receive the infinite reward; all others face a penalty.",
    inline: false,
  },
  universalist: {
    term: "Universalist",
    gloss:
      "A theology where everyone eventually receives salvation, though sincere seekers may receive a greater reward.",
    inline: false,
  },
  professors_god: {
    term: "The professor's god",
    gloss:
      "A hypothetical deity who rewards honest disbelief and punishes faith adopted for strategic reasons, introduced by Mackie to challenge the wager.",
    inline: false,
  },
};

export function getGlossaryEntry(key: string): GlossaryEntry | undefined {
  return GLOSSARY[key];
}

export function getAllGlossaryEntries(): GlossaryEntry[] {
  return Object.values(GLOSSARY);
}

export function getInlineGlossaryKeys(): string[] {
  return Object.entries(GLOSSARY)
    .filter(([, entry]) => entry.inline)
    .map(([key]) => key);
}
