import { describe, it, expect } from "vitest";
import { PRESETS, getPresetById } from "../presets";
import { encodeState, decodeState } from "../wager";

describe("New presets", () => {
  it("Pascal's original 2x2 preset exists", () => {
    const preset = getPresetById("pascal_original");
    expect(preset).toBeDefined();
    expect(preset!.name).toBe("Pascal's Original 2x2");
    expect(preset!.state.worldviews.length).toBe(2);
  });

  it("Diderot's imam preset exists", () => {
    const preset = getPresetById("diderots_imam");
    expect(preset).toBeDefined();
    expect(preset!.name).toBe("Diderot's Imam");
    expect(preset!.state.worldviews.length).toBe(3);
  });

  it("Pascal's original 2x2 round-trips through encode/decode", () => {
    const preset = getPresetById("pascal_original")!;
    const encoded = encodeState(preset.state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.worldviews.length).toBe(preset.state.worldviews.length);
    expect(decoded!.worldviews[0].name).toBe(preset.state.worldviews[0].name);
    expect(decoded!.worldviews[1].name).toBe(preset.state.worldviews[1].name);
    expect(decoded!.payoffMatrix[0][0].value.tag).toBe(
      preset.state.payoffMatrix[0][0].value.tag
    );
    expect(decoded!.utilityMode).toBe(preset.state.utilityMode);
  });

  it("Diderot's imam round-trips through encode/decode", () => {
    const preset = getPresetById("diderots_imam")!;
    const encoded = encodeState(preset.state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.worldviews.length).toBe(preset.state.worldviews.length);
    for (let i = 0; i < preset.state.worldviews.length; i++) {
      expect(decoded!.worldviews[i].name).toBe(preset.state.worldviews[i].name);
      expect(decoded!.worldviews[i].template).toBe(preset.state.worldviews[i].template);
    }
    const n = preset.state.worldviews.length;
    for (let a = 0; a < n; a++) {
      for (let s = 0; s < n; s++) {
        expect(decoded!.payoffMatrix[a][s].value.tag).toBe(
          preset.state.payoffMatrix[a][s].value.tag
        );
      }
    }
  });

  it("all presets have valid square payoff matrices", () => {
    for (const preset of PRESETS) {
      const n = preset.state.worldviews.length;
      expect(preset.state.payoffMatrix.length).toBe(n);
      for (const row of preset.state.payoffMatrix) {
        expect(row.length).toBe(n);
      }
    }
  });

  it("all presets round-trip through encode/decode", () => {
    for (const preset of PRESETS) {
      const encoded = encodeState(preset.state);
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.worldviews.length).toBe(preset.state.worldviews.length);
    }
  });
});
