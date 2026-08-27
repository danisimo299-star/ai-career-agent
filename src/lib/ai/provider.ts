import { env } from "@/lib/env";
import type { AIProvider } from "./types";
import { MockAIProvider } from "./providers/mock.provider";
import { OpenAIProvider } from "./providers/openai.provider";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { OllamaProvider } from "./providers/ollama.provider";
import { GroqProvider } from "./providers/groq.provider";

type ProviderName = "mock" | "openai" | "anthropic" | "ollama" | "groq";

const providerCache = new Map<ProviderName, AIProvider>();

function buildProvider(name: ProviderName): AIProvider {
  switch (name) {
    case "openai":
      if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");
      return new OpenAIProvider(env.OPENAI_API_KEY);
    case "anthropic":
      if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic");
      return new AnthropicProvider(env.ANTHROPIC_API_KEY);
    case "ollama":
      if (!env.OLLAMA_MODEL) throw new Error("OLLAMA_MODEL is required when AI_PROVIDER=ollama");
      return new OllamaProvider(env.OLLAMA_BASE_URL, env.OLLAMA_MODEL);
    case "groq":
      if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is required when AI_CHAT_PROVIDER/AI_GENERATION_PROVIDER=groq");
      return new GroqProvider(env.GROQ_API_KEY, env.GROQ_MODEL);
    case "mock":
    default:
      return new MockAIProvider();
  }
}

/** One cached instance per provider name — so `getChatProvider()` and `getGenerationProvider()` share the same `GroqProvider`/`OllamaProvider` instance whenever they resolve to the same name, instead of each building its own. */
function getProviderByName(name: ProviderName): AIProvider {
  const cached = providerCache.get(name);
  if (cached) return cached;
  const provider = buildProvider(name);
  providerCache.set(name, provider);
  return provider;
}

/**
 * The legacy single-provider entry point — still what `getAICareerService()`
 * checks for the `mock` gate, and still correct for any caller that doesn't
 * need the chat/generation split. Prefer `getChatProvider()` /
 * `getGenerationProvider()` in new code.
 */
export function getAIProvider(): AIProvider {
  return getProviderByName(env.AI_PROVIDER);
}

/**
 * Live conversational calls — Coach chat streaming, the Career Interview's
 * chat acknowledgement (`analyzeUser`). Falls back to `AI_PROVIDER` when
 * `AI_CHAT_PROVIDER` is unset, so setting only `AI_PROVIDER` still works
 * exactly as before this split existed.
 */
export function getChatProvider(): AIProvider {
  return getProviderByName(env.AI_CHAT_PROVIDER ?? env.AI_PROVIDER);
}

/**
 * Discrete "Generate ..." product features — Career Analysis, Roadmap,
 * Resume, Missions, Interview, Job Prep. Falls back to `AI_PROVIDER` when
 * `AI_GENERATION_PROVIDER` is unset.
 */
export function getGenerationProvider(): AIProvider {
  return getProviderByName(env.AI_GENERATION_PROVIDER ?? env.AI_PROVIDER);
}
