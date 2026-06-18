# Pascal's Wager

A live, infinity-aware decision-theory instrument for exploring Pascal's Wager under your own
assumptions. You set which worldviews are live options, your credence in each, and the payoffs, and
the tool shows what several decision rules recommend, how the rules disagree, and how far your beliefs
can move before the conclusion changes.

It is a model of one prudential argument. It is not theology and not advice about what to believe.

## Credit

The original idea and prototype are by Daniel Eaton, who had thought about a "Pascal calculator" for a
decade and built a working version in about an hour. The original prototype is preserved in
`docs/original-prototype.html`. This project rebuilds it as a single-screen live instrument with an
honest treatment of infinities, multiple decision rules, exact sensitivity analysis, and a
production-grade interface.

## Build spec

`PLAN.md` is the authoritative build specification (reviewed cross-vendor before implementation).

## Stack

Next.js 14, TypeScript, Tailwind, augmented-ui, Tremor, Recharts. Entirely client-side. The decision
engine in `src/lib` is a pure, unit-tested module. Visual language matches the Lucy dashboard.
