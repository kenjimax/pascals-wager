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
              This tool computes a decision matrix over rival worldviews with extended-real payoffs
              (including infinities) and evaluates it under four decision rules: expected utility,
              statewise dominance, maximin, and minimax regret. It covers Pascal{"'"}s original wager
              and its many-gods generalization.
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
              Why 0.5 times infinity ties with infinity here, and what to do about it
            </h3>
            <p>
              In extended-real arithmetic (the default &quot;infinite&quot; mode), positive infinity is
              absorptive: any positive probability times infinity equals infinity, and infinity
              minus infinity is undefined. That is why two rival deities with different credences
              both produce infinite expected utility and tie, and why a coin-flip mixed strategy
              also scores infinity.
            </p>
            <p className="mt-2">
              Three serious repairs in the literature replace absorptive infinities with comparable
              values:
            </p>
            <div className="space-y-2 mt-2">
              <div>
                <span className="text-cp-yellow font-semibold text-xs">Relative utilities (Bartha 2007).</span>{" "}
                Replace raw payoffs with ratios against a base-point. The infinite
                reward maps to 1 (the apex), finite payoffs to their normalized position. Expected
                relative utility is a finite weighted sum, so it scales with credence.
              </div>
              <div>
                <span className="text-cp-yellow font-semibold text-xs">Limiting ratios (Jackson and Rogers 2019).</span>{" "}
                Model afterlife reward as a growing finite duration and take the limit of the ratio
                of expected values. The result is credence-sensitive (in their worked example, Islam
                wins at long horizons and atheism wins at short ones). This rests on a no-supertasks
                assumption whose failure readmits a &quot;super-worldview.&quot;
              </div>
              <div>
                <span className="text-cp-yellow font-semibold text-xs">Surreal numbers (Chen and Rubio 2020; Herzberg 2011 for hyperreals).</span>{" "}
                Represent salvation as w (omega), a specific infinite number. Then 0.5w is strictly
                less than w, w minus w is exactly zero, and expected utility is a polynomial in w
                that compares lexicographically. Mixed strategies become strictly dominated and
                many-gods resolves to the highest-credence deity.
              </div>
            </div>
            <p className="mt-2">
              All three converge on the same punchline: the wager{"'"}s verdict becomes
              credence-dependent. It is no longer the evidence-independent argument Pascal wanted.
            </p>
            <p className="mt-2">
              <span className="text-cp-yellow font-semibold text-xs">The swamping dilemma (Hajek 2003).</span>{" "}
              Once salvation is a specific infinite number (say w), a larger infinity (w squared)
              beats it regardless of credence. No reformulation both preserves &quot;the finite is
              annihilated before the infinite&quot; and yields distinguishable expectations. Select
              &quot;surreal (non-absorptive)&quot; mode and set one deity{"'"}s reward to a higher omega
              order to see this directly.
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
                becomes undefined, incomparable, or a tie depending on the matrix. One contested
                decision-theoretic response (Pasternack 2012) screens out trickster and ad-hoc
                deities without a stable choice-outcome relation before infinite utility is assigned.
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
              References
            </h3>
            <ul className="list-none space-y-1 mt-1 text-cp-text text-xs">
              <li className="before:content-['>>'] before:text-cp-cyan/40 before:mr-2">
                Pascal, B. <em>Pensees</em>, section 233.
              </li>
              <li className="before:content-['>>'] before:text-cp-cyan/40 before:mr-2">
                Hajek, A. &quot;Pascal{"'"}s Wager.&quot; <em>Stanford Encyclopedia of Philosophy</em>.
              </li>
              <li className="before:content-['>>'] before:text-cp-cyan/40 before:mr-2">
                Hajek, A. &quot;Waging War on Pascal{"'"}s Wager.&quot; <em>The Philosophical Review</em> 112 (2003): 27-56.
              </li>
              <li className="before:content-['>>'] before:text-cp-cyan/40 before:mr-2">
                Bartha, P. &quot;Taking Stock of Infinite Value: Pascal{"'"}s Wager and Relative Utilities.&quot; <em>Synthese</em> 154 (2007): 5-52.
              </li>
              <li className="before:content-['>>'] before:text-cp-cyan/40 before:mr-2">
                Jackson, E. and Rogers, A. &quot;Salvaging Pascal{"'"}s Wager.&quot; <em>Philosophia Christi</em> 21 (2019): 59-84.
              </li>
              <li className="before:content-['>>'] before:text-cp-cyan/40 before:mr-2">
                Chen, E. K. and Rubio, D. &quot;Surreal Decisions.&quot; <em>Philosophy and Phenomenological Research</em> 100 (2020): 54-74.
              </li>
              <li className="before:content-['>>'] before:text-cp-cyan/40 before:mr-2">
                Herzberg, F. &quot;Hyperreal Expected Utilities and Pascal{"'"}s Wager.&quot; (2011).
              </li>
              <li className="before:content-['>>'] before:text-cp-cyan/40 before:mr-2">
                Pasternack, L. &quot;The Many Gods Objection to Pascal{"'"}s Wager: A Decision Theoretic Response.&quot; <em>Philo</em> 15 (2012): 158-178.
              </li>
              <li className="before:content-['>>'] before:text-cp-cyan/40 before:mr-2">
                Wald, A. <em>Statistical Decision Functions</em> (1950). Savage, L. J. &quot;The Theory of Statistical Decision.&quot; <em>JASA</em> 46 (1951).
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
