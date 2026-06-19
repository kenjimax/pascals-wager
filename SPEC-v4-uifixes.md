# Pascal's Wager: v4 UI fixes spec

These are concrete bug fixes on the live instrument, found by driving the real
UI. Base branch is current master, which already includes two fixes you must not
regress: the Term glossary popover now portals to document.body (escapes the
panel clip-path), and SimplexViz now scales for devicePixelRatio with non-clipped
labels. Leave `src/components/Term.tsx` and `src/components/SimplexViz.tsx`
alone unless a change below requires touching them.

Hard rules: do not rewrite the engine in `src/lib/wager.ts`. Keep `npm test`
green and add tests for any new pure logic. All in-app copy is sentence case, no
em dashes, no all-caps emphasis, no decorative arrows or checkmarks. Verify every
item below by driving the actual UI with real mouse and pointer events (not just
checking that elements exist in the page) and reading screenshots, because these
bugs only show under real interaction.

## 1. Guided tour: show credences and add a real draggable slider

File: `src/components/GuidedTour.tsx`.

The tour's expected-utility numbers are computed live and are correct, but the
matrix does not display the credences (probabilities), so the numbers look wrong
to a reader doing the arithmetic in their head. Example: step 3 uses weights 1
and 99, so the secular action's expected utility is 0.99 times 500, which is 495,
but a reader seeing only payoffs 0 and 500 expects 250. Fix this by displaying
the probabilities and making step 3 interactive.

- In the `MiniMatrix` component, add a credence row (or a per-column percentage)
  showing each state's probability, computed from the same normalized weights the
  engine uses (`normalizeProbabilities`). The reader must be able to see that, for
  example, "God exists" is at 1 percent and "God does not exist" at 99 percent, so
  the expected-utility figures are self-explanatory.
- Step 3 ("The famous version: one infinite payoff") currently tells the reader to
  "drag the credence from 1 percent to 99 percent," but there is no slider in the
  tour. Add a real, draggable range slider inside step 3 that varies the
  "God exists" credence across its full range and recomputes the mini-matrix and
  the verdict live, so the instruction actually works and the reader watches the
  expected-utility verdict stay on belief for any positive credence. The slider
  must be draggable, not click-only (see item 4 for the slider fix that applies
  everywhere).
- Only step 3 needs the live slider. Other steps keep the static mini-matrix, now
  with the credence row visible.

## 2. Fix step 2's unclear forward reference

In step 2 ("The cheap version: superdominance, and its cost"), the line
"The expected-utility argument in the next step would survive that cost" refers
forward to a step the reader has not seen, which is confusing. Reword so the
point is self-contained: state that adding a finite cost to belief breaks
dominance, but does not touch the separate expected-utility argument (the one
that uses an infinite payoff), without relying on "the next step." Keep it short.

## 3. Remove the not-advice / prudential-argument disclaimer copy

Kenji's instruction: this framing is not his voice and not Daniel's. Remove it in
all three places and replace with neutral, accurate copy (or nothing):

- `src/components/DisclaimerChip.tsx`: the button currently reads "A model of one
  prudential argument, not advice on what to believe." Replace the chip's text
  with a plain neutral label that opens the same panel, for example
  "About this model and its limits" (keep it as the affordance that opens the
  limits panel; do not delete the button).
- `src/components/GuidedTour.tsx`, step 5 body: delete the sentence
  "This is a thinking instrument about one prudential argument, not advice about
  what to believe." Do not replace it with a similar disclaimer.
- `src/components/LimitsPanel.tsx`, the "What this is" section: remove the
  "not theology, not philosophy of religion, and not advice about what to believe
  or how to live" framing. Replace with a plain, accurate description of what the
  tool computes (a decision matrix over rival worldviews with extended-real
  payoffs and four decision rules). Do not moralize about what it is not.

## 4. Make the credence sliders draggable, not click-only

File: `src/components/CredenceEditor.tsx` and the range-input styles in
`src/app/globals.css`.

The native range sliders currently feel click-only and are hard to drag. The
custom webkit slider thumb is only 12px and is rotated, which shrinks the grab
target. Make the thumb larger (at least 16 to 18px hit area), confirm
`touch-action` and `pointer-events` are not disabled on the track or thumb, and
verify by dispatching a real pointer-drag (mousedown on the thumb, several
mousemoves, mouseup) that the value changes continuously through the drag, not
only on click. Apply the same draggable slider to the tour's step 3 slider.

