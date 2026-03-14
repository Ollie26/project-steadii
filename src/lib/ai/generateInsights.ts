// ============================================================
// Claude-powered insight generation (PRIMARY when AI_ENABLED)
// ============================================================

import { z } from "zod";
import { sendMessage } from "./aiClient";
import { INSIGHT_GENERATION_PROMPT } from "./prompts";

const InsightSchema = z.object({
  category: z.enum([
    "food",
    "time_of_day",
    "stress",
    "exercise",
    "sleep",
    "general",
    "warning",
  ]),
  title: z.string(),
  body: z.string(),
  actionable: z.string().nullable(),
  dataPoints: z.number(),
  confidence: z.enum(["low", "medium", "high"]),
  relatedPainPoint: z.string().nullable(),
});

const InsightResponseSchema = z.object({
  insights: z.array(InsightSchema),
});

export type AIInsight = z.infer<typeof InsightSchema>;

/**
 * Generate insights from user data using Claude AI.
 * @param userData - Serialized user data string
 * @param painPoints - Comma-separated pain point descriptions
 * @returns Array of insight objects or null on failure
 */
export async function generateInsightsAI(
  userData: string,
  painPoints: string
): Promise<AIInsight[] | null> {
  try {
    const prompt = INSIGHT_GENERATION_PROMPT(userData, painPoints);

    const rawResponse = await sendMessage(
      "You are a personal diabetes analyst generating data-driven insights.",
      prompt,
      2000
    );

    if (!rawResponse) {
      console.error("[generateInsightsAI] No response from Claude");
      return null;
    }

    // Extract JSON from the response
    const jsonStr = extractJSON(rawResponse);
    const parsed = JSON.parse(jsonStr);
    const validated = InsightResponseSchema.parse(parsed);

    return validated.insights;
  } catch (error) {
    console.error("[generateInsightsAI] Failed to generate insights:", error);
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
