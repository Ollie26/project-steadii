// ============================================================
// Insight Orchestrator
// Routes to AI engine or fallback based on AI_ENABLED flag
// ============================================================

import { isAIEnabled } from "@/lib/ai/aiClient";
import { generateInsightsAI, type AIInsight } from "@/lib/ai/generateInsights";
import {
  generateInsightsFallback,
  type FallbackInsight,
  type FallbackInsightInput,
} from "./insightEngineFallback";
import { serializeUserData, type SerializeInput } from "./dataSerializer";

export interface InsightResult {
  category: string;
  title: string;
  body: string;
  actionable: string | null;
  dataPoints: number;
  confidence: "low" | "medium" | "high";
  source: "ai" | "fallback";
  relatedPainPoint: string | null;
}

/**
 * Generate insights by routing to the AI engine or the rule-based fallback.
 *
 * Flow:
 * 1. If AI_ENABLED=true and ANTHROPIC_API_KEY exists: serialize data, call Claude, parse response
 * 2. If AI call fails: fall back to rule-based engine
 * 3. If AI_ENABLED=false: use rule-based engine directly
 */
export async function generateInsights(
  serializeInput: SerializeInput,
  fallbackInput: FallbackInsightInput,
  painPointsDescription: string
): Promise<InsightResult[]> {
  // Try AI first if enabled
  if (isAIEnabled()) {
    try {
      const serializedData = serializeUserData(serializeInput);
      const aiInsights = await generateInsightsAI(
        serializedData,
        painPointsDescription
      );

      if (aiInsights && aiInsights.length > 0) {
        return aiInsights.map(
          (insight: AIInsight): InsightResult => ({
            category: insight.category,
            title: insight.title,
            body: insight.body,
            actionable: insight.actionable,
            dataPoints: insight.dataPoints,
            confidence: insight.confidence,
            source: "ai",
            relatedPainPoint: insight.relatedPainPoint,
          })
        );
      }

      // AI returned empty results, fall through to fallback
      console.warn(
        "[insightOrchestrator] AI returned empty results, falling back to rule-based engine"
      );
    } catch (error) {
      console.error(
        "[insightOrchestrator] AI insight generation failed, falling back to rule-based engine:",
        error
      );
    }
  }

  // Fallback: rule-based engine
  const fallbackInsights = generateInsightsFallback(fallbackInput);

  return fallbackInsights.map(
    (insight: FallbackInsight): InsightResult => ({
      category: insight.category,
      title: insight.title,
      body: insight.body,
      actionable: insight.actionable,
      dataPoints: insight.dataPoints,
      confidence: insight.confidence,
      source: "fallback",
      relatedPainPoint: insight.relatedPainPoint,
    })
  );
}
