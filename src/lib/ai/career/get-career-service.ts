import { env } from "@/lib/env";
import { getAIProvider } from "../provider";
import { MockCareerService } from "./mock-career.service";
import { LLMCareerService } from "./llm-career.service";
import type { AICareerService } from "./types";

let cached: AICareerService | null = null;

/**
 * The one entry point features use to reach the AI career-intelligence
 * layer. `AI_PROVIDER=mock` (the default) returns `MockCareerService`;
 * anything else wraps the low-level `AIProvider` (already provider-agnostic
 * — OpenAI, Anthropic, and later Gemini) in `LLMCareerService`. Nothing
 * outside this file needs to know which one is active.
 */
export function getAICareerService(): AICareerService {
  if (cached) return cached;

  cached = env.AI_PROVIDER === "mock" ? new MockCareerService() : new LLMCareerService(getAIProvider());
  return cached;
}
