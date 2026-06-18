# Pascal's Wager: a live decision-theory instrument

Authoritative build spec. Version 2, after cross-vendor adversarial review (gpt-5.5). This is the
single source of truth for the build. Target: a polished, production-grade Next.js app deployed to
Vercel, in the Lucy dashboard's Cyberpunk 2077 visual language, built to the standard of a flagship
product, not a weekend toy.

## 0. Provenance

Daniel Eaton built a working prototype (`pascals_wager-2.html`, included in the repo under `docs/`):
a 5-step wizard modeling Pascal's Wager as a "many-gods" decision matrix. Action = "live according to
worldview X", State = "worldview Y is actually true", expected utility EU(X) = sum over Y of
P(Y) times payoff(X given Y). Diagonal of the payoff matrix = net outcome for a sincere X-follower if
X is true; off-diagonal = outcome for an X-follower if Y is true. He recommends argmax EU.

We keep the matrix abstraction (it is the right level for the audience) but rebuild the interaction,
the output, the math rigor, and the framing.

## 1. The primary user and the product's job

Primary user: a thoughtful, curious person who has actually wondered about the Wager (Daniel's level),
plus philosophy-curious laypeople and students. Not decision theorists who want a research tool, and
not people looking to be told what to believe.

The job to be done: let that person see, by direct manipulation, how the prudential argument behaves
under their own assumptions, and how fragile or robust any conclusion is. The product's value is
insight and honesty, not a recommendation. It must never read as a religion recommender.

This single sentence governs every tradeoff below: default to a simple, legible first experience;
make depth available but never mandatory; be relentlessly honest about what the model can and cannot
say.

## 2. The three problems we fix, and how

1. It is a wizard. Replace with progressive disclosure on one screen (section 3): a simple default
   scenario with a live result visible immediately, and advanced controls that expand in place. This
   gives immediate connection (see the consequence of every input as it changes) without the
   cognitive overload of exposing every cell at once. No modal steps, no Next/Back gating.

2. It returns one number under one rule. Replace with a multi-rule result that surfaces disagreement
   (section 4), and make sensitivity the headline: not "what is the answer" but "how far can your
   beliefs move before the answer changes" (section 4, break-even).

3. It quietly removes the heart of the argument by capping payoffs at 100000. Restore infinities as a
   first-class, explicitly-modeled and honestly-handled construct (section 4, extended-real engine),
   while making clear that infinite utility is itself a contested modeling assumption, not a settled
   fact.

## 3. Layout and interaction (progressive disclosure, no modes)

One screen. On load, it shows a complete, working, simple scenario (Pascal's binary: belief in a
generic God with infinite reward vs secular life), with the result already computed and visible. The
user learns the tool by seeing it work, then deepens.

Three zones, all on one page:

A. Header / HUD bar.
   - Glitch title "Pascal's Wager" in the CP2077 style (section 9).
   - Scenario preset menu (section 7).
   - Mode selector for the utility model: Finite, Infinite, Bounded, Lexicographic (section 4).
   - Share button (copies a URL encoding full state; section 8).
   - A persistent one-line disclaimer chip: "A model of one prudential argument, not advice on what
     to believe." Clicking it opens the limits panel (section 5).

B. Inputs (left on desktop, top on mobile). Each input shows its consequence live.
   1. Worldviews. Multi-select cards (presets plus free-text add), always visible. Each selected
      worldview carries a small structured "theology template" rather than raw cells by default
      (section 4, payoff templates): for example "rewards only its own sincere followers",
      "universalist (rewards sincere seekers of any path)", "annihilationist (no eternal penalty,
      outsiders simply cease)", "rewards honest disbelief (the professor's god)". Picking a template
      fills that worldview's row and column of the matrix with sensible values the user can later
      refine.
   2. Credences. The Wager turns on tiny probabilities, so the credence editor must express epsilon
      values cleanly. Provide a direct numeric entry per worldview (accepts values like 0.5 percent
      or 0.001) plus a log-scaled slider for fine control at small magnitudes, plus a compact
      stacked-allocation bar for the visual sense of the whole. Show raw weights and the normalized
      probabilities side by side, with one line of copy explaining normalization ("your weights are
      rescaled to sum to 100 percent"). Critically: distinguish a credence of exactly zero (this
      worldview is excluded as impossible and contributes nothing, even against infinite payoff) from
      a tiny positive credence (it stays in play and, under infinite reward, dominates). Make this
      distinction explicit in the UI with a separate "exclude" control versus a near-zero value.
   3. Advanced: the full payoff matrix. Collapsed by default behind an "Advanced: edit the full payoff
      matrix" expander. When expanded, an editable N by N grid where every cell is directly editable
      (typed entry and scrub), with per-cell infinity controls (a cell can be set to plus infinity,
      minus infinity, or a finite value), because real many-gods cases need asymmetric per-cell
      treatment (deity rewards one rival, punishes another, ignores a third). The templates in B.1 are
      just fast ways to populate this grid; the grid is the ground truth.
   4. Undo and reset controls: reset a cell, reset a worldview's row, reset to the loaded preset, and a
      global undo of the last change. This is an exploratory instrument; cheap reversibility matters
      more than another chart.

C. Results (right on desktop, below on mobile). All live, recomputing under 100 ms.
   1. Result card (not "verdict"). Headline reads "Under your assumptions and the [rule] rule, the
      model favors: X." Never "you should". Shows the rule that produced it and a one-line reason.
      When rules disagree, it says so and names the split.
   2. Decision-rule panel. Four rules, each shown with the exact question it answers, not flattened
      into four equal votes:
      - Expected utility ("which choice has the best probability-weighted average outcome").
      - Statewise dominance ("is there a choice that is at least as good in every state you consider
        possible and strictly better in at least one"); report none if none exists, which is the
        common case in many-gods matrices.
      - Maximin ("which choice has the least-bad worst case among the states you consider possible").
        Label it precisely as worst-case over states with positive credence (a possibility-filtered
        maximin), and offer a toggle for true statewise maximin over all listed states regardless of
        credence.
      - Minimax regret ("which choice minimizes your largest possible regret").
      Each rule shows its pick (or tie, or undefined) and a short why. The panel explains that these
      are different normative questions, not a poll.
   3. Sensitivity (headline feature), two tabs:
      - Credence sensitivity. For the current expected-utility-optimal action, for each worldview,
        compute the exact intervals of that worldview's probability over which each action is optimal,
        by treating each action's EU as an affine function of the varied probability (with the other
        credences renormalized proportionally) and computing the upper-envelope breakpoints. Report
        all crossing points and the resulting optimality intervals, not a single flip threshold,
        because the optimal action can change identity more than once. State the redistribution
        assumption in plain copy ("holding the odds among the other worldviews fixed"). Render as a
        small-multiple of segmented bars (one per worldview) showing where each action wins, with the
        user's current point marked.
      - Payoff sensitivity. The same treatment for key payoff values (for example each worldview's
        reward and its outsider penalty): over what range of that payoff does the current optimum
        hold. Users rarely know exact utilities, so this matters as much as credence sensitivity.
   4. Payoff matrix heatmap. The matrix as a diverging heatmap with a true zero midpoint, colorblind
      safe (value separation, not hue alone). Finite cells use the diverging scale; infinite and
      indeterminate cells use distinct symbolic badges (a clearly labeled "plus inf", "minus inf",
      "undefined" treatment) so a single infinite value does not destroy the finite color scale.
   5. Expected-utility comparison. Finite EU values as horizontal bars on a common zero baseline.
      Actions with infinite or indeterminate EU are shown as labeled badges in a separate lane above
      the finite bars, never forced onto the numeric axis.

Mobile: not a naive vertical stack. Use a segmented control to switch between Inputs, Result, and
Detail (matrix and charts). The simple default scenario and its result must be fully usable on a
phone without opening the advanced matrix.

## 4. Decision engine (the part that must be provably correct)

Implement as a pure, dependency-free, fully unit-tested module (`lib/wager.ts`), no UI imports. The
math is the most likely place to embarrass us, so it is isolated and tested exhaustively.

### 4.1 Numbers: extended reals

A payoff or an EU value is an extended real, one of: a finite number, positive infinity, negative
infinity, or indeterminate (the result of combining positive and negative infinity). Implement a
small, documented arithmetic over this type. Every operation that can produce indeterminate must do so
explicitly rather than coercing to a number or to JavaScript Infinity or NaN by accident.

Rules of the arithmetic, stated and tested:
- finite + finite = finite (with guards on overflow near the safe-integer range; clamp and flag).
- finite + positive infinity = positive infinity; finite + negative infinity = negative infinity.
- positive infinity + positive infinity = positive infinity; negative + negative = negative.
- positive infinity + negative infinity = indeterminate.
- probability times payoff: if probability is exactly 0, the product is 0 regardless of the payoff
  (an excluded state contributes nothing). This is a deliberate modeling choice (Lebesgue-style
  expectation) and is documented in code and surfaced in the UI. If probability is positive and the
  payoff is infinite, the product is the corresponding infinity.
- Any sum that combines positive and negative infinity over positive-probability states is
  indeterminate.

### 4.2 Probabilities

Normalize raw nonnegative weights to probabilities. A worldview the user has explicitly excluded gets
probability exactly 0 and is treated as impossible. Guard the all-zero case (no eligible worldview has
positive weight): return an explicit "no probability assigned" state, never divide by zero. Keep a
clean separation between "excluded (exactly 0, impossible)" and "tiny but positive".

### 4.3 Expected utility

EU(action a) = sum over states s of P(s) times U(a, s), computed in the extended-real arithmetic
above. The result is finite, positive infinity, negative infinity, or indeterminate.

### 4.4 Comparing and ranking

- Finite EUs compare normally.
- An action with positive-infinity EU beats any finite-EU action.
- Two actions both at positive infinity are tied under expected utility. They are genuinely tied; do
  not silently break the tie.
- Indeterminate EU is not a number; an indeterminate action is reported as "expectation undefined"
  and is excluded from the expected-utility optimum by an explicitly named convention ("we rank only
  actions with a defined expectation"), not presented as if it were a theorem.

### 4.5 The infinity tie problem, handled honestly

When more than one action has positive-infinity EU (the typical many-gods situation), the expected
utility rule cannot discriminate among them; they tie at infinity. Surface this plainly. Offer, as an
explicitly optional and clearly labeled refinement that the user can switch on or off, a lexicographic
tiebreak that ranks tied-infinite actions by the total probability mass on their infinite-reward
states and then by finite remainder. Label it exactly as what it is: an extra convention beyond
expected utility, not "the standard result", and note that it is sensitive to how finely the user
partitions worldviews (splitting one worldview into two changes the mass). Default: off, with the tie
shown honestly. This addresses the mixed-strategy and many-gods objections by exposing them rather
than papering over them.

### 4.6 The four decision rules (each precisely defined over extended reals)

- Expected utility: argmax over actions with defined EU, per 4.4 and 4.5.
- Statewise dominance: action A weakly dominates B if U(A,s) is greater than or equal to U(B,s) for
  every state s with positive credence and strictly greater for at least one, using the extended-real
  order (positive infinity greater than any finite greater than negative infinity; indeterminate cells
  make that pair incomparable). Report the set of undominated actions and any strictly dominant action;
  report "no dominant action" when none exists. Do not call dominance "Pascal's real structure"; note
  only that the binary Wager is often presented as a dominance argument and that dominance rarely
  exists once multiple gods are admitted.
- Maximin: maximize the minimum payoff across states. Default scope: states with positive credence
  (possibility-filtered), clearly labeled; toggle for all listed states. Define the minimum over
  extended reals (any negative-infinity worst case makes the action maximally bad; ties among
  negative-infinity actions are broken by comparing the next-worst outcome, and if still tied,
  reported as tied).
- Minimax regret: regret(a,s) = best(s) minus U(a,s), where best(s) is the max payoff any action
  yields in state s. Define regret fully over extended reals: if best(s) is positive infinity and
  U(a,s) is finite or negative infinity, regret is positive infinity; if best(s) and U(a,s) are both
  positive infinity, regret is 0; indeterminate cells produce undefined regret for that pair. An action
  with any undefined or positive-infinity regret is flagged accordingly. Minimize the maximum regret
  over states; report ties and undefined cases honestly.

### 4.7 Break-even and sensitivity (exact, not a single threshold)

For a varied scalar parameter t (a worldview's probability, or a payoff value), each action's EU is an
affine function of t when the other credences are renormalized proportionally (probability case) or
when a single payoff cell varies (payoff case): EU_a(t) = t times slope_a + intercept_a. The optimal
action is the upper envelope of these affine functions, which is piecewise linear with potentially
multiple breakpoints. Compute the breakpoints exactly (pairwise intersections within the valid range,
sorted) and report the full set of intervals with the optimal action on each, the current point, and
any ties at boundaries. Never report a single "flip threshold" as if optimality were monotone. For the
infinite case, handle the discontinuity at t = 0 explicitly: moving from excluded (0) to any positive
credence can jump an action's EU from finite to infinite, so report that boundary as a discontinuity,
not a smooth crossing, and state in copy that this jump at zero is precisely the contested core of the
Wager.

### 4.8 Determinism and canonicalization

Identical inputs always produce identical output. Define a canonical worldview ordering, a
deterministic tie-ordering for display, an explicit floating-point tolerance for equality near
breakpoints, and a stable URL encode and decode round trip. No randomness, no time dependence.

## 5. Honesty: the limits panel and inline notes

A dedicated, always-reachable "About this model" panel (reached from the disclaimer chip) plus
contextual inline notes. It states the model's assumptions and what it cannot settle, in plain
language, without burying the tool in text:
- It models one prudential argument; it is not theology and not advice about belief.
- Worldview labels are coarse. Real theological states are finer (exclusivist vs universalist
  Christianity, election, hiddenness, the professor's god). How you partition worldviews can change
  the result; the tool warns about this where partition sensitivity bites (the infinity tiebreak).
- Utilities are entered by hand and are assumed cardinally comparable across worldviews, which is
  itself contestable; expected utility is invariant only under positive affine rescaling.
- Infinite utility is a contested assumption. The tool offers finite, infinite, bounded, and
  lexicographic modes so the user can see how the conclusion depends on it, rather than asserting one.
- Belief may not be voluntary; the model recommends a practice or way of living, not an act of will,
  and even that is a simplification (sincerity, grace, and election are not modeled).
- It names, briefly, the live objections it does not resolve (mixed strategies, many gods, bounded vs
  unbounded utility, imprecise probabilities, evidential vs causal decision theory) and links a
  curated, bundled bibliography (Stanford Encyclopedia entry on Pascal's Wager; Hajek on the
  mixed-strategy and many-gods objections). Bibliography text is bundled locally, no network needed.

## 6. Visualization standards

- Diverging palette for the matrix, true zero midpoint, value-separated and colorblind safe; infinite
  and indeterminate values as labeled symbolic badges, not extreme colors.
- EU comparison on a common zero baseline for finite values; extended values as a separate labeled
  lane.
- Sensitivity as small-multiple segmented bars (per parameter) marking where each action wins, with
  the current point indicated; honest about being one-at-a-time sensitivity (a note that joint
  perturbations can differ).
- For the special legible case of exactly two or three worldviews, offer an optional probability
  simplex view (a line for two, a triangle for three) shaded by which action is optimal, with the
  user's current credence plotted. This is the one place the full geometry is visualizable; use it.
- Every comparison shows its baseline (optimal EU against runner-up, with the margin stated). Minimal
  chrome, direct labels, gray for secondary ink, the squint test applied.

## 7. Scenario presets (precisely labeled, never caricatured)

Each preset loads a complete configuration and shows the resulting state, with a one-line note and an
explicit "schematic, simplified" label:
- "Simplified Pascalian binary wager": generic God with infinite reward and finite cost of practice,
  vs secular life. Shows that under infinite reward any positive credence makes the wager favor belief.
- "Many gods": two or more mutually exclusive deities each promising infinite reward to their own.
  Shows colliding infinities, the expected-utility tie, and the partition sensitivity of the optional
  tiebreak.
- "Anti-Pascal (the professor's god)": a deity who rewards sincere honest disbelief. Shows the wager
  can be cancelled by a symmetric hypothesis.
- "Finite stakes": all payoffs finite. Shows the conclusion becomes ordinary and sensitive, and the
  break-even intervals become informative.
- "Bounded utility": large but finite caps representing a bounded-utility view. Shows how bounding
  defuses the infinity dominance.

Preset copy must avoid implying any real tradition reduces to outsider damnation; templates include
universalist and annihilationist options precisely so the presets are not theological caricatures.

## 8. State, sharing, persistence

- Full state (worldviews, templates, raw weights, exclusions, matrix, infinity flags, mode, rule
  toggles) encodes into a URL using a compact, compressed encoding. Specify a length budget; when the
  encoded state would exceed a safe URL length, fall back to storing the state under a short generated
  id in localStorage and putting that id in the URL, with clear copy that the long link works on this
  device. The Share button copies the link and confirms.
- localStorage autosave so a refresh never loses work; opening a shared URL restores exactly.

## 9. Visual language: Lucy dashboard Cyberpunk 2077

Match the Lucy dashboard exactly. Reproduce its system (the builder will be given the Lucy
`globals.css` and `tailwind.config.ts` as reference and should port the relevant tokens, utilities,
and keyframes):
- Palette: cyan #00f0ff, magenta #ff003c, yellow #fcee09, green #39ff14, deep surfaces
  #06060f, #0c0c1a, #121225, #1a1a30, #22223a, text #e8edf8 and dim #8b93b4.
- Fonts: Rajdhani (display and body) and Share Tech Mono (numbers, tags, code-like values) via
  next/font/google, exposed as --font-rajdhani and --font-share-tech-mono.
- Structure: augmented-ui clipped-corner panels (the `cp-panel` and `[data-augmented-ui]` treatment),
  uppercase tracked panel headers in cyan, corner-bracket decorations.
- Atmosphere: the fixed scanline overlay and animated scanline bar, the circuit-grid background, neon
  text glow (glow-cyan and friends), box-glow on key surfaces, the animated hud-border on the primary
  result panel, holographic shimmer on load, glitch title for the heading. Keep the decorative glow;
  Kenji wants it. Use the semantic colors meaningfully where possible (green for the favored action,
  magenta for negative payoffs and the worst-case, yellow for warnings and ties, cyan as the primary
  structural accent) so the neon also carries information.
- CP2077 status dots (rotated squares with glow), cp-tag data tags (mono), cp-progress bars, cp-btn
  clipped buttons, cp-input fields, the custom thin neon scrollbar.
- Reuse Tremor for layout primitives and Recharts for the bar and sensitivity charts where it does not
  fight the aesthetic; the matrix heatmap and simplex are custom.

This is a dark, single-theme product (the source aesthetic is dark only); no light mode required. If a
light mode is trivial it is optional, not in scope.

## 10. Tech, quality, deployment

- Next.js 14 App Router, TypeScript strict, Tailwind, mirroring the Lucy config. augmented-ui,
  @tremor/react, recharts, lucide-react, next/font. A compression lib for URL state (for example
  lz-string).
- Entirely client-side: no backend, database, auth, or network calls at runtime. Clean static deploy.
- The decision engine (`lib/wager.ts`) has comprehensive unit tests (the build must run them in CI
  before deploy): finite cases, single and multiple infinities, indeterminate combinations, exact-zero
  vs tiny-epsilon credence, all-zero weights, ties under every rule, regret with infinities,
  non-monotone break-even with multiple intervals, payoff sensitivity, and URL encode and decode round
  trips including custom names and exclusions.
- Accessibility: keyboard-operable for every control including the matrix grid (arrow-key cell
  navigation, typed entry, a documented interaction model; do not invent surprising global key
  behavior). Visible focus states. aria labels on inputs and on the symbolic infinity badges. Respect
  prefers-reduced-motion: gate the scanline, glitch, shimmer, and pulse animations behind it so the
  tool is calm and usable for motion-sensitive users while keeping the glow for everyone else.
- Performance: every input change recomputes and repaints under 100 ms at up to about 8 worldviews.
- Repo: GitHub under kenjimax (public by default, Kenji's call). Deploy: Vercel personal account,
  production plus preview deploys. Keep the original prototype in `docs/` and a short readme crediting
  Daniel Eaton's original idea and prototype.

## 11. Definition of done

- One screen, progressive disclosure, simple scenario live on load, every input live under 100 ms.
- Extended-real engine per section 4, fully unit-tested including all edge cases listed in section 10.
- Four decision rules, precisely defined over extended reals, each labeled with the question it
  answers, disagreement surfaced; the infinity tiebreak present but optional and honestly labeled.
- Exact break-even intervals (not single thresholds), credence and payoff sensitivity, with the
  zero-credence discontinuity handled and explained.
- Diverging heatmap with symbolic infinity badges; EU bars with a separate extended-value lane;
  per-parameter sensitivity small-multiples; simplex view for two or three worldviews.
- Pluralism-aware theology templates; epsilon-capable credence editing; explicit exclude-vs-tiny
  distinction; undo and reset.
- Limits panel and inline honesty notes; result framed as a model result under assumptions, never as
  advice; bundled bibliography.
- Shareable compressed URL state with localStorage fallback; restores exactly.
- Full Lucy CP2077 visual language with the decorative glow, semantic use of the neon palette, and
  reduced-motion support.
- Deployed to Vercel with a working production URL; CI runs the engine tests before build.

## 12. What "better than the prototype" means, concretely

1. Wizard replaced by one live screen with progressive disclosure (immediate connection, no modes).
2. One EU number replaced by a four-rule result that surfaces disagreement and labels each rule's
   question.
3. Exact break-even intervals plus payoff sensitivity added as the headline insight.
4. Infinities represented and handled honestly across finite, infinite, bounded, and lexicographic
   modes, restoring the actual Wager that the prototype's 100000 cap removed, while being explicit
   that infinite utility is contested.
5. Two wizard payoff steps replaced by pluralism-aware templates over one directly editable matrix.
6. Manual "sum to 100" replaced by epsilon-capable credence editing with an explicit exclude-vs-tiny
   distinction and live normalization.
7. Plain table and cards replaced by a diverging heatmap (with symbolic infinities), a length-encoded
   EU bar chart, per-parameter sensitivity small-multiples, and a simplex view for small cases.
8. Compressed shareable URL state, localStorage persistence, precisely-labeled teaching presets, undo
   and reset.
9. A pure, exhaustively unit-tested decision engine.
10. Full Lucy Cyberpunk 2077 craft with the decorative glow, semantic neon, and reduced-motion care,
    plus an honest limits panel so a rigorous-looking tool does not overclaim.
