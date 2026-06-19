# Pascal's Wager: v5 research-integration spec

Grounded in three primary sources, each read in full:
- Paul Bartha, "Taking Stock of Infinite Value: Pascal's Wager and Relative
  Utilities," Synthese 154 (2007): 5-52.
- Elizabeth Jackson and Andrew Rogers, "Salvaging Pascal's Wager," Philosophia
  Christi 21 (2019): 59-84.
- Eddy Keming Chen and Daniel Rubio, "Surreal Decisions," Philosophy and
  Phenomenological Research 100 (2020): 54-74.
- Framing/critique: Alan Hajek, "Waging War on Pascal's Wager," Phil Review 112
  (2003). Many-gods decision-matrix response: Lawrence Pasternack, "The Many Gods
  Objection to Pascal's Wager: A Decision Theoretic Response," Philo 15 (2012).

Do not attribute anything to "Daniel Eden": no such paper exists (that name is a
design engineer). Daniel Eaton's actual Wager paper is about pragmatic
encroachment, a different topic; do not cite it as a many-gods source.

## The convergent thesis (the centerpiece to teach)

Standard extended-real arithmetic makes +inf absorptive: inf times any positive
probability is inf, and inf minus inf is undefined. That is exactly why the tool
currently shows a mixed-strategy tie and a many-gods indeterminacy. Three serious
repair strategies in the literature replace absorptive infinities with comparable
finite ratios or with non-absorptive infinite numbers:
- Bartha: relative utilities (ratios against a base-point).
- Jackson and Rogers: ratios in the limit over growing finite durations.
- Chen and Rubio: surreal numbers (and Herzberg: hyperreals), where 0.5 times
  omega is strictly less than omega.
All three converge on the same two consequences and one honest punchline:
1. mixed strategies become strictly dominated (no more "flip a coin" tie),
2. many-gods resolves to wagering for the highest-credence god,
3. the Wager's verdict becomes credence-dependent. It stops being the
   evidence-independent argument Pascal wanted. None of the three rescues theism:
   in Jackson and Rogers' own worked example the winner is Islam, and atheism wins
   on short horizons.

## Build item 0 (ship, headline): surreal / non-absorptive infinity mode

Restricted to the finite-order infinities the Wager needs, surreal numbers are
tractable: every payoff is a finite-degree polynomial in omega, represented as a
short real coefficient vector [c0, c1, c2, ...] meaning c0 + c1*omega +
c2*omega^2 + .... Salvation is omega (or k*omega), damnation is -omega, a finite
reward is c0, and a strictly larger infinity is omega^2.

- Arithmetic: add is component-wise; multiply by a probability scales every
  coefficient; compare is lexicographic from the highest-degree nonzero
  coefficient down. This is exact and total.
- Wire it as a new utility mode. In this mode infinite payoffs become omega
  terms rather than absorptive tags, so: 0.5*omega is strictly less than omega
  (mixed strategies lose), omega - omega is 0 (no indeterminacy), and many-gods
  ranks by credence. All four decision rules operate through the same primitives.
- Interactive swamping dilemma: let an infinite reward optionally be set to a
  higher order (omega vs omega^2) so the user can watch a larger infinity make a
  smaller one "a pure nothing." This makes Hajek's swamping dilemma visible
  rather than only described.
- Scope note: the fine break-even / sensitivity sweep may compare on the
  dominant omega-degree rather than producing finite intervals; that is
  acceptable, note it in the panel. Do not regress the other modes.
- Pure engine, unit-tested: 0.5*omega < omega, omega - omega = 0, many-gods
  ranks by credence, omega^2 swamps omega, scale behavior. Attribute to Chen and
  Rubio (2020), "Surreal Decisions," and Herzberg (2011) for hyperreals.

## Build item 1 (ship): relative-utility (ratio) mode

Add a new utility mode alongside finite, infinite, bounded, lexicographic, called
"relative (ratio)". When selected:
- The user (or the preset) designates an apex outcome (the best outcome in the
  matrix) and a base-point Z (a lower bound, default the worst finite outcome).
- Each cell's relative utility is computed against the apex: the apex maps to 1,
  the base-point to 0, and finite outcomes to their normalized position; an
  infinite reward maps to 1 (apex) and an infinite penalty to 0 or below per the
  Bartha construction. Implement Bartha's definition: B is weakly preferred to A
  iff U(A,B;Z) >= 1, with U defined from gambles, so infinity enters only as a
  ratio and never as a raw absorptive value.
- Expected relative utility of an action is the credence-weighted sum of its
  cells' relative utilities. Report the Z-optimal action.
