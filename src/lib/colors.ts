// Worldview color palette, indexed by worldview (equivalently, by the action of
// wagering on that worldview). This is the single source of truth for "which
// worldview is this color", used by the probability simplex shading and legend
// and by the decision-rule verdicts, so a given color always means the same
// worldview across the whole instrument.
export const WORLDVIEW_COLORS = [
  "#00f0ff", // cyan
  "#ff003c", // red
  "#fcee09", // yellow
  "#39ff14", // green
  "#ff6b35", // orange
  "#7b68ee", // violet
];

export function worldviewColor(index: number): string {
  if (index >= 0 && index < WORLDVIEW_COLORS.length) return WORLDVIEW_COLORS[index];
  // Beyond the curated palette (a user can add unlimited worldviews: addWorldview
  // has no cap) we generate evenly spaced hues with the golden angle so extra
  // worldviews stay visually distinct from each other instead of wrapping back
  // onto a curated color. This preserves the invariant that a color identifies
  // one worldview. High saturation/lightness keeps the neon look.
  const hue = (index * 137.508) % 360;
  return `hsl(${hue.toFixed(1)}, 85%, 62%)`;
}
