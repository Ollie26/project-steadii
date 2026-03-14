// ============================================================
// Open Food Facts barcode lookup client
// ============================================================

export interface OpenFoodFactsResult {
  barcode: string;
  productName: string;
  brandName: string | null;
  servingSize: string | null;
  nutrients: {
    carbsG: number | null;
    proteinG: number | null;
    fatG: number | null;
    fiberG: number | null;
    calories: number | null;
  };
  nutrientsPer100g: {
    carbsG: number | null;
    proteinG: number | null;
    fatG: number | null;
    fiberG: number | null;
    calories: number | null;
  };
  imageUrl: string | null;
}

/**
 * Look up a food product by barcode using the Open Food Facts API.
 * No API key needed -- this is a free, open-source database.
 * @param barcode - The product barcode (EAN-13, UPC-A, etc.)
 * @returns Structured food data or null if not found
 */
export async function lookupBarcode(
  barcode: string
): Promise<OpenFoodFactsResult | null> {
  if (!barcode.trim()) return null;

  const cleanBarcode = barcode.trim().replace(/\D/g, "");
  const url = `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `[openFoodFacts] API returned ${response.status}: ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      // Product not found
      return null;
    }

    const product = data.product;
    const nutriments = product.nutriments || {};

    // Extract serving-based nutrients if available
    const hasServingData = nutriments.carbohydrates_serving != null;

    return {
      barcode: cleanBarcode,
      productName: product.product_name || product.product_name_en || "Unknown Product",
      brandName: product.brands || null,
      servingSize: product.serving_size || null,
      nutrients: hasServingData
        ? {
            carbsG: safeNumber(nutriments.carbohydrates_serving),
            proteinG: safeNumber(nutriments.proteins_serving),
            fatG: safeNumber(nutriments.fat_serving),
            fiberG: safeNumber(nutriments.fiber_serving),
            calories: safeNumber(
              nutriments["energy-kcal_serving"] ?? nutriments.energy_serving
            ),
          }
        : {
            // Fall back to per-100g values
            carbsG: safeNumber(nutriments.carbohydrates_100g),
            proteinG: safeNumber(nutriments.proteins_100g),
            fatG: safeNumber(nutriments.fat_100g),
            fiberG: safeNumber(nutriments.fiber_100g),
            calories: safeNumber(
              nutriments["energy-kcal_100g"] ?? nutriments.energy_100g
            ),
          },
      nutrientsPer100g: {
        carbsG: safeNumber(nutriments.carbohydrates_100g),
        proteinG: safeNumber(nutriments.proteins_100g),
        fatG: safeNumber(nutriments.fat_100g),
        fiberG: safeNumber(nutriments.fiber_100g),
        calories: safeNumber(
          nutriments["energy-kcal_100g"] ?? nutriments.energy_100g
        ),
      },
      imageUrl: product.image_front_url || product.image_url || null,
    };
  } catch (error) {
    console.error("[openFoodFacts] Failed to look up barcode:", error);
    return null;
  }
}

/**
 * Safely convert a value to a number, returning null if invalid.
 */
function safeNumber(value: unknown): number | null {
  if (value == null) return null;
  const num = Number(value);
  return isNaN(num) ? null : Math.round(num * 10) / 10;
}
