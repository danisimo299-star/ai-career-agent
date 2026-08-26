import { env } from "@/lib/env";
import type { AIProvider } from "./types";
import { MockAIProvider } from "./providers/mock.provider";
import { OpenAIProvider } from "./providers/openai.provider";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { OllamaProvider } from "./providers/ollama.provider";

let cachedProvider: AIProvider | null = null;

/**
 * Single entry point the rest of the app uses to talk to an LLM. Which
 * provider actually runs is controlled entirely by the `AI_PROVIDER` env
 * var — swapping OpenAI for Anthropic (or a future local model) never
 * requires touching feature code, only this factory.
 */
export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  switch (env.AI_PROVIDER) {
    case "openai":
      if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");
      cachedProvider = new OpenAIProvider(env.OPENAI_API_KEY);
      break;
    case "anthropic":
      if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic");
      cachedProvider = new AnthropicProvider(env.ANTHROPIC_API_KEY);
      break;
    case "ollama":
      if (!env.OLLAMA_MODEL) throw new Error("OLLAMA_MODEL is required when AI_PROVIDER=ollama");
      cachedProvider = new OllamaProvider(env.OLLAMA_BASE_URL, env.OLLAMA_MODEL);
      break;
    case "mock":
    default:
      cachedProvider = new MockAIProvider();
      break;
  }

  return cachedProvider;
}
