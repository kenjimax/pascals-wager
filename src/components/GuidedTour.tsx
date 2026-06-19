"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import type { ScenarioState } from "@/lib/wager";
import { FINITE, POS_INF, computeFullDecision, erToString, normalizeProbabilities } from "@/lib/wager";
import type { DecisionResult } from "@/lib/wager";

interface Props {
  open: boolean;
  onClose: () => void;
  currentState: ScenarioState;
  onRestoreState: (state: ScenarioState) => void;
}

function cell(v: ScenarioState["payoffMatrix"][number][number]["value"]) {
  return { value: v };
}

function wv(id: string, name: string, weight: number, template: "exclusivist" | "secular" | "custom" = "custom", excluded = false) {
  return { id, name, excluded, rawWeight: weight, template } as ScenarioState["worldviews"][number];
}

const STEP_STATES: ScenarioState[] = [
  // Step 1: bare 2x2
  {
    worldviews: [
      wv("believe", "Believe", 50, "custom"),
      wv("not_believe", "Do not believe", 50, "custom"),
    ],
    payoffMatrix: [
      [cell(FINITE(1000)), cell(FINITE(0))],
      [cell(FINITE(0)), cell(FINITE(100))],
    ],
    utilityMode: "finite",
    lexicographicTiebreak: false,
    possibilityFilteredMaximin: true,
  },
  // Step 2: superdominance (no cost)
  {
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
  // Step 3: one infinite payoff
  {
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
  // Step 4: rival deity
  {
    worldviews: [
      wv("god_a", "Deity A", 30, "exclusivist"),
      wv("god_b", "Deity B", 30, "exclusivist"),
      wv("secular", "Secular", 40, "secular"),
    ],
    payoffMatrix: [
      [cell(POS_INF), cell(FINITE(-500)), cell(FINITE(-100))],
      [cell(FINITE(-500)), cell(POS_INF), cell(FINITE(-100))],
      [cell(FINITE(0)), cell(FINITE(0)), cell(FINITE(500))],
    ],
    utilityMode: "infinite",
    lexicographicTiebreak: false,
    possibilityFilteredMaximin: true,
  },
  // Step 5: hand-off (same as step 4, user sees the full console)
  {
    worldviews: [
      wv("god_a", "Deity A", 30, "exclusivist"),
      wv("god_b", "Deity B", 30, "exclusivist"),
      wv("secular", "Secular", 40, "secular"),
    ],
    payoffMatrix: [
      [cell(POS_INF), cell(FINITE(-500)), cell(FINITE(-100))],
      [cell(FINITE(-500)), cell(POS_INF), cell(FINITE(-100))],
      [cell(FINITE(0)), cell(FINITE(0)), cell(FINITE(500))],
    ],
    utilityMode: "infinite",
    lexicographicTiebreak: false,
    possibilityFilteredMaximin: true,
  },
];

function MiniMatrix({ state }: { state: ScenarioState }) {
  const result = computeFullDecision(state);
  const probs = normalizeProbabilities(state.worldviews);
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-[0.6875rem] font-mono border-collapse">
        <thead>
          <tr>
            <th className="p-1.5 text-left text-cp-text-dim border border-cp-cyan/10 bg-surface-1/50" />
            {state.worldviews.map((w, i) => (
              <th key={i} className="p-1.5 text-center text-cp-cyan border border-cp-cyan/10 bg-surface-1/50 font-normal">
                {w.name}
              </th>
            ))}
            <th className="p-1.5 text-center text-cp-yellow border border-cp-cyan/10 bg-surface-1/50 font-normal">
              EU
            </th>
          </tr>
          <tr>
            <td className="p-1 text-[0.625rem] text-cp-text-dim border border-cp-cyan/10 bg-surface-1/30 italic">
              P
            </td>
            {state.worldviews.map((_, i) => (
              <td key={i} className="p-1 text-center text-[0.625rem] text-cp-text-dim border border-cp-cyan/10 bg-surface-1/30">
                {(probs[i] * 100).toFixed(1)}%
              </td>
            ))}
            <td className="border border-cp-cyan/10 bg-surface-1/30" />
          </tr>
        </thead>
        <tbody>
          {state.worldviews.map((action, a) => (
            <tr key={a}>
              <td className="p-1.5 text-cp-green border border-cp-cyan/10 bg-surface-1/30 font-semibold">
                {action.name}
              </td>
              {state.payoffMatrix[a].map((c, s) => (
                <td
                  key={s}
                  className={`p-1.5 text-center border border-cp-cyan/10 ${
                    c.value.tag === "pos_inf"
                      ? "text-cp-green font-bold"
                      : c.value.tag === "neg_inf"
                        ? "text-cp-magenta font-bold"
                        : c.value.value < 0
                          ? "text-cp-magenta"
                          : "text-cp-text"
                  }`}
                >
                  {erToString(c.value)}
                </td>
              ))}
              <td className="p-1.5 text-center border border-cp-cyan/10 text-cp-yellow font-semibold">
                {erToString(result.euRanking.eus[a])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <HeadlineBox result={result} />
    </div>
  );
}

function HeadlineBox({ result }: { result: DecisionResult }) {
  const h = result.headline;
  let text: string;
  if (h.euUndefined) {
    text = "Expected utility is undefined for all actions.";
  } else if (h.euTied) {
    text = `Expected utility is tied at ${erToString(result.euRanking.eus[h.euOptimum[0]])} for multiple actions.`;
  } else if (h.pick) {
    text = `Expected utility favors: ${h.pick}`;
  } else {
    text = h.reason;
  }
  return (
    <div className="mt-2 p-2 border border-cp-cyan/15 bg-cp-cyan/5 text-[0.6875rem] text-cp-text">
      <span className="text-cp-cyan font-semibold font-rajdhani uppercase tracking-wider text-[0.625rem] mr-2">
        Verdict:
      </span>
      {text}
    </div>
  );
}

const STEP_CONTENT: { title: string; body: React.ReactNode }[] = [
  {
    title: "The question",
    body: (
      <>
        <p className="mb-2">
          Should you live as if God exists when you cannot be sure? Pascal framed this as a decision
          under uncertainty: you must choose how to live, and the consequences depend on something you
          cannot verify.
        </p>
        <p className="text-cp-text-dim">
          The simplest version is a 2x2 grid: two choices (believe or not) against two possible realities
          (God exists or does not). Each cell holds a payoff representing how well that combination turns out.
        </p>
      </>
    ),
  },
  {
    title: "The cheap version: superdominance, and its cost",
    body: (
      <>
        <p className="mb-2">
          Fill the grid so that believing is never worse and sometimes better than not believing.
          This is called statewise dominance: one action is at least as good in every possible state
          and strictly better in at least one.
        </p>
        <p className="mb-2">
          This holds only because belief is stipulated to cost nothing. In real life belief may carry
          costs: time, social friction, opportunity. Add even a small cost and dominance breaks, because
          believing becomes worse in the state where God does not exist.
        </p>
        <p className="text-cp-text-dim">
          The expected-utility argument (the one that uses an infinite payoff) would survive that cost,
          because any positive probability times infinity is still infinity. The contrast is the point:
          dominance is fragile in a way the expected-utility version is not.
        </p>
      </>
    ),
  },
  {
    title: "The famous version: one infinite payoff",
    body: (
      <>
        <p className="mb-2">
          In the simplified one-infinite-payoff model, flip the top-left cell to infinity: if God exists
          and you believe, the reward is infinite. The expected utility column now reads infinity for
          believing, regardless of how small the credence is, so long as it is positive.
        </p>
        <p className="mb-2">
          Drag the credence from 1% to 99% and notice the verdict does not change. In this model, any
          positive probability, however small, produces infinite expected utility.
        </p>
        <p className="text-cp-text-dim">
          This relies on three premises, each independently contestable: specific finite-vs-infinite
          utilities, strictly positive credence, and expected-utility maximization as the decision criterion.
          Once rival infinities or undefined infinite arithmetic enter (next step), the conclusion no
          longer follows automatically.
        </p>
      </>
    ),
  },
  {
    title: "The complication: a second god",
    body: (
      <>
        <p className="mb-2">
          Add a rival exclusive deity with its own infinite reward. Now two actions each score infinite
          expected utility, and the verdict becomes tied or undefined, depending on the matrix.
        </p>
        <p className="mb-2">
          The engine reports this honestly: the expected-utility verdict is a genuine tie (both actions
          score infinite expected utility), not a cancellation. The infinities do not simply cancel; they
          produce an indeterminate or tied comparison that expected utility alone cannot resolve.
        </p>
        <p className="text-cp-text-dim">
          This is the many-gods objection: the wager works only if one infinite reward is in play.
          When the space of possible deities expands, the other three decision rules (dominance, maximin,
          minimax regret) and the limits panel become relevant.
        </p>
      </>
    ),
  },
  {
    title: "The full console",
    body: (
      <>
        <p className="mb-2">
          The wager{"'"}s conclusion is conditional on a fragile set of assumptions: that infinite utility
          is coherent, that you commit to a probability, and that no rival infinite reward competes. Each
          assumption can be tested with this instrument.
        </p>
        <p className="mb-2">
          The full console lets you add worldviews, edit payoffs, try different decision rules, and run
          sensitivity analysis to see exactly where each conclusion breaks.
        </p>
        <p className="text-cp-text-dim">
          Adjust the worldviews, payoffs, and credences to see exactly where each conclusion holds and
          where it breaks.
        </p>
      </>
    ),
  },
];

const TOUR_KEY = "pw_tour_seen";

export function useTourState() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_KEY);
    if (!seen) {
      setOpen(true);
    }
    setChecked(true);
  }, []);

  const openTour = useCallback(() => setOpen(true), []);
  const closeTour = useCallback(() => {
    setOpen(false);
    localStorage.setItem(TOUR_KEY, "1");
  }, []);

  return { tourOpen: open, openTour, closeTour, tourChecked: checked };
}

function Step3Slider({ onChange, value }: { onChange: (v: number) => void; value: number }) {
  return (
    <div className="mt-3 mb-1">
      <label className="flex items-center gap-2 text-[0.6875rem] font-mono text-cp-text-dim">
        <span className="whitespace-nowrap">God exists credence:</span>
        <input
          type="range"
          min="1"
          max="99"
          step="1"
          value={value}
          onChange={e => onChange(parseInt(e.target.value, 10))}
          className="flex-1"
          aria-label="God exists credence for step 3"
        />
        <span className="text-cp-cyan w-10 text-right">{value}%</span>
      </label>
    </div>
  );
}

export function GuidedTour({ open, onClose, currentState, onRestoreState }: Props) {
  const [step, setStep] = useState(0);
  const [step3Credence, setStep3Credence] = useState(1);
  const snapshotRef = useRef<ScenarioState | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      snapshotRef.current = JSON.parse(JSON.stringify(currentState));
      previousFocusRef.current = document.activeElement as HTMLElement;
      setStep(0);
    }
  }, [open, currentState]);

  const handleClose = useCallback(() => {
    if (snapshotRef.current) {
      onRestoreState(snapshotRef.current);
    }
    onClose();
    localStorage.setItem(TOUR_KEY, "1");
    setTimeout(() => previousFocusRef.current?.focus(), 0);
  }, [onClose, onRestoreState]);

  const handleFinish = handleClose;

  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, handleClose]);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  if (!open) return null;

  const isLast = step === STEP_CONTENT.length - 1;
  const content = STEP_CONTENT[step];

  const stepState = step === 2
    ? {
        ...STEP_STATES[2],
        worldviews: [
          wv("god_exists", "God exists", step3Credence, "exclusivist"),
          wv("god_absent", "God does not exist", 100 - step3Credence, "secular"),
        ],
      }
    : STEP_STATES[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={handleClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Guided tour, step ${step + 1} of ${STEP_CONTENT.length}: ${content.title}`}
        tabIndex={-1}
        className={`cp-panel relative z-10 max-w-2xl w-full max-h-[85vh] overflow-y-auto outline-none ${
          !prefersReducedMotion ? "animate-[fadeIn_0.2s_ease-out]" : ""
        }`}
      >
        {/* Header */}
        <div className="cp-panel-header">
          <span className="flex items-center gap-2">
            <span className="text-cp-text-dim text-[0.625rem] font-mono">
              {step + 1}/{STEP_CONTENT.length}
            </span>
            {content.title}
          </span>
          <button
            onClick={handleClose}
            className="cp-btn p-1"
            aria-label="Close tour"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="cp-panel-body">
          <div className="text-sm text-cp-text leading-relaxed">
            {content.body}
          </div>

          {step === 2 && (
            <Step3Slider value={step3Credence} onChange={setStep3Credence} />
          )}

          {step < STEP_CONTENT.length - 1 && (
            <MiniMatrix state={stepState} />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-cp-cyan/10">
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="cp-btn text-xs flex items-center gap-1"
                >
                  <ChevronLeft size={12} />
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="cp-btn text-xs text-cp-text-dim"
              >
                Skip
              </button>
              {isLast ? (
                <button
                  onClick={handleFinish}
                  className="cp-btn cp-btn-green text-xs flex items-center gap-1"
                >
                  Open full console
                  <ChevronRight size={12} />
                </button>
              ) : (
                <button
                  onClick={() => setStep(step + 1)}
                  className="cp-btn text-xs flex items-center gap-1"
                >
                  Next
                  <ChevronRight size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mt-3" aria-hidden="true">
            {STEP_CONTENT.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? "bg-cp-cyan" : "bg-cp-cyan/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