## 5. Right-side divine rail shows no image

File: `src/components/DivineRail.tsx`.

The left rail renders, the right rail looks empty. The right rail currently uses
`creation-of-adam.jpg`, which is a wide landscape image; in the tall narrow rail
object-cover zooms into a near-empty dark center strip, so it reads as blank.
Fix by using a vertically composed image on the right rail too. Use
`dore-paradiso.jpg` (the radiant Empyrean) on the right; it is already proven to
read well vertically. Keep the left rail on `ancient-of-days.jpg` (and its
rotation). Both rails must show recognizable art at xl and 2xl widths. If you
want to keep Creation of Adam in the design, use it only as an optional wide top
banner above the title where its landscape orientation fits, not in a side rail.
Verify both rails render real art by screenshot at 1440 and 1920 widths.

## 6. Clarify the Worldviews section and fix the broken Add

File: `src/components/WorldviewCards.tsx`.

Two problems:
- Selecting a template (for example Exclusivist or Universalist) and pressing Add
  does nothing, because `handleAdd` returns early when the name field is empty.
  Fix: when the name is blank, default the new worldview's name to the selected
  template's label (for example "Exclusivist"), so Add always works. Still trim
  and use a typed name when present.
- The section is unclear about what it does. Add a one-line helper above the
  controls explaining that a worldview is a possible state of the world (a god or
  a secular reality) that becomes both a column you might be in and an action you
  might wager on, and that adding one expands the decision matrix. Keep it brief
  and concrete.

## 7. Global text size up about 25 percent

Files: `src/app/globals.css` and/or `src/app/layout.tsx`.

The interface text is too small. Increase the global scale by about 25 percent.
Prefer a robust approach: set a base scale that affects the whole app (for
example a `zoom: 1.25` on the app root, or raise the root rem and convert the
worst offending fixed `text-[10px]` and `text-[11px]` to scale). Whatever method
you pick, verify the layout still holds at common widths (1280, 1440, 1920) and
on a narrow mobile width, with no clipped panels or overlap, and that the divine
rails still sit in the gutters and do not cover console text. Do not let the
header overlap content.

## 8. Verify the four rule descriptions are accurate

File: `src/components/DecisionRulesPanel.tsx` and `src/lib/glossary.ts`.

Confirm the question text, the "why" text, and the per-rule when-note for each of
expected utility, statewise dominance, maximin, and minimax regret are accurate
decision-theory descriptions. Specifically:
- Expected utility: maximize the probability-weighted average payoff. Correct as
  is, but confirm.
- Statewise (weak) dominance: at least as good in every state and strictly better
  in at least one. Confirm the panel does not call it strict dominance.
- Maximin: choose the action whose worst-case outcome is best. Confirm the
  possibility-filtered variant copy matches what the engine does (worst case over
  states with positive credence only).
- Minimax regret: minimize the maximum regret, where regret in a state is the
  best payoff any action gets in that state minus this action's payoff. Confirm
  the glossary definition states the regret construction correctly.
Fix any wording that is loose or wrong; keep them short.

## Acceptance criteria (verify each in the real UI with real interaction)

1. In the tour, every mini-matrix shows the per-state credence, and step 3 has a
   draggable slider that changes the credence and updates the verdict live; the
   displayed expected-utility numbers are consistent with the shown credences.
2. Step 2 no longer refers to "the next step"; its point stands on its own.
3. The not-advice / prudential-argument copy is gone from the chip, the tour, and
   the limits panel, replaced with neutral accurate text.
4. A real pointer-drag on any credence slider changes the value continuously; the
   thumb is comfortably grabbable.
5. Both divine rails show recognizable art at 1440 and 1920; neither is blank.
6. Selecting a template and pressing Add with an empty name adds a worldview named
   after the template; the worldview helper line is present.
7. Global text is about 25 percent larger with no broken layout at 1280, 1440,
   1920, and a narrow mobile width.
8. The four rule descriptions are accurate.
9. `npm test` green; `npm run build` with `GITHUB_PAGES=true` produces a working
   static export.
