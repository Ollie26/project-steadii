// ============================================================
// Time in Range calculator
// ============================================================

export interface TIRResult {
  inRangePercent: number;
  highPercent: number;
  lowPercent: number;
  veryHighPercent: number;
  veryLowPercent: number;
  totalReadings: number;
}

export interface BGStats {
  average: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
  estimatedA1C: number;
}

interface Reading {
  value: number;
}

// Standard thresholds
const VERY_LOW_THRESHOLD = 54; // mg/dL
const VERY_HIGH_THRESHOLD = 250; // mg/dL

/**
 * Calculate Time in Range breakdown for a set of glucose readings.
 *
 * @param readings - Array of objects with a `value` field (mg/dL)
 * @param targetLow - Lower bound of target range (default 70 mg/dL)
 * @param targetHigh - Upper bound of target range (default 180 mg/dL)
 * @returns TIR breakdown with percentages
 */
export function calculateTIR(
  readings: Reading[],
  targetLow: number = 70,
  targetHigh: number = 180
): TIRResult {
  const total = readings.length;

  if (total === 0) {
    return {
      inRangePercent: 0,
      highPercent: 0,
      lowPercent: 0,
      veryHighPercent: 0,
      veryLowPercent: 0,
      totalReadings: 0,
    };
  }

  let inRange = 0;
  let high = 0;
  let low = 0;
  let veryHigh = 0;
  let veryLow = 0;

  for (const reading of readings) {
    const v = reading.value;

    if (v < VERY_LOW_THRESHOLD) {
      veryLow++;
    } else if (v < targetLow) {
      low++;
    } else if (v > VERY_HIGH_THRESHOLD) {
      veryHigh++;
    } else if (v > targetHigh) {
      high++;
    } else {
      inRange++;
    }
  }

  return {
    inRangePercent: round((inRange / total) * 100),
    highPercent: round((high / total) * 100),
    lowPercent: round((low / total) * 100),
    veryHighPercent: round((veryHigh / total) * 100),
    veryLowPercent: round((veryLow / total) * 100),
    totalReadings: total,
  };
}

/**
 * Calculate summary statistics for glucose readings.
 *
 * @param readings - Array of objects with a `value` field (mg/dL)
 * @returns Statistical summary including estimated A1C
 */
export function calculateStats(readings: Reading[]): BGStats {
  if (readings.length === 0) {
    return {
      average: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      count: 0,
      estimatedA1C: 0,
    };
  }

  const values = readings.map((r) => r.value);
  const count = values.length;

  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / count;

  const squaredDiffs = values.map((v) => (v - avg) ** 2);
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / count;
  const stdDev = Math.sqrt(variance);

  const min = Math.min(...values);
  const max = Math.max(...values);

  // Estimated A1C formula: (averageBG + 46.7) / 28.7
  const estimatedA1C = (avg + 46.7) / 28.7;

  return {
    average: round(avg),
    stdDev: round(stdDev),
    min,
    max,
    count,
    estimatedA1C: round(estimatedA1C),
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