- This must make mixed strategies strictly worse than the pure wager (expectation
  scales with the mixing probability), and must rank many-gods by credence rather
  than returning a tie.
- Two honest on-screen labels: results are Z-optimal (a necessary, not
  sufficient, condition for global optimality), and the verdict is now
  credence-dependent. Attribute: "after Bartha (2007), relative utilities."
- Engine work must be pure, covered by unit tests (mixed-strategy domination, the
  many-gods-by-credence ranking, scale invariance of the ratio), and must not
  change the behavior of the existing four modes.

## Build item 2 (ship): an "infinities" explainer panel or limits section

A short, accurate section (in the limits panel or its own collapsible) titled
something like "Why 0.5 times infinity ties with infinity here, and what to do
about it." Content:
- Explain absorption in extended-real arithmetic as the cause of the tie and the
  indeterminacy.
- Name the three repairs (Bartha ratios, Jackson and Rogers limiting ratios,
  Chen and Rubio surreal numbers / Herzberg hyperreals), one sentence each, with
  the convergent punchline that all three make the verdict credence-dependent.
- State Hajek's unresolved swamping dilemma in one sentence: once salvation is a
  specific infinite number, it is no longer the best possible thing (omega
  squared beats omega), so no reformulation both preserves "the finite is
  annihilated before the infinite" and yields distinguishable expectations.
- Adopt the convergent honest framing, not a claim that the Wager is rescued.

## Build item 3 (limits-panel notes only)

- Pasternack stability constraint: one influential decision-theoretic response
  screens out trickster and ad-hoc deities (those without a stable
  choice-outcome relation) before they can be assigned infinite utility. Present
  as one contested response, not a settled refutation of many-gods.
- Jackson and Rogers ratio-in-the-limit: note it as the ratio repair applied to
  growing finite afterlife durations, with the caveat that it rests on a
  no-supertasks assumption whose failure readmits a "super-worldview".

## References (cite each strategy at its source)

Wire these as a references list in the limits panel, and attribute each mode and
each objection inline where it appears:
- The wager: Pascal, Pensees, section 233.
- Many-gods objection: Diderot; canonical treatment in Hajek, "Pascal's Wager,"
  Stanford Encyclopedia of Philosophy.
- Mixed-strategies objection: Hajek, "Waging War on Pascal's Wager," The
  Philosophical Review 112 (2003): 27-56.
- Relative-utility / ratio mode: Bartha, "Taking Stock of Infinite Value:
  Pascal's Wager and Relative Utilities," Synthese 154 (2007): 5-52.
- Limiting-ratio repair: Jackson and Rogers, "Salvaging Pascal's Wager,"
  Philosophia Christi 21 (2019): 59-84.
- Surreal-number mode: Chen and Rubio, "Surreal Decisions," Philosophy and
  Phenomenological Research 100 (2020): 54-74; hyperreal cousin: Herzberg,
  "Hyperreal Expected Utilities and Pascal's Wager" (2011).
- Stability-constraint many-gods response: Pasternack, "The Many Gods Objection
  to Pascal's Wager: A Decision Theoretic Response," Philo 15 (2012): 158-178.
- Swamping dilemma: Hajek (2003), section 5.
- Maximin and minimax-regret rules: Wald (1950); Savage (1951).

## Do not build

- The full general surreal field (omega^omega, infinitesimal credences, the
  Continuity-star apparatus): not needed for the Wager and genuinely hard. The
  finite-degree omega-polynomial restriction in build item 0 is sufficient and
  exact for this decision problem.
- The full animated time-horizon "ratio in the limit" widget from Jackson and
  Rogers: overlaps the Bartha mode; fold into prose with a citation.

## Engineering integration design (read before implementing)

Important fact about the current engine: `utilityMode` (finite, infinite,
bounded, lexicographic) is currently descriptive only. It is stored and
serialized but is not referenced by any compute function (`computeEU`,
`rankByEU`, `computeDominance`, `computeMaximin`, `computeMinimaxRegret`,
`computeFullDecision`). The presets bake POS_INF / FINITE values directly into
the matrix. So the new modes are the first modes that actually change the math,
and the clean way to add them is a single preprocessing hook plus extended
arithmetic primitives, not a parallel compute pipeline.

Surreal mode, concrete plan:
1. Extend the value type. `ExtendedReal` is a tagged union
   (finite, pos_inf, neg_inf, indeterminate) defined near the top of
   `src/lib/wager.ts`. Add a fifth representation for surreal values: tag
   "surreal" carrying `coeffs: number[]`, where `coeffs[k]` is the real
   coefficient on omega^k (so `coeffs[0]` is the finite part, `coeffs[1]` the
   omega coefficient, etc). Constructors: `SURREAL(coeffs)`, plus helpers
   `OMEGA = SURREAL([0,1])` and `NEG_OMEGA = SURREAL([0,-1])`.
