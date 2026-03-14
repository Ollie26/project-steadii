// ============================================================
// Post-meal BG impact calculator
// ============================================================

import type { BGImpact, BGClassification } from "@/types";

export interface GlucoseReading {
  timestamp: Date;
  value: number; // mg/dL
}

export interface BGImpactOptions {
  targetLow: number;
  targetHigh: number;
  hasDelayedSpikes: boolean;
}

/**
 * Calculate the blood sugar impact of a meal.
 *
 * @param mealTimestamp - When the meal was eaten
 * @param glucoseReadings - All available glucose readings (should cover before and after meal)
 * @param options - Target range and delayed spike configuration
 * @returns BGImpact object or null if insufficient data
 */
export function calculateBGImpact(
  mealTimestamp: Date,
  glucoseReadings: GlucoseReading[],
  options: BGImpactOptions
): BGImpact | null {
  const { targetLow, targetHigh, hasDelayedSpikes } = options;
  const mealTime = mealTimestamp.getTime();

  // Post-meal window: 3 hours (4 if hasDelayedSpikes)
  const postMealWindowMs = (hasDelayedSpikes ? 4 : 3) * 60 * 60 * 1000;
  const windowEnd = mealTime + postMealWindowMs;

  // Sort readings by timestamp
  const sorted = [...glucoseReadings].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // --- Find pre-meal BG ---
  // Closest reading within 15 minutes before meal, fallback to 30 minutes
  const preMealBG = findPreMealBG(sorted, mealTime);
  if (preMealBG === null) {
    return null; // Cannot compute without a pre-meal baseline
  }

  // --- Get post-meal readings ---
  const postMealReadings = sorted.filter((r) => {
    const t = r.timestamp.getTime();
    return t >= mealTime && t <= windowEnd;
  });

  if (postMealReadings.length < 3) {
    return null; // Need at least 3 readings in post-meal window
  }

  // --- Peak BG ---
  let peakBG = -Infinity;
  let peakTime = mealTime;
  for (const r of postMealReadings) {
    if (r.value > peakBG) {
      peakBG = r.value;
      peakTime = r.timestamp.getTime();
    }
  }

  const peakDelta = peakBG - preMealBG;
  const peakTimeMinutes = Math.round((peakTime - mealTime) / (60 * 1000));

  // --- Nadir BG ---
  let nadirBG = Infinity;
  for (const r of postMealReadings) {
    if (r.value < nadirBG) {
      nadirBG = r.value;
    }
  }

  // --- Three-hour BG ---
  const threeHourMark = mealTime + 3 * 60 * 60 * 1000;
  const threeHourBG = findClosestReading(sorted, threeHourMark, 15 * 60 * 1000);
  const threeHourDelta = threeHourBG !== null ? threeHourBG - preMealBG : peakDelta;

  // --- Return to baseline ---
  const baselineThreshold = 20; // mg/dL
  let returnToBaselineMinutes: number | null = null;
  for (const r of postMealReadings) {
    const t = r.timestamp.getTime();
    if (t > peakTime && Math.abs(r.value - preMealBG) <= baselineThreshold) {
      returnToBaselineMinutes = Math.round((t - mealTime) / (60 * 1000));
      break;
    }
  }

  // --- AUC (trapezoidal integration above pre-meal baseline) ---
  const auc = calculateAUC(postMealReadings, preMealBG);

  // --- TIR (time in range) ---
  const tirPercent = calculatePostMealTIR(
    postMealReadings,
    targetLow,
    targetHigh
  );

  // --- Classification ---
  const classification = classifyImpact(Math.abs(peakDelta));

  return {
    preMealBG,
    peakBG,
    peakDelta,
    peakTimeMinutes,
    threeHourBG: threeHourBG ?? postMealReadings[postMealReadings.length - 1].value,
    threeHourDelta: threeHourDelta,
    nadirBG,
    returnToBaselineMinutes,
    areaUnderCurve: Math.round(auc),
    tirPercent: Math.round(tirPercent * 10) / 10,
    classification,
  };
}

/**
 * Find the closest BG reading within 15 minutes before the meal,
 * falling back to 30 minutes.
 */
function findPreMealBG(
  readings: GlucoseReading[],
  mealTime: number
): number | null {
  const fifteenMin = 15 * 60 * 1000;
  const thirtyMin = 30 * 60 * 1000;

  let closest: GlucoseReading | null = null;
  let closestDist = Infinity;

  // First pass: within 15 minutes before
  for (const r of readings) {
    const t = r.timestamp.getTime();
    const diff = mealTime - t;
    if (diff >= 0 && diff <= fifteenMin && diff < closestDist) {
      closest = r;
      closestDist = diff;
    }
  }

  if (closest) return closest.value;

  // Second pass: within 30 minutes before
  closestDist = Infinity;
  for (const r of readings) {
    const t = r.timestamp.getTime();
    const diff = mealTime - t;
    if (diff >= 0 && diff <= thirtyMin && diff < closestDist) {
      closest = r;
      closestDist = diff;
    }
  }

  return closest ? closest.value : null;
}

/**
 * Find the closest reading to a target time within a tolerance.
 */
function findClosestReading(
  readings: GlucoseReading[],
  targetTime: number,
  toleranceMs: number
): number | null {
  let closest: GlucoseReading | null = null;
  let closestDist = Infinity;

  for (const r of readings) {
    const dist = Math.abs(r.timestamp.getTime() - targetTime);
    if (dist <= toleranceMs && dist < closestDist) {
      closest = r;
      closestDist = dist;
    }
  }

  return closest ? closest.value : null;
}

/**
 * Calculate Area Under the Curve using trapezoidal integration.
 * Only counts area above the pre-meal baseline.
 */
function calculateAUC(
  readings: GlucoseReading[],
  baseline: number
): number {
  if (readings.length < 2) return 0;

  let auc = 0;

  for (let i = 1; i < readings.length; i++) {
    const t1 = readings[i - 1].timestamp.getTime();
    const t2 = readings[i].timestamp.getTime();
    const dt = (t2 - t1) / (60 * 1000); // Convert to minutes

    const v1 = Math.max(0, readings[i - 1].value - baseline);
    const v2 = Math.max(0, readings[i].value - baseline);

    // Trapezoidal area
    auc += ((v1 + v2) / 2) * dt;
  }

  return auc;
}

/**
 * Calculate the percentage of post-meal readings that are in target range.
 */
function calculatePostMealTIR(
  readings: GlucoseReading[],
  targetLow: number,
  targetHigh: number
): number {
  if (readings.length === 0) return 0;

  const inRange = readings.filter(
    (r) => r.value >= targetLow && r.value <= targetHigh
  ).length;

  return (inRange / readings.length) * 100;
}

/**
 * Classify the BG impact based on peak delta.
 */
function classifyImpact(absPeakDelta: number): BGClassification {
  if (absPeakDelta < 30) return "minimal";
  if (absPeakDelta < 60) return "moderate";
  if (absPeakDelta < 100) return "significant";
  return "severe";
}

/**
 * Get the TIR color label for a given TIR percentage.
 */
export function tirColor(tirPercent: number): "green" | "amber" | "red" {
  if (tirPercent >= 70) return "green";
  if (tirPercent >= 50) return "amber";
  return "red";
}
