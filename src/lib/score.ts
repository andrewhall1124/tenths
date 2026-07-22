// A score is always 0.0–10.0 with exactly one decimal. The decimal is the brand.

export const MIN_SCORE = 0;
export const MAX_SCORE = 10;

/** Clamp and round to one decimal. */
export function normalizeScore(n: number): number {
  const clamped = Math.min(MAX_SCORE, Math.max(MIN_SCORE, n));
  return Math.round(clamped * 10) / 10;
}

/** Always render one decimal: 8 -> "8.0". */
export function formatScore(n: number): string {
  return normalizeScore(n).toFixed(1);
}

/**
 * HSL color on a red -> amber -> green ramp as the score climbs 0 -> 10.
 * Returns a CSS color string.
 */
export function scoreColor(n: number): string {
  const s = normalizeScore(n);
  const hue = (s / MAX_SCORE) * 130; // 0 = red, 130 = green
  return `hsl(${hue} 75% 45%)`;
}