2. Teach the existing primitives to handle the surreal tag, so the existing
   compute functions work unchanged (they already route through these):
   - `erAdd`: if either operand is surreal, add coefficient vectors
     component-wise (pad the shorter with zeros). Promote a finite operand to
     surreal `[value]` first. (Two surreals never produce indeterminate;
     omega minus omega is the zero surreal `[0]`, which is determinate.)
   - `erMultiplyByProb(p, v)`: if surreal, scale every coefficient by p.
     0 times a surreal is the zero surreal (Lebesgue-style 0 times infinity = 0,
     consistent with the existing engine).
   - `erCompare(a,b)`: if either is surreal, promote both to surreal and compare
     lexicographically from the highest-degree coefficient down; the first
     nonzero difference decides; all-equal is 0. This is a total order, so
     surreal comparisons never return null (no indeterminate).
   - `erSubtract`, `erMax`, `erMin`, `erToString`: extend consistently.
     `erToString` formats like `w`, `0.5w`, `w + 500`, `-w`, `w^2` (use a plain
     ascii `w` for omega in code output to satisfy the writing hook; the UI may
     render a styled omega).
3. Preprocess in `computeFullDecision` (and anywhere a mode-aware matrix is
   needed): when `state.utilityMode === "surreal"`, map every cell before
   computing: POS_INF becomes OMEGA (or k*omega if the cell carries an order),
   NEG_INF becomes NEG_OMEGA, FINITE(v) becomes SURREAL([v]). Then run the
   existing pipeline. Because surreal arithmetic is total and non-absorptive,
   the four rules now return determinate, credence-sensitive results.
4. Swamping-dilemma option: allow a payoff cell (or a per-worldview setting) to
   designate an infinite reward's order (omega vs omega^2). Represent omega^2 as
   SURREAL([0,0,1]). With two gods at different orders, the higher order wins the
   EU comparison regardless of credence, which is the swamping dilemma; surface
   this in copy. Keep the default order at 1 so existing presets are unchanged.
5. Sensitivity / break-even under surreal mode may compare on the dominant
   omega-degree only; if exact finite intervals are hard, gate the fine
   break-even off in surreal mode with a one-line note rather than returning
   wrong intervals.

Relative (Bartha) mode, concrete plan:
- Add `utilityMode === "relative"`. Preprocess: pick the apex (the maximal cell
  under the absorptive order, infinite if any infinite reward exists) and a
  base-point Z (default the minimal finite cell). Map each cell to a finite
  relative utility in [0,1]: the apex maps to 1, Z maps to 0, infinite penalties
  map to 0, finite cells map to their normalized position between Z and the best
  finite outcome, scaled below 1. Then the existing finite pipeline computes
  expected relative utility = sum of credence times relative utility, and reports
  the Z-optimal action. Mixed strategies scale with the mixing probability, so
  they stop tying; many-gods ranks by credence.

Tests to add (pure, in `src/lib/__tests__/`):
- surreal arithmetic: `0.5*omega < omega`, `omega - omega == 0`,
  `omega + 500 > omega`, `omega^2 > omega`, `omega^2 > k*omega` for large k,
  comparison is total (never null).
- surreal EU on the many-gods preset ranks the two deities by credence (not a
  tie): set deity A credence above deity B and confirm A wins.
- surreal EU: a mixed action (average of wager-for and a finite action) scores
  strictly below the pure infinite wager.
- relative mode: scale invariance (multiplying all finite payoffs by a positive
  constant does not change the ranking), mixed strategy dominated, many-gods by
  credence.
- regression: the four existing modes are unchanged in behavior (the existing
  test suite must stay green; add a guard that finite, infinite, bounded, and
  lexicographic do not hit the surreal or relative branches).

UI wiring:
- Add "surreal (non-absorptive)" and "relative (ratio)" to the utility-mode
  selector with the existing dark-theme styling, and short helper text.
  Attribute surreal to Chen and Rubio (2020) and relative to Bartha (2007) right
  at the selector or in the result card.
- The infinities explainer panel and the references list per the build items and
  reference section above.

## Sequencing

Build after the v4 UI-fix branch merges, to avoid conflicts on the utility-mode
selector and the limits panel. Then cross-vendor adversarial review (codex
gpt-5.5 for the philosophy copy and the relative-utility math), then verify in the
real UI, then ship.
