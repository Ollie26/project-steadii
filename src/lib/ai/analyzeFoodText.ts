// ============================================================
// Claude text-based food analysis
// ============================================================

import { z } from "zod";
import { sendMessage } from "./aiClient";
import { FOOD_TEXT_PROMPT } from "./prompts";

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

const FoodTextResponseSchema = z.object({
  description: z.string(),
  items: z.array(FoodItemSchema),
  totals: FoodTotalsSchema,
  glycemicIndex: z.enum(["low", "medium", "high"]),
  confidence: z.enum(["low", "medium", "high"]),
  warnings: z.array(z.string()),
});

export type FoodTextResponse = z.infer<typeof FoodTextResponseSchema>;

/**
 * Analyze a text description of food using Claude.
 * @param description - User's text description of their meal
 * @returns Parsed food analysis or null on failure
 */
export async function analyzeFoodText(
  description: string
): Promise<FoodTextResponse | null> {
  try {
    const prompt = FOOD_TEXT_PROMPT(description);

    const rawResponse = await sendMessage(
      "You are a nutrition analysis assistant for people with insulin-dependent diabetes.",
      prompt,
      1000
    );

    if (!rawResponse) {
      console.error("[analyzeFoodText] No response from Claude");
      return null;
    }

    // Extract JSON from the response
    const jsonStr = extractJSON(rawResponse);
    const parsed = JSON.parse(jsonStr);
    const validated = FoodTextResponseSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error("[analyzeFoodText] Failed to analyze food text:", error);
    return null;
  }
}

/**
 * Extract JSON from a response that may contain markdown code blocks.
 */
function extractJSON(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return text.trim();
}
