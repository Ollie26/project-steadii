// ============================================================
// Statistical helpers
// ============================================================

/**
 * Calculate the arithmetic mean of an array of numbers.
 * Returns 0 for empty arrays.
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
}

/**
 * Calculate the population standard deviation of an array of numbers.
 * Returns 0 for arrays with fewer than 2 elements.
 */
export function stddev(numbers: number[]): number {
  if (numbers.length < 2) return 0;
  const avg = average(numbers);
  const squaredDiffs = numbers.map((n) => (n - avg) ** 2);
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  return Math.sqrt(variance);
}

/**
 * Calculate the p-th percentile of an array of numbers.
 * Uses linear interpolation between closest ranks.
 *
 * @param numbers - Array of numbers
 * @param p - Percentile (0-100)
 * @returns The percentile value
 */
export function percentile(numbers: number[], p: number): number {
  if (numbers.length === 0) return 0;
  if (numbers.length === 1) return numbers[0];

  const sorted = [...numbers].sort((a, b) => a - b);
  const clampedP = Math.max(0, Math.min(100, p));

  // Rank (0-indexed position)
  const rank = (clampedP / 100) * (sorted.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);

  if (lowerIndex === upperIndex) {
    return sorted[lowerIndex];
  }

  // Linear interpolation
  const fraction = rank - lowerIndex;
  return sorted[lowerIndex] + fraction * (sorted[upperIndex] - sorted[lowerIndex]);
}

/**
 * Calculate the median (50th percentile) of an array of numbers.
 */
export function median(numbers: number[]): number {
  return percentile(numbers, 50);
}

/**
 * Calculate the coefficient of variation (CV) as a percentage.
 * CV = (stdDev / mean) * 100
 */
export function coefficientOfVariation(numbers: number[]): number {
  const avg = average(numbers);
  if (avg === 0) return 0;
  return (stddev(numbers) / avg) * 100;
}

/**
 * Calculate the interquartile range (IQR = Q3 - Q1).
 */
export function iqr(numbers: number[]): number {
  return percentile(numbers, 75) - percentile(numbers, 25);
}

/**
 * Calculate the sum of an array of numbers.
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

/**
 * Round a number to a specified number of decimal places.
 */
export function roundTo(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
