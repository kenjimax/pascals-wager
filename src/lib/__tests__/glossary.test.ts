import { describe, it, expect } from "vitest";
import {
  getGlossaryEntry,
  getAllGlossaryEntries,
  getInlineGlossaryKeys,
  GLOSSARY,
} from "../glossary";

describe("Glossary", () => {
  it("returns an entry by key", () => {
    const entry = getGlossaryEntry("credence");
    expect(entry).toBeDefined();
    expect(entry!.term).toBe("Credence");
    expect(entry!.gloss.length).toBeGreaterThan(10);
    expect(entry!.inline).toBe(true);
  });

  it("returns undefined for unknown key", () => {
    expect(getGlossaryEntry("nonexistent")).toBeUndefined();
  });

  it("getAllGlossaryEntries returns all entries", () => {
    const entries = getAllGlossaryEntries();
    expect(entries.length).toBe(Object.keys(GLOSSARY).length);
    expect(entries.length).toBeGreaterThanOrEqual(14);
  });

  it("getInlineGlossaryKeys returns exactly the 8 inline terms", () => {
    const keys = getInlineGlossaryKeys();
    expect(keys.length).toBe(8);
    expect(keys).toContain("credence");
    expect(keys).toContain("expected_utility");
    expect(keys).toContain("statewise_dominance");
    expect(keys).toContain("maximin");
    expect(keys).toContain("minimax_regret");
    expect(keys).toContain("lexicographic_tiebreak");
    expect(keys).toContain("possibility_filtered");
    expect(keys).toContain("break_even_interval");
  });

  it("non-inline terms are present but not in inline set", () => {
    const keys = getInlineGlossaryKeys();
    expect(keys).not.toContain("affine_rescaling");
    expect(keys).not.toContain("partition_sensitivity");
    expect(keys).not.toContain("extended_reals");
    expect(keys).not.toContain("exclusivist");
    expect(keys).not.toContain("universalist");
    expect(keys).not.toContain("professors_god");
    expect(getGlossaryEntry("affine_rescaling")).toBeDefined();
    expect(getGlossaryEntry("professors_god")).toBeDefined();
  });

  it("every entry has a non-empty term and gloss", () => {
    for (const entry of getAllGlossaryEntries()) {
      expect(entry.term.length).toBeGreaterThan(0);
      expect(entry.gloss.length).toBeGreaterThan(0);
    }
  });
});
