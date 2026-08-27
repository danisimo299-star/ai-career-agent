import { env } from "@/lib/env";
import { getChatProvider, getGenerationProvider } from "../provider";
import { MockCareerService } from "./mock-career.service";
import { LLMCareerService } from "./llm-career.service";
import type { AICareerService } from "./types";

let cached: AICareerService | null = null;

/**
 * The one entry point features use to reach the AI career-intelligence
 * layer. `AI_PROVIDER=mock` (the default) returns `MockCareerService`;
 * anything else wraps two `AIProvider`s (already provider-agnostic — Ollama,
 * OpenAI, Anthropic, Groq) in `LLMCareerService`: `getChatProvider()` for
 * live conversational calls, `getGenerationProvider()` for discrete
 * "Generate ..." product features — see `AI_CHAT_PROVIDER`/
 * `AI_GENERATION_PROVIDER` in `env.ts`. Nothing outside this file needs to
 * know which concrete provider is active for which purpose.
 */
export function getAICareerService(): AICareerService {
  if (cached) return cached;

  cached = env.AI_PROVIDER === "mock" ? new MockCareerService() : new LLMCareerService(getChatProvider(), getGenerationProvider());
  return cached;
}
