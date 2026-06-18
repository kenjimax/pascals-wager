"use client";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LimitsPanel({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="cp-panel relative z-10 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="cp-panel-header">
          <span>About This Model</span>
          <button onClick={onClose} className="cp-btn p-1" aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <div className="cp-panel-body space-y-4 text-sm text-cp-text-dim leading-relaxed">
          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              What This Is
            </h3>
            <p>
              This tool models one prudential argument (Pascal{"'"}s Wager and its many-gods generalization)
              as a decision matrix. It is not theology, not philosophy of religion, and not advice about
              what to believe or how to live.
            </p>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              Worldview Labels Are Coarse
            </h3>
            <p>
              Real theological positions are finer than any label here (exclusivist vs. universalist
              Christianity, election, divine hiddenness, the professor{"'"}s god). How you partition
              worldviews can change the result. The tool warns where partition sensitivity bites.
            </p>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              Utility Is Contestable
            </h3>
            <p>
              Utilities are entered by hand and assumed cardinally comparable across worldviews.
              That comparability is itself contested. Expected utility is invariant only under
              positive affine rescaling.
            </p>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              Infinite Utility Is Contested
            </h3>
            <p>
              The tool offers finite, infinite, bounded, and lexicographic modes so you can see how
              the conclusion depends on whether infinite payoffs are admitted, rather than asserting
              one view.
            </p>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              Belief May Not Be Voluntary
            </h3>
            <p>
              The model recommends a practice or way of living, not an act of will. Sincerity,
              grace, and election are not modeled.
            </p>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              Open Objections Not Resolved Here
            </h3>
            <ul className="list-none space-y-1 mt-1">
              <li className="before:content-['//'] before:text-cp-cyan/40 before:mr-2">Mixed strategies (randomizing over worldviews)</li>
              <li className="before:content-['//'] before:text-cp-cyan/40 before:mr-2">The many-gods objection (multiple infinite rewards cancel)</li>
              <li className="before:content-['//'] before:text-cp-cyan/40 before:mr-2">Bounded vs. unbounded utility</li>
              <li className="before:content-['//'] before:text-cp-cyan/40 before:mr-2">Imprecise probabilities</li>
              <li className="before:content-['//'] before:text-cp-cyan/40 before:mr-2">Evidential vs. causal decision theory</li>
            </ul>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              Further Reading
            </h3>
            <ul className="list-none space-y-1 mt-1 text-cp-text">
              <li className="before:content-['>>'] before:text-cp-cyan/40 before:mr-2">
                Stanford Encyclopedia of Philosophy: {"\""}Pascal{"'"}s Wager{"\""}
              </li>
              <li className="before:content-['>>'] before:text-cp-cyan/40 before:mr-2">
                Hajek, A. {"\""}Waging War on Pascal{"'"}s Wager{"\""}. Philosophical Review, 2003.
              </li>
              <li className="before:content-['>>'] before:text-cp-cyan/40 before:mr-2">
                Hajek, A. {"\""}Pascal{"'"}s Wager{"\""}. The Stanford Encyclopedia of Philosophy.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
