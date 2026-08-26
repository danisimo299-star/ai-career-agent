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
  /** Propagated to the underlying `fetch`, so aborting the client request (e.g. "Stop generating") actually cancels the upstream call instead of letting it run to completion unread. */
  signal?: AbortSignal;
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

  /**
   * Same contract as `complete`, but yields text deltas as they arrive
   * instead of waiting for the full response — for `jsonMode`-free,
   * prose-only calls (the Coach chat reply) that should stream token-by-token
   * to the client instead of appearing all at once.
   */
  stream(
    messages: AIMessage[],
    options?: Omit<AICompletionOptions, "jsonMode">
  ): AsyncIterable<string>;
}
