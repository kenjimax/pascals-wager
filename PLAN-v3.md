# Pascal's Wager: Plan v3 (pedagogy, usability, and divine imagery)

This is a delta spec on top of the shipped v2 instrument (live at
https://kenjimax.github.io/pascals-wager/). v2 is correct and complete on the
math: extended-real engine, four decision rules, break-even intervals, presets,
sensitivity, simplex, limits panel, share links, undo, mobile tabs. Do not
rewrite the engine. Do not regress any existing test. This plan adds a teaching
layer, softens expert-first density, and dresses the surface in the Lucy
dashboard's divine imagery.

Design goal (not an acceptance gate): a newcomer should reach a correct, honest
intuition quickly, and an expert should still find the full apparatus one click
away. The acceptance gates are the concrete, testable items at the end.

This plan was revised after a cross-vendor adversarial review (codex gpt-5.5).
The review's philosophical corrections are folded in below; its recommendation to
cut the decorative imagery is deliberately overridden because the imagery is an
explicit product requirement, with the legibility risk addressed by a measurable
contrast gate.

## Source of truth for the pedagogy

Grounded in the Stanford Encyclopedia of Philosophy entry "Pascal's Wager"
(Hajek). Teach the structure as a conditional map, not a tidy ladder. Each
framing is valid only under assumptions that must be shown on screen alongside
it. Precise statements the copy must respect:

1. The wager admits three reconstructions, each working only under explicitly
   displayed assumptions (do not call them "three arguments in increasing
   strength," which is loaded; the generalized form is formally stronger under
   expected-utility assumptions but dialectically more fragile):
   - Superdominance (decision under uncertainty, no probabilities). Wagering for
     God is at least as good in every state and strictly better in one only if
     belief carries no finite earthly cost and no wrong-religion penalty. Present
     this as a contestable stipulation, not a baseline. Show that adding even a
     modest finite cost to belief breaks dominance while leaving the
     infinite-expected-utility story intact: that contrast is the point.
   - Equal-chance form (assumes p = 1/2). Not the strongest or final form, but a
     real step in the textual development, not merely a student error.
   - Generalized expectations. In the simplified one-infinite-payoff model, any
     positive credence, however small, yields infinite expected utility, so the
     probability value stops mattering. The copy must carry the qualifier "in the
     simplified one-infinite-payoff model," because once rival infinities or
     undefined infinite arithmetic enter, this is no longer true. Without the
     qualifier, the tour would train the exact simplistic intuition a later step
     has to undo.
2. The three premises that make the generalized form valid and each independently
   contestable: specific finite-vs-infinite utilities, strictly positive
   credence, and expected-utility maximization.
3. The risk-vs-uncertainty distinction organizes the four rules without
   collapsing into "pick the rule that matches your confidence." Expected utility
   is for decision under risk (you commit to probabilities). Dominance, maximin,
   and minimax regret are options under uncertainty, but maximin and minimax
   regret also encode distinct attitudes toward caution and toward regret; they
   are not neutral defaults. Rule choice also depends on whether utilities are
   comparable. State this honestly rather than implying a clean mapping from
   confidence level to rule.
4. The live objections, stated carefully (no slogans):
   - Many gods. Rival exclusive deities with their own infinite rewards do not
     simply "cancel." Depending on the matrix the expected-utility verdict
     becomes undefined, incomparable, or a tie only under added symmetry. The
     engine already distinguishes these; the copy must too. Never say "the
     infinities cancel."
   - Mixed strategies. If the infinite reward attaches to belief actually
     produced (or to sincere belief, grace, intention), then any act with a
     positive probability of producing that state also scores infinity, so
     expected utility fails to single out one action. State the dependency; do
     not teach "randomize and win" as a free-standing result.
   - Infinite utility coherence. St. Petersburg-style worries; Bartha's
     utility-ratio repair. Finite utilities are meaningful only up to positive
     affine rescaling, and infinities break ordinary intuitions about scaling.
   - The zero-credence escape. A zero-credence agent (not "the atheist," who need
     not assign exactly zero) gets finite expectation, so the wager must claim
     that assigning exactly zero is itself irrational, which is disputed.
   - Voluntariness and sincerity. Belief may not be directly choosable; Pascal's
     own reply is to act into belief (attend, practise) and let conviction
     follow. And if what is rewarded is sincere faith, wagering from self-interest
     may not produce the rewarded state at all. This bears directly on what the
     action rows even mean.

Common-misunderstanding corrections to surface as inline glossary or tooltips:
- A decision matrix does not require every cell to be a specific number; one
  infinity against finite contrasts drives the simplest version.
- Any positive probability suffices in the one-infinite-payoff model; you do not
  need to think God likely.
- The four rules are different questions, not a vote.
- Infinite utility is not obviously coherent.
- Mixed strategies are a genuine threat, not a curiosity.
- The conclusion is conditional on a fragile package of assumptions, not "there
  is no answer."

## Work item 1: a guided "Begin here" mode (the biggest gap)

The live tool drops a newcomer straight into a dense expert console. Add a
first-run guided path, built as a proper modal dialog (role dialog, aria-modal
true, focus trapped, focus restored on close, Escape closes). It is a modal: that
resolves the accessibility question cleanly and prevents the user from poking
unrelated controls mid-step.

State isolation (this is a correctness requirement, not a nicety): on open, the
tour snapshots the current scenario state; on close or skip it restores that
snapshot, so the tour never pollutes the user's scenario, undo history, or share
state. Within a step the tour may load a preset and move exactly one highlighted
live control (for example the credence slider in step 3); all other controls are
inert behind the modal. The tour reads and writes the real engine so its numbers
can never drift from the real computation.

Five steps, each one screen of plain language with one live, pre-filled
micro-example, and each step shows the assumptions it depends on:
1. The question. "Should you live as if God exists when you cannot be sure?"
   Show the bare 2x2 (believe or not, against exists or not). No jargon.
2. The cheap version: superdominance, and its cost. Fill the 2x2 so believing is
   never worse and sometimes better, and say plainly this holds only because
   belief is stipulated to cost nothing. Then add a small finite cost to belief
   and show dominance break while the infinite-expected-utility verdict (next
   step) would not. This inoculates against conflating the framings.
3. The famous version: one infinite payoff, in the simplified model. Flip the
   top-left cell to infinity. Show the expected-utility column reads infinity for
   any positive credence, and let the reader drag credence from 1 percent to 99
   percent and watch the verdict hold. Label this explicitly as the
   one-infinite-payoff model so the intuition is correctly bounded.
4. The complication: a second god. Add a rival exclusive deity with its own
   infinite reward. Show the expected-utility verdict become undefined or tied
   (use the engine's actual result wording, not "cancel"). This motivates the
   other three rules and the limits panel.
5. Hand-off. "The wager's conclusion is conditional on a fragile set of
   assumptions; here is the full console to test each one." Button into the full
   app.

Persist dismissal in localStorage (key pw_tour_seen). First visit shows it; a
"Guided tour" button in the header reopens it. Respect prefers-reduced-motion for
step transitions.

## Work item 2: plain-language layer over the expert vocabulary

Keep every expert term (an expert wants them), but never let one appear naked.
Add a reusable Term component: dotted underline; hover, keyboard focus, and tap
each reveal a one-sentence gloss in a small popover; keyboard reachable;
aria-describedby wired; dismiss on Escape and outside tap. Glossary content lives
in one src/lib/glossary.ts map so copy is reviewed in one place.

Scope to keep this from becoming a brittle liability: gloss each term only at its
first appearance, and provide a plain title-attribute fallback plus a single
"Glossary" section in the limits panel listing every term and gloss, so the
popover is an enhancement and never the only access path. The eight highest-value
terms to gloss inline: credence, expected utility, statewise dominance, maximin,
minimax regret, lexicographic tiebreak, possibility-filtered, break-even
interval. The rest (affine rescaling, partition sensitivity, extended reals,
exclusivist, universalist, the professor's god) live in the glossary section.

Specific renamings and softenings (label changes only, engine untouched):
- "Possibility-filtered maximin (only states with positive credence)" stays but
  gets a Term gloss and a plainer parenthetical: "ignore worlds you have ruled
  out."
- The worldview exclude control currently reads "[EXCLUDE]". Keep the cyberpunk
  styling but make its accessible label and tooltip read "Set credence to zero,"
  explaining that excluding is exactly assigning zero probability and how that
  differs from a tiny epsilon (which the engine already distinguishes).
- Each of the four rule cards in DecisionRulesPanel gets a one-line "when this
  rule is the right question" note consistent with item 3 of the pedagogy
  section: expected utility when you commit to probabilities; dominance when one
  option is never worse; maximin and minimax regret as distinct caution and
  regret attitudes when you withhold probabilities. Do not imply a single clean
  confidence-to-rule mapping. Add a one-liner that finite utilities are defined
  only up to positive affine rescaling.

## Work item 3: a "Three framings" teaching panel

New collapsible panel (default collapsed on desktop, a tab on mobile) titled "The
argument, three framings." Renders superdominance, equal-chance, and generalized
expectation as three short cards. Each card states its enabling assumptions in
one line and has a "load this framing" button that sets the matrix and utility
mode to demonstrate it on the live engine. This is the highest-value pedagogical
addition after the tour: it turns the abstract apparatus into three concrete,
assumption-tagged, runnable claims. Do not present them as a strength ranking;
present them as a conditional map.

## Work item 4: a short "what the model leaves out" module

A compact panel or limits-panel expansion that names the objections the matrix
cannot itself represent, so the tool is honest about its own frame:
- Voluntariness: you may not be able to simply choose belief; Pascal's reply is
  to act into it.
- Sincerity and deception: if sincere faith is what is rewarded, a self-interested
  wager may not produce the rewarded state, which also undercuts the
  mixed-strategy move.
- Whether prudence is an appropriate basis for religious commitment at all, and
  whether a good God would reward wager-style belief.
Keep it to a few honest sentences each; this is acknowledgment, not a treatise.

## Work item 5: dark-theme dropdown fix (custom listbox deferred)

The real defect: native select elements on a dark theme render an operating-system
light popup in several browsers. Fix that directly and low-risk: force
color-scheme dark on the selects and set explicit dark option background and text
colors so the popup matches the theme; keep the native control for its built-in
keyboard and screen-reader behavior. Do not build a custom listbox in this pass:
a hand-rolled listbox is easy to make worse than native, especially on mobile
screen readers, and the cross-vendor review flagged it as overbuild for low gain.
If the native popup genuinely cannot be themed acceptably in Chromium, the
fallback is a minimal custom listbox, but only if the native fix is shown to fail.

## Work item 6: divine imagery, matching the Lucy dashboard sidebar

This is an explicit product requirement (awe-inspiring, holy images of God:
Ancient of Days, Creation of Adam). Implement it, but treat it strictly as
decorative gutter chrome that never sits behind console text, and hold a
measurable contrast gate so it cannot harm legibility. Keep all many-gods content
text-symmetric so the Western-Christian art does not bias the rival-deity lesson.

Replicate the Lucy dashboard's side-image treatment
(/home/kenji/Claude/lucy-dashboard/src/components/LucySidebar.tsx and its
.lucy-sidebar styles in that repo's globals.css): a fixed vertical image rail
with a scanline overlay, corner brackets, an edge glow, and a mono caption,
rotating slowly through a small image set.

Assets are already downloaded and committed under public/divine/ (all public
domain, verified):
- ancient-of-days.jpg (Blake, The Ancient of Days, God with the compass;
  1280x1768 portrait; the primary rail hero).
- creation-of-adam.jpg (Michelangelo, the hands; 1280x581 landscape).
- god-sistine.png (Michelangelo, the God figure; 1280x596 landscape).
- dore-paradiso.jpg (Dore, the Empyrean rose of light; 858x952).

Implementation:
- New component DivineRail.tsx, adapted from LucySidebar. On xl-and-up viewports
  render fixed left and right rails in the page gutters, outside the max-w-7xl
  console column, so no rail is ever behind body text. Below xl the rails are
  hidden. Left rail rotates portrait-friendly images on a slow, time-based
  deterministic index (reuse Lucy's approach so it does not thrash on every
  render); right rail can be a single lower-opacity accent (the Dore rose) for
  balance.
- Rails are aria-hidden decoration with pointer-events none; they never take
  focus or intercept clicks.
- Each image gets a mono caption (artist, title, date) in the rail footer:
  attribution is good practice even for public-domain work.
- Respect prefers-reduced-motion: static image, no crossfade.
- Optional: a thin creation-of-adam top band above the title if it reads well;
  drop it if it fights the glitch title. The side rails are the requirement, the
  band is optional.

## Non-negotiables (carry over from v2)

- Static export must still succeed (output export); all new images load via plain
  img tags with the configured basePath, no Next image optimization.
- No new runtime dependency unless strictly necessary. Lucide is already in.
- npm test stays green; add tests for new pure logic (glossary lookups; tour step
  state machine if non-trivial; new presets round-trip through decodeState).
  UI-only work needs no test but must not break existing.
- Accessibility: every new interactive control is keyboard reachable with a
  visible focus ring and an accessible name. The tour modal traps and restores
  focus.
- Writing style for all in-app copy: sentence case, no em dashes, no all-caps
  emphasis, no decorative arrows or checkmarks. The repo's writing hook enforces
  this on file writes.
- Tone: a thinking instrument about one argument, not advocacy. Concretely banned
  framings in copy: any second-person exhortation to believe or not believe ("you
  should believe," "the smart bet is faith"), any claim that the tool settles the
  question, and any asserted probability for God's existence.

## Acceptance criteria (each is testable)

1. With localStorage cleared, first load shows the guided tour. It advances
   through five steps. Both "skip" and finishing land in the full console with the
   user's prior scenario state intact (snapshot restored). A header control
   reopens the tour. Verify by driving the UI and reading the rendered state.
2. Each of the eight inline-glossed terms shows its gloss on hover and on keyboard
   focus; every term in glossary.ts also appears in the limits-panel glossary
   section. Verify by focus traversal and by snapshot of the glossary section.
3. The "three framings" panel exposes three cards, each with stated assumptions
   and a working "load this framing" button that changes the live matrix and
   utility mode.
4. At least two new presets exist ("Pascal's original 2x2," "Diderot's imam") and
   each round-trips through share-link encode then decodeState with no loss
   (covered by a unit test).
5. The utility-mode and preset dropdowns render dark in Chromium (the open popup
   background is dark, not operating-system light) and remain keyboard operable.
   Verify by opening each control in a real browser and reading the screenshot.
6. At a 1440-wide viewport the divine rails render in the gutters with the Ancient
   of Days image, scanline and corner-bracket treatment, and a caption; they sit
   outside the console column and intercept no clicks. Body text in the console
   keeps a contrast ratio of at least 4.5 to 1 against its own background (the
   rails are not behind it, so this holds if the gutter placement holds; confirm
   placement in the screenshot). Rails are hidden below xl.
7. Tour copy carries the required qualifiers: step 3 names the
   one-infinite-payoff model, step 4 uses the engine's "undefined" or "tie"
   wording rather than "cancel," and no copy contains a banned framing from the
   tone rule. Verify by reading the rendered step text.
8. npm test green; npm run build with GITHUB_PAGES true produces a working static
   export; every interactive element from the v2 audit still renders and computes
   (the v2 element list is the regression checklist).
