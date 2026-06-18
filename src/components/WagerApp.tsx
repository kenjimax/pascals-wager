"use client";
import { useState, useCallback } from "react";
import { Share2, RotateCcw, Undo2, ChevronDown, ChevronRight } from "lucide-react";
import { useWagerState } from "@/lib/hooks";
import { generateShareURL } from "@/lib/state";
import { GlitchTitle } from "./GlitchTitle";
import { DisclaimerChip } from "./DisclaimerChip";
import { LimitsPanel } from "./LimitsPanel";
import { PresetSelector } from "./PresetSelector";
import { WorldviewCards } from "./WorldviewCards";
import { CredenceEditor } from "./CredenceEditor";
import { PayoffMatrix } from "./PayoffMatrix";
import { ResultCard } from "./ResultCard";
import { DecisionRulesPanel } from "./DecisionRulesPanel";
import { HeatmapViz } from "./HeatmapViz";
import { EUBarsViz } from "./EUBarsViz";
import { SensitivityViz } from "./SensitivityViz";
import { SimplexViz } from "./SimplexViz";

export function WagerApp() {
  const {
    state, result,
    undo, canUndo,
    loadPreset, addWorldview, removeWorldview,
    updateWorldviewWeight, toggleExclude, updatePayoffCell,
    setLexicographic, setUtilityMode, setPossibilityFiltered,
    resetToPreset,
  } = useWagerState();

  const [limitsOpen, setLimitsOpen] = useState(false);
  const [matrixExpanded, setMatrixExpanded] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [mobileTab, setMobileTab] = useState<"inputs" | "result" | "detail">("inputs");
  const [sensTab, setSensTab] = useState<"credence" | "payoff">("credence");

  const handleShare = useCallback(() => {
    const url = generateShareURL(state);
    navigator.clipboard.writeText(url).then(() => {
      setShareMsg("Link copied!");
      setTimeout(() => setShareMsg(""), 2000);
    }).catch(() => {
      setShareMsg("Could not copy");
      setTimeout(() => setShareMsg(""), 2000);
    });
  }, [state]);

  const modeOptions: { value: typeof state.utilityMode; label: string }[] = [
    { value: "finite", label: "Finite" },
    { value: "infinite", label: "Infinite" },
    { value: "bounded", label: "Bounded" },
    { value: "lexicographic", label: "Lexicographic" },
  ];

  // Mobile tab switcher
  const MobileNav = () => (
    <div className="md:hidden flex border-b border-cp-cyan/10 mb-4">
      {(["inputs", "result", "detail"] as const).map(tab => (
        <button
          key={tab}
          onClick={() => setMobileTab(tab)}
          className={`flex-1 py-2 text-xs font-rajdhani uppercase tracking-wider transition-colors
            ${mobileTab === tab ? "text-cp-cyan border-b-2 border-cp-cyan" : "text-cp-text-dim"}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );

  const InputsSection = () => (
    <div className="space-y-4">
      {/* Worldviews */}
      <div className="cp-panel">
        <div className="cp-panel-header">
          <span>Worldviews</span>
        </div>
        <div className="cp-panel-body">
          <WorldviewCards
            worldviews={state.worldviews}
            onAdd={addWorldview}
            onRemove={removeWorldview}
            onToggleExclude={toggleExclude}
          />
        </div>
      </div>

      {/* Credences */}
      <div className="cp-panel">
        <div className="cp-panel-header">
          <span>Credences</span>
        </div>
        <div className="cp-panel-body">
          <CredenceEditor
            worldviews={state.worldviews}
            onUpdateWeight={updateWorldviewWeight}
            onToggleExclude={toggleExclude}
          />
        </div>
      </div>

      {/* Advanced: Payoff Matrix */}
      <div className="cp-panel">
        <button
          className="cp-panel-header w-full cursor-pointer"
          onClick={() => setMatrixExpanded(!matrixExpanded)}
          aria-expanded={matrixExpanded}
          aria-controls="payoff-matrix-content"
        >
          <span className="flex items-center gap-2">
            {matrixExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Advanced: Edit Full Payoff Matrix
          </span>
        </button>
        {matrixExpanded && (
          <div className="cp-panel-body" id="payoff-matrix-content">
            <PayoffMatrix
              worldviews={state.worldviews}
              matrix={state.payoffMatrix}
              onUpdateCell={updatePayoffCell}
            />
          </div>
        )}
      </div>
    </div>
  );

  const ResultSection = () => {
    if (!result) return <div className="text-cp-text-dim text-xs">Computing...</div>;
    return (
      <div className="space-y-4">
        <ResultCard result={result} />
        <DecisionRulesPanel
          result={result}
          worldviews={state.worldviews}
          lexicographicEnabled={state.lexicographicTiebreak}
          onToggleLexicographic={setLexicographic}
          possibilityFiltered={state.possibilityFilteredMaximin}
          onTogglePossibilityFiltered={setPossibilityFiltered}
        />
      </div>
    );
  };

  const DetailSection = () => {
    if (!result) return null;
    return (
      <div className="space-y-4">
        {/* EU Bars */}
        <div className="cp-panel">
          <div className="cp-panel-header"><span>Expected Utility Comparison</span></div>
          <div className="cp-panel-body">
            <EUBarsViz euRanking={result.euRanking} worldviews={state.worldviews} />
          </div>
        </div>

        {/* Heatmap */}
        <div className="cp-panel">
          <div className="cp-panel-header"><span>Payoff Matrix Heatmap</span></div>
          <div className="cp-panel-body">
            <HeatmapViz worldviews={state.worldviews} matrix={state.payoffMatrix} />
          </div>
        </div>

        {/* Sensitivity */}
        <div className="cp-panel">
          <div className="cp-panel-header">
            <span>Sensitivity Analysis</span>
            <div className="flex gap-1">
              <button
                onClick={() => setSensTab("credence")}
                className={`text-[10px] font-mono px-2 py-0.5 border transition-colors ${
                  sensTab === "credence" ? "border-cp-cyan/40 text-cp-cyan bg-cp-cyan/10" : "border-cp-border text-cp-text-dim"
                }`}
              >
                Credence
              </button>
              <button
                onClick={() => setSensTab("payoff")}
                className={`text-[10px] font-mono px-2 py-0.5 border transition-colors ${
                  sensTab === "payoff" ? "border-cp-cyan/40 text-cp-cyan bg-cp-cyan/10" : "border-cp-border text-cp-text-dim"
                }`}
              >
                Payoff
              </button>
            </div>
          </div>
          <div className="cp-panel-body">
            <SensitivityViz
              worldviews={state.worldviews}
              probs={result.probs}
              matrix={state.payoffMatrix}
              tab={sensTab}
            />
          </div>
        </div>

        {/* Simplex */}
        {(state.worldviews.length === 2 || state.worldviews.length === 3) && (
          <div className="cp-panel">
            <div className="cp-panel-header"><span>Probability {state.worldviews.length === 2 ? "Line" : "Simplex"}</span></div>
            <div className="cp-panel-body">
              <SimplexViz
                worldviews={state.worldviews}
                probs={result.probs}
                matrix={state.payoffMatrix}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen relative">
      {/* Background layers */}
      <div className="circuit-bg" />
      <div className="scanline-overlay" aria-hidden="true" />
      <div className="scanline-bar" aria-hidden="true" />

      {/* Header / HUD bar */}
      <header className="sticky top-0 z-40 bg-surface-0/90 backdrop-blur border-b border-cp-cyan/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <GlitchTitle text="PASCAL'S WAGER" />

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <PresetSelector onSelect={loadPreset} />

              <select
                value={state.utilityMode}
                onChange={e => setUtilityMode(e.target.value as typeof state.utilityMode)}
                className="cp-input text-xs"
                aria-label="Utility mode"
              >
                {modeOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <button onClick={handleShare} className="cp-btn text-xs flex items-center gap-1" aria-label="Share">
                <Share2 size={12} />
                {shareMsg || "Share"}
              </button>

              <button
                onClick={undo}
                disabled={!canUndo}
                className="cp-btn text-xs flex items-center gap-1 disabled:opacity-30"
                aria-label="Undo"
              >
                <Undo2 size={12} />
              </button>

              <button onClick={resetToPreset} className="cp-btn cp-btn-magenta text-xs flex items-center gap-1" aria-label="Reset">
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          <div className="mt-2">
            <DisclaimerChip onClick={() => setLimitsOpen(true)} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        <MobileNav />

        {/* Desktop: two-column layout */}
        <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6">
          <div className="space-y-4">
            <InputsSection />
          </div>
          <div className="space-y-4">
            <ResultSection />
            <DetailSection />
          </div>
        </div>

        {/* Mobile: tabbed layout */}
        <div className="md:hidden">
          {mobileTab === "inputs" && <InputsSection />}
          {mobileTab === "result" && <ResultSection />}
          {mobileTab === "detail" && <DetailSection />}
        </div>
      </main>

      <LimitsPanel open={limitsOpen} onClose={() => setLimitsOpen(false)} />
    </div>
  );
}
