export type AIMessageRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  /** Forces the provider to return valid JSON matching this description. */
  jsonMode?: boolean;
}

export interface AICompletionResult {
  content: string;
  provider: string;
  model: string;
}

/**
 * Every AI provider (OpenAI, Anthropic, a local model, a mock for tests)
 * implements this single contract. Nothing outside `src/lib/ai` is allowed
 * to import a provider SDK directly — callers only ever see `AIProvider`.
 */
export interface AIProvider {
  readonly name: string;

  complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult>;
}
