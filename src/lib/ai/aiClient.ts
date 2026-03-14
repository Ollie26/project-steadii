// ============================================================
// Shared Anthropic SDK client with error handling
// ============================================================

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";

let clientInstance: Anthropic | null = null;

/**
 * Check if AI is enabled via environment variable.
 */
export function isAIEnabled(): boolean {
  return (
    process.env.AI_ENABLED === "true" &&
    !!process.env.ANTHROPIC_API_KEY
  );
}

/**
 * Get or create a singleton Anthropic client.
 * Returns null if AI is not enabled.
 */
export function getAIClient(): Anthropic | null {
  if (!isAIEnabled()) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } catch (error) {
      console.error("[aiClient] Failed to initialize Anthropic client:", error);
      return null;
    }
  }

  return clientInstance;
}

/**
 * Send a text message to Claude and get a response.
 * Returns the text content or null on error.
 */
export async function sendMessage(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 2000
): Promise<string | null> {
  const client = getAIClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
      system: systemPrompt,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock ? textBlock.text : null;
  } catch (error) {
    console.error("[aiClient] Claude API call failed:", error);
    return null;
  }
}

/**
 * Send a message with an image (Claude Vision) and get a response.
 * imageBase64 should be the raw base64 string (no data URI prefix).
 * Returns the text content or null on error.
 */
export async function sendVisionMessage(
  systemPrompt: string,
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg",
  maxTokens: number = 1000
): Promise<string | null> {
  const client = getAIClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: "Analyze this food photo and provide nutrition estimates.",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock ? textBlock.text : null;
  } catch (error) {
    console.error("[aiClient] Claude Vision API call failed:", error);
    return null;
  }
}

export { MODEL };
