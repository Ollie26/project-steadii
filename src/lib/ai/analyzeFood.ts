// ============================================================
// Claude Vision food photo analysis
// ============================================================

import { z } from "zod";
import { sendVisionMessage } from "./aiClient";
import { FOOD_PHOTO_PROMPT } from "./prompts";

// Zod schema for validating Claude's food photo response
const FoodItemSchema = z.object({
  name: z.string(),
  estimatedPortion: z.string(),
  carbsGrams: z.number(),
  proteinGrams: z.number(),
  fatGrams: z.number(),
  fiberGrams: z.number(),
  calories: z.number(),
});

const FoodTotalsSchema = z.object({
  carbsGrams: z.number(),
  proteinGrams: z.number(),
  fatGrams: z.number(),
  fiberGrams: z.number(),
  calories: z.number(),
});

const FoodPhotoResponseSchema = z.object({
  description: z.string(),
  items: z.array(FoodItemSchema),
  totals: FoodTotalsSchema,
  glycemicIndex: z.enum(["low", "medium", "high"]),
  glycemicNotes: z.string().optional(),
  confidence: z.enum(["low", "medium", "high"]),
  warnings: z.array(z.string()),
});

export type FoodPhotoResponse = z.infer<typeof FoodPhotoResponseSchema>;

/**
 * Analyze a food photo using Claude Vision.
 * @param imageBase64 - Base64 encoded image (no data URI prefix)
 * @param mediaType - Image MIME type
 * @returns Parsed food analysis or null on failure
 */
export async function analyzeFoodPhoto(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg"
): Promise<FoodPhotoResponse | null> {
  try {
    const rawResponse = await sendVisionMessage(
      FOOD_PHOTO_PROMPT,
      imageBase64,
      mediaType,
      1000
    );

    if (!rawResponse) {
      console.error("[analyzeFood] No response from Claude Vision");
      return null;
    }

    // Extract JSON from the response (handle possible markdown code blocks)
    const jsonStr = extractJSON(rawResponse);
    const parsed = JSON.parse(jsonStr);
    const validated = FoodPhotoResponseSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error("[analyzeFood] Failed to analyze food photo:", error);
    return null;
  }
}

/**
 * Extract JSON from a response that may contain markdown code blocks.
 */
function extractJSON(text: string): string {
  // Try to extract from code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return text.trim();
}
