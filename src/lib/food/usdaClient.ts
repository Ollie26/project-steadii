// ============================================================
// USDA FoodData Central search client
// ============================================================

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

export interface USDAFoodResult {
  fdcId: number;
  description: string;
  brandName: string | null;
  servingSize: string | null;
  servingSizeGrams: number | null;
  nutrients: {
    carbsG: number | null;
    proteinG: number | null;
    fatG: number | null;
    fiberG: number | null;
    calories: number | null;
  };
}

// USDA nutrient IDs for the macros we care about
const NUTRIENT_IDS = {
  CARBS: 1005, // Carbohydrate, by difference
  PROTEIN: 1003, // Protein
  FAT: 1004, // Total lipid (fat)
  FIBER: 1079, // Fiber, total dietary
  CALORIES: 1008, // Energy (kcal)
} as const;

/**
 * Search the USDA FoodData Central database.
 * Uses DEMO_KEY by default (30 requests/hour).
 * @param query - Food search query
 * @returns Array of food results with nutrition data
 */
export async function searchFoods(
  query: string
): Promise<USDAFoodResult[]> {
  if (!query.trim()) return [];

  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
  const encodedQuery = encodeURIComponent(query.trim());
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodedQuery}&api_key=${apiKey}&pageSize=15&dataType=Foundation,SR%20Legacy,Branded`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `[usdaClient] USDA API returned ${response.status}: ${response.statusText}`
      );
      return [];
    }

    const data = await response.json();

    if (!data.foods || !Array.isArray(data.foods)) {
      return [];
    }

    return data.foods.map((food: Record<string, unknown>): USDAFoodResult => {
      const nutrients = (food.foodNutrients as Array<Record<string, unknown>>) || [];

      const findNutrient = (nutrientId: number): number | null => {
        const nutrient = nutrients.find(
          (n) => n.nutrientId === nutrientId
        );
        return nutrient && typeof nutrient.value === "number"
          ? nutrient.value
          : null;
      };

      // Try to extract serving size info
      let servingSize: string | null = null;
      let servingSizeGrams: number | null = null;

      if (food.servingSize && food.servingSizeUnit) {
        servingSize = `${food.servingSize} ${food.servingSizeUnit}`;
        if (food.servingSizeUnit === "g") {
          servingSizeGrams = food.servingSize as number;
        }
      } else if (food.householdServingFullText) {
        servingSize = food.householdServingFullText as string;
      }

      return {
        fdcId: food.fdcId as number,
        description: food.description as string,
        brandName: (food.brandName as string) || (food.brandOwner as string) || null,
        servingSize,
        servingSizeGrams,
        nutrients: {
          carbsG: findNutrient(NUTRIENT_IDS.CARBS),
          proteinG: findNutrient(NUTRIENT_IDS.PROTEIN),
          fatG: findNutrient(NUTRIENT_IDS.FAT),
          fiberG: findNutrient(NUTRIENT_IDS.FIBER),
          calories: findNutrient(NUTRIENT_IDS.CALORIES),
        },
      };
    });
  } catch (error) {
    console.error("[usdaClient] Failed to search USDA:", error);
    return [];
  }
}
