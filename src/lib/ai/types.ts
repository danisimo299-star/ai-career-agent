export type AIMessageRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

/**
 * `"fast"` (the default everywhere in this app): no extended reasoning —
 * every product-generation feature here (Career Analysis, Roadmap, Resume,
 * Missions, Interview, Job Prep) is structured generation from a profile
 * the model already has, not a problem that benefits from a model
 * "thinking out loud" first. A reasoning-capable local model defaults to a
 * long internal thinking trace before its real answer — measured on this
 * deployment's model at ~2.5 minutes of thinking for what was otherwise a
 * fast reply — so `"fast"` is what every call site gets unless it opts in.
 * `"deep"` exists as the escape hatch for a genuinely hard reasoning task,
 * should one ever show up — nothing in this codebase asks for it today.
 * Centralized here (not a `think:false` sprinkled across 20 route files) so
 * a future provider only has to honor `mode` once.
 */
export type AICompletionMode = "fast" | "deep";

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  /** Forces the provider to return valid JSON matching this description. */
  jsonMode?: boolean;
  /** See `AICompletionMode` — defaults to `"fast"` when omitted. */
  mode?: AICompletionMode;
  /**
   * Opts a call out of the bounded-concurrency queue (see
   * `lib/ai/concurrency.ts`) — for a call that's structurally part of the
   * Coach chat turn (the intent/memory classification that runs alongside
   * the streamed reply) even though it uses `complete()`, not `stream()`.
   * Chat must never wait behind a queue of unrelated heavy generations;
   * every other `jsonMode` call is a real product generation and should
   * stay gated.
   */
  skipConcurrencyGate?: boolean;
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
