// ============================================================
// Nutrition calculation helpers
// ============================================================

export interface NutritionValues {
  carbsG: number;
  proteinG: number;
  fatG: number;
  fiberG: number;
  calories: number;
}

export interface MealItemNutrition {
  name: string;
  servingSize: string | null;
  carbsG: number | null;
  proteinG: number | null;
  fatG: number | null;
  fiberG: number | null;
  calories: number | null;
}

/**
 * Calculate total nutrition across all items in a meal.
 * Null values are treated as 0 for summing.
 */
export function calculateMealTotals(
  items: MealItemNutrition[]
): NutritionValues {
  return items.reduce(
    (totals, item) => ({
      carbsG: totals.carbsG + (item.carbsG ?? 0),
      proteinG: totals.proteinG + (item.proteinG ?? 0),
      fatG: totals.fatG + (item.fatG ?? 0),
      fiberG: totals.fiberG + (item.fiberG ?? 0),
      calories: totals.calories + (item.calories ?? 0),
    }),
    { carbsG: 0, proteinG: 0, fatG: 0, fiberG: 0, calories: 0 }
  );
}

/**
 * Scale nutrition values by a serving size multiplier.
 * For example, if default serving is "1 cup" and user eats 1.5 cups, multiplier = 1.5.
 */
export function adjustForServing(
  nutrition: NutritionValues,
  multiplier: number
): NutritionValues {
  if (multiplier <= 0) {
    return { carbsG: 0, proteinG: 0, fatG: 0, fiberG: 0, calories: 0 };
  }

  return {
    carbsG: round(nutrition.carbsG * multiplier),
    proteinG: round(nutrition.proteinG * multiplier),
    fatG: round(nutrition.fatG * multiplier),
    fiberG: round(nutrition.fiberG * multiplier),
    calories: round(nutrition.calories * multiplier),
  };
}

/**
 * Normalize serving sizes: compute a multiplier to convert between a serving
 * description and a gram weight.
 *
 * Examples:
 *   normalizeServing("1 cup", 240) => 1.0 (1 cup = ~240g baseline)
 *   normalizeServing("100g", 50) => 0.5  (50g is half of 100g reference)
 *   normalizeServing("2 slices", 56) => 1.0 (treat as 1x if no gram mapping)
 *
 * @param servingSize - A serving size description (e.g., "1 cup", "100g")
 * @param grams - The actual gram weight the user is consuming
 * @returns A multiplier relative to the reference serving
 */
export function normalizeServing(
  servingSize: string | null,
  grams: number
): number {
  if (!servingSize || grams <= 0) return 1;

  const servingLower = servingSize.toLowerCase().trim();

  // Check if serving size is expressed in grams directly
  const gramMatch = servingLower.match(/^(\d+(?:\.\d+)?)\s*g(?:rams?)?$/);
  if (gramMatch) {
    const referenceGrams = parseFloat(gramMatch[1]);
    if (referenceGrams > 0) {
      return grams / referenceGrams;
    }
  }

  // Check if serving size is expressed in ml (rough 1:1 with grams for water-based)
  const mlMatch = servingLower.match(/^(\d+(?:\.\d+)?)\s*ml$/);
  if (mlMatch) {
    const referenceMl = parseFloat(mlMatch[1]);
    if (referenceMl > 0) {
      return grams / referenceMl;
    }
  }

  // Check if serving size is expressed in oz
  const ozMatch = servingLower.match(/^(\d+(?:\.\d+)?)\s*oz$/);
  if (ozMatch) {
    const referenceOz = parseFloat(ozMatch[1]);
    const referenceGrams = referenceOz * 28.35;
    if (referenceGrams > 0) {
      return grams / referenceGrams;
    }
  }

  // Common serving size approximations in grams
  const servingGramMap: Record<string, number> = {
    "1 cup": 240,
    "1/2 cup": 120,
    "1/4 cup": 60,
    "1 tablespoon": 15,
    "1 tbsp": 15,
    "1 teaspoon": 5,
    "1 tsp": 5,
    "1 slice": 28,
    "1 piece": 30,
    "1 medium": 150,
    "1 large": 200,
    "1 small": 100,
  };

  const referenceGrams = servingGramMap[servingLower];
  if (referenceGrams) {
    return grams / referenceGrams;
  }

  // If we can't parse the serving size, default to 1x
  return 1;
}

/**
 * Calculate net carbs (total carbs minus fiber).
 */
export function netCarbs(carbsG: number, fiberG: number): number {
  return Math.max(0, round(carbsG - fiberG));
}

/**
 * Round a number to 1 decimal place.
 */
function round(value: number): number {
  return Math.round(value * 10) / 10;
}
