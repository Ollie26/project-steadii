import type { BGRangeLabel, GlucoseUnit, GlucoseTrend } from "@/types";

// --- Range classification ---

/**
 * Classify a BG value relative to target range.
 * Severe thresholds: <54 mg/dL severe-low, >250 mg/dL severe-high.
 */
export function getBGColor(
  value: number,
  targetLow: number,
  targetHigh: number,
): BGRangeLabel {
  if (value < 54) return "severe-low";
  if (value < targetLow) return "low";
  if (value > 250) return "severe-high";
  if (value > targetHigh) return "high";
  return "in-range";
}

/**
 * Return a hex colour string for a BG value.
 */
export function getBGColorHex(
  value: number,
  targetLow: number,
  targetHigh: number,
): string {
  const label = getBGColor(value, targetLow, targetHigh);
  const colors: Record<BGRangeLabel, string> = {
    "in-range": "#4ECDC4",
    high: "#F4A261",
    low: "#E76F6F",
    "severe-high": "#E07B39",
    "severe-low": "#D14545",
  };
  return colors[label];
}

// --- Display formatting ---

/**
 * Format a BG value for display.
 * mg/dL values are shown as integers; mmol/L with 1 decimal place.
 */
export function formatBG(value: number, unit: GlucoseUnit = "mgdl"): string {
  if (unit === "mmol") {
    return value.toFixed(1);
  }
  return Math.round(value).toString();
}

// --- Trend helpers ---

const trendLabels: Record<GlucoseTrend, string> = {
  doubleUp: "Rising quickly",
  singleUp: "Rising",
  fortyFiveUp: "Rising slightly",
  flat: "Stable",
  fortyFiveDown: "Falling slightly",
  singleDown: "Falling",
  doubleDown: "Falling quickly",
  notComputable: "Unknown",
  rateOutOfRange: "Out of range",
};

/** Human-readable label for a Dexcom trend code. */
export function getTrendLabel(trend: GlucoseTrend): string {
  return trendLabels[trend] ?? "Unknown";
}

const trendArrows: Record<GlucoseTrend, string> = {
  doubleUp: "\u21C8",       // ⇈
  singleUp: "\u2191",       // ↑
  fortyFiveUp: "\u2197",    // ↗
  flat: "\u2192",            // →
  fortyFiveDown: "\u2198",  // ↘
  singleDown: "\u2193",     // ↓
  doubleDown: "\u21CA",     // ⇊
  notComputable: "?",
  rateOutOfRange: "-",
};

/** Arrow character for a Dexcom trend code. */
export function getTrendArrow(trend: GlucoseTrend): string {
  return trendArrows[trend] ?? "?";
}

// --- Simple classification ---

/**
 * Classify a reading as "low", "in-range", or "high".
 */
export function classifyReading(
  value: number,
  targetLow: number,
  targetHigh: number,
): "low" | "in-range" | "high" {
  if (value < targetLow) return "low";
  if (value > targetHigh) return "high";
  return "in-range";
}

// --- A1C estimation ---

/**
 * Estimate A1C from average blood glucose (mg/dL).
 * Uses the ADAG formula: A1C = (avgBG + 46.7) / 28.7
 */
export function estimateA1C(avgBG: number): number {
  return (avgBG + 46.7) / 28.7;
}
