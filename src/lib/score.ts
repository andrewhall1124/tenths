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
 * Monochrome brand: the numeral is always crisp white. Higher scores read
 * as "brighter" only through the surrounding UI, never through hue.
 * Returns a CSS color string.
 */
export function scoreColor(_n?: number): string {
  return "#ffffff";
}
