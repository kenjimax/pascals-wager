"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  type ScenarioState, type Worldview, type PayoffCell, type ExtendedReal,
  type TheologyTemplate,
  FINITE, POS_INF, NEG_INF,
  computeFullDecision, type DecisionResult,
} from "./wager";
import { PRESETS } from "./presets";
import { saveToLocalStorage, loadFromLocalStorage, loadFromURL } from "./state";

export interface UndoEntry {
  state: ScenarioState;
  activePresetId: string | null;
  label: string;
}

function cloneState(s: ScenarioState): ScenarioState {
  return JSON.parse(JSON.stringify(s));
}

export function useWagerState() {
  const [state, setStateRaw] = useState<ScenarioState>(() => PRESETS[0].state);
  // The preset the current scenario was last loaded from, so the UI can name
  // the active scenario instead of a generic placeholder. Null means the state
  // came from a share link or a manual build, i.e. a custom scenario.
  const [activePresetId, setActivePresetId] = useState<string | null>(PRESETS[0].id);
  // Derive the decision result synchronously from state. Computing it in an
  // effect (the previous design) left result one render behind state, so on a
  // preset load that changed the worldview count, child components received a
  // new payoff matrix alongside a stale, differently-sized probability vector
  // and indexed out of bounds. useMemo keeps result and state consistent in the
  // same render, which removes that whole class of stale-prop crashes.
  const result = useMemo<DecisionResult>(() => computeFullDecision(state), [state]);
  const undoStack = useRef<UndoEntry[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const fromURL = loadFromURL();
    if (fromURL) {
      setStateRaw(fromURL);
      setActivePresetId(null);
      return;
    }
    const fromLS = loadFromLocalStorage();
    if (fromLS) {
      setStateRaw(fromLS);
      setActivePresetId(null);
      return;
    }
  }, []);

  useEffect(() => {
    saveToLocalStorage(state);
  }, [state]);

  const pushUndo = useCallback((label: string) => {
    undoStack.current.push({ state: cloneState(state), activePresetId, label });
    if (undoStack.current.length > 50) undoStack.current.shift();
  }, [state, activePresetId]);

  const setState = useCallback((next: ScenarioState, undoLabel?: string) => {
    if (undoLabel) pushUndo(undoLabel);
    setStateRaw(next);
  }, [pushUndo]);

  const undo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (entry) {
      setStateRaw(entry.state);
      setActivePresetId(entry.activePresetId);
    }
  }, []);

  const canUndo = undoStack.current.length > 0;

  const loadPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      pushUndo("load preset");
      setStateRaw(cloneState(preset.state));
      setActivePresetId(preset.id);
    }
  }, [pushUndo]);

  const addWorldview = useCallback((name: string, template: TheologyTemplate) => {
    pushUndo("add worldview");
    const newState = cloneState(state);
    const id = `wv_${Date.now()}`;
    const newWv: Worldview = { id, name, excluded: false, rawWeight: 10, template };
    newState.worldviews.push(newWv);

    const n = newState.worldviews.length;
    const oldN = n - 1;

    for (let a = 0; a < oldN; a++) {
      const colPayoff = getDefaultPayoff(newState.worldviews[n - 1].template, false, newState.worldviews[a].template);
      newState.payoffMatrix[a].push({ value: colPayoff });
    }

    const newRow: PayoffCell[] = [];
    for (let s = 0; s < n; s++) {
      if (s === n - 1) {
        newRow.push({ value: getDefaultPayoff(template, true) });
      } else {
        newRow.push({ value: getDefaultPayoff(newState.worldviews[s].template, false, template) });
      }
    }
    newState.payoffMatrix.push(newRow);

    setStateRaw(newState);
  }, [state, pushUndo]);

  const removeWorldview = useCallback((idx: number) => {
    if (state.worldviews.length <= 2) return;
    pushUndo("remove worldview");
    const newState = cloneState(state);
    newState.worldviews.splice(idx, 1);
    newState.payoffMatrix.splice(idx, 1);
    for (const row of newState.payoffMatrix) {
      row.splice(idx, 1);
    }
    setStateRaw(newState);
  }, [state, pushUndo]);

  const updateWorldviewWeight = useCallback((idx: number, weight: number) => {
    const newState = cloneState(state);
    newState.worldviews[idx].rawWeight = weight;
    setStateRaw(newState);
  }, [state]);

  const toggleExclude = useCallback((idx: number) => {
    pushUndo("toggle exclude");
    const newState = cloneState(state);
    newState.worldviews[idx].excluded = !newState.worldviews[idx].excluded;
    if (newState.worldviews[idx].excluded) {
      newState.worldviews[idx].rawWeight = 0;
    }
    setStateRaw(newState);
  }, [state, pushUndo]);

  const updatePayoffCell = useCallback((row: number, col: number, value: ExtendedReal) => {
    const newState = cloneState(state);
    newState.payoffMatrix[row][col] = { value };
    setStateRaw(newState);
  }, [state]);

  const setLexicographic = useCallback((on: boolean) => {
    pushUndo("toggle lexicographic");
    const newState = cloneState(state);
    newState.lexicographicTiebreak = on;
    setStateRaw(newState);
  }, [state, pushUndo]);

  const setUtilityMode = useCallback((mode: ScenarioState["utilityMode"]) => {
    pushUndo("change utility mode");
    const newState = cloneState(state);
    newState.utilityMode = mode;
    setStateRaw(newState);
  }, [state, pushUndo]);

  const setPossibilityFiltered = useCallback((on: boolean) => {
    const newState = cloneState(state);
    newState.possibilityFilteredMaximin = on;
    setStateRaw(newState);
  }, [state]);

  const resetToPreset = useCallback(() => {
    pushUndo("reset to preset");
    setStateRaw(cloneState(PRESETS[0].state));
    setActivePresetId(PRESETS[0].id);
  }, [pushUndo]);

  return {
    state, result, activePresetId,
    setState, undo, canUndo,
    loadPreset, addWorldview, removeWorldview,
    updateWorldviewWeight, toggleExclude, updatePayoffCell,
    setLexicographic, setUtilityMode, setPossibilityFiltered,
    resetToPreset,
  };
}

function getDefaultPayoff(template: TheologyTemplate, isSelf: boolean, _otherTemplate?: TheologyTemplate): ExtendedReal {
  if (isSelf) {
    switch (template) {
      case "exclusivist": return POS_INF;
      case "universalist": return POS_INF;
      case "annihilationist": return POS_INF;
      case "professors_god": return FINITE(-1000);
      case "secular": return FINITE(500);
      case "custom": return FINITE(1000);
    }
  }
  switch (template) {
    case "exclusivist": return NEG_INF;
    case "universalist": return FINITE(500);
    case "annihilationist": return FINITE(0);
    case "professors_god": return POS_INF;
    case "secular": return FINITE(0);
    case "custom": return FINITE(-500);
  }
}
