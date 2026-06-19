"use client";
import { X } from "lucide-react";
import { getAllGlossaryEntries } from "@/lib/glossary";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LimitsPanel({ open, onClose }: Props) {
  if (!open) return null;

  const glossaryEntries = getAllGlossaryEntries();

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
              What this is
            </h3>
            <p>
              This tool models one prudential argument (Pascal{"'"}s Wager and its many-gods generalization)
              as a decision matrix. It is not theology, not philosophy of religion, and not advice about
              what to believe or how to live.
            </p>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              Worldview labels are coarse
            </h3>
            <p>
              Real theological positions are finer than any label here (exclusivist vs. universalist
              Christianity, election, divine hiddenness, the professor{"'"}s god). How you partition
              worldviews can change the result. The tool warns where partition sensitivity bites.
            </p>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              Utility is contestable
            </h3>
            <p>
              Utilities are entered by hand and assumed cardinally comparable across worldviews.
              That comparability is itself contested. Expected utility is invariant only under
              positive affine rescaling: multiplying all payoffs by a positive constant and
              adding any constant does not change the decision.
            </p>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              Infinite utility is contested
            </h3>
            <p>
              The tool offers finite, infinite, bounded, and lexicographic modes so you can see how
              the conclusion depends on whether infinite payoffs are admitted, rather than asserting
              one view. St. Petersburg-style worries apply; Bartha{"'"}s utility-ratio repair is one
              proposed resolution.
            </p>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              What the model leaves out
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-cp-yellow font-semibold text-xs">Voluntariness.</span>{" "}
                You may not be able to simply choose belief by an act of will. Pascal{"'"}s own
                reply is to act into belief: attend, practise, let conviction follow. The matrix
                models actions (ways of living), not direct control over inner states.
              </div>
              <div>
                <span className="text-cp-yellow font-semibold text-xs">Sincerity and deception.</span>{" "}
                If what is rewarded is sincere faith, a wager adopted from self-interest may not
                produce the rewarded state at all. This also undercuts the mixed-strategy move:
                randomizing over worldviews is unlikely to produce the sincere belief any deity
                is said to reward.
              </div>
              <div>
                <span className="text-cp-yellow font-semibold text-xs">Prudential basis.</span>{" "}
                Whether prudence is an appropriate basis for religious commitment at all, and
                whether a good God would reward wager-style belief, are live philosophical
                questions the matrix cannot represent.
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              Open objections not resolved here
            </h3>
            <ul className="list-none space-y-1 mt-1">
              <li className="before:content-['//'] before:text-cp-cyan/40 before:mr-2">
                Many gods: rival exclusive deities with infinite rewards do not simply cancel; the verdict
                becomes undefined, incomparable, or a tie depending on the matrix
              </li>
              <li className="before:content-['//'] before:text-cp-cyan/40 before:mr-2">
                Mixed strategies: if the infinite reward attaches to sincere belief, any act with a positive
                probability of producing that state also scores infinity
              </li>
              <li className="before:content-['//'] before:text-cp-cyan/40 before:mr-2">
                Infinite utility coherence: St. Petersburg-style worries, bounded vs. unbounded utility
              </li>
              <li className="before:content-['//'] before:text-cp-cyan/40 before:mr-2">
                The zero-credence escape: an agent assigning exactly zero credence gets finite expectation,
                but whether exactly zero is rationally permissible is disputed
              </li>
              <li className="before:content-['//'] before:text-cp-cyan/40 before:mr-2">Imprecise probabilities and evidential vs. causal decision theory</li>
            </ul>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              Glossary
            </h3>
            <div className="space-y-2 mt-2">
              {glossaryEntries.map((entry) => (
                <div key={entry.term} className="text-xs">
                  <span className="text-cp-cyan font-semibold">{entry.term}:</span>{" "}
                  <span className="text-cp-text-dim">{entry.gloss}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-cp-cyan font-rajdhani font-semibold uppercase tracking-wider text-xs mb-1">
              Further reading
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
