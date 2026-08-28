import { env } from "@/lib/env";
import { getChatProvider, getGenerationProvider } from "../provider";
import { MockCareerService } from "./mock-career.service";
import { LLMCareerService } from "./llm-career.service";
import type { AICareerService } from "./types";

let cached: AICareerService | null = null;

/**
 * The one entry point features use to reach the AI career-intelligence
 * layer. Mock mode (`MockCareerService`) only activates when BOTH chat and
 * generation actually resolve to "mock" — checking the raw `AI_PROVIDER`
 * default alone would be wrong: a deployment that leaves `AI_PROVIDER`
 * unset but explicitly sets `AI_GENERATION_PROVIDER=groq` clearly wants
 * real Groq calls, not to silently fall back to mock data. Anything else
 * wraps two `AIProvider`s (already provider-agnostic — Ollama, OpenAI,
 * Anthropic, Groq) in `LLMCareerService`: `getChatProvider()` for live
 * conversational calls, `getGenerationProvider()` for discrete
 * "Generate ..." product features — see `AI_CHAT_PROVIDER`/
 * `AI_GENERATION_PROVIDER` in `env.ts`. Nothing outside this file needs to
 * know which concrete provider is active for which purpose.
 */
export function getAICareerService(): AICareerService {
  if (cached) return cached;

  const resolvedChatProvider = env.AI_CHAT_PROVIDER ?? env.AI_PROVIDER;
  const resolvedGenerationProvider = env.AI_GENERATION_PROVIDER ?? env.AI_PROVIDER;
  const usesMockOnly = resolvedChatProvider === "mock" && resolvedGenerationProvider === "mock";

  cached = usesMockOnly ? new MockCareerService() : new LLMCareerService(getChatProvider(), getGenerationProvider());
  return cached;
}
