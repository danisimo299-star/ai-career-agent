import Groq from "groq-sdk";
import { AIProviderUnavailableError } from "@/lib/errors";
import { AICapacityError } from "../concurrency";
import type { AICompletionOptions, AICompletionResult, AIMessage, AIProvider } from "../types";

/**
 * A 429 is Groq telling us to slow down, not a broken service — mapped to
 * the same `AICapacityError` the local Ollama concurrency gate throws, so
 * every call site and route already has the right "busy, try again" UI
 * path (503 `ai_busy`) without adding a second error type to plumb through.
 * A genuine 5xx/timeout/network failure maps to `AIProviderUnavailableError`
 * — same as every other provider — never retried in a loop here; the
 * caller decides whether to retry at all (see item 17/18 of the brief).
 */
function translateGroqError(error: unknown, model: string): Error {
  if (error instanceof DOMException && error.name === "AbortError") return error;
  if (error instanceof Groq.RateLimitError) {
    return new AICapacityError("Groq rate limit reached — try again shortly.");
  }
  if (error instanceof Groq.APIConnectionTimeoutError || error instanceof Groq.APIConnectionError) {
    return new AIProviderUnavailableError(`Could not reach Groq (model ${model}) — network/timeout error.`);
  }
  if (error instanceof Groq.InternalServerError) {
    return new AIProviderUnavailableError(`Groq returned a server error for model ${model}.`);
  }
  if (error instanceof Groq.APIError) {
    // A 4xx that isn't a rate limit (bad model name, invalid request shape)
    // is a real misconfiguration, not a transient "unavailable" — surfaced
    // with its own message rather than the generic "AI unavailable" copy,
    // dev console only (never rendered as-is to the end user).
    return new Error(`Groq API error (status ${error.status ?? "?"}) for model ${model}: ${error.message}`);
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Groq's own `json_object` mode validates the model's output server-side
 * and rejects it with a 400 (`json_validate_failed`) rather than handing us
 * malformed JSON to fail on later — a real failure mode caught live testing
 * Roadmap (the largest structured response, 6-8 nested milestones): the
 * model dropped an opening brace partway through the array. Genuinely
 * transient — the same prompt at the same settings usually succeeds on a
 * second attempt — so this is a bounded one-shot retry, not the "Groq
 * failure → 2-minute Ollama fallback → Groq retry" loop item 16 explicitly
 * forbids.
 */
function isJsonValidationError(error: unknown): boolean {
  return error instanceof Groq.APIError && error.status === 400 && /json_validate_failed|Failed to generate JSON/i.test(error.message);
}

/**
 * Wraps the official `groq-sdk` client (per explicit instruction — every
 * other provider in this app is a plain `fetch` adapter, this one
 * deliberately isn't, since the SDK is the cleanest way to reach the
 * `reasoning_effort`/`reasoning_format` params gpt-oss models expose on
 * Groq). Server-side only: constructed once in `provider.ts` from
 * `env.GROQ_API_KEY`, never imported from client code, and the key itself
 * is never read anywhere else in this file beyond the constructor.
 */
export class GroqProvider implements AIProvider {
  readonly name = "groq";
  private readonly client: Groq;

  constructor(
    apiKey: string,
    private readonly model: string
  ) {
    this.client = new Groq({ apiKey });
  }

  async complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult> {
    // One bounded retry, escalating reasoning effort — see
    // `isJsonValidationError`. Never more than 2 real requests total.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await this.client.chat.completions.create(
          {
            model: this.model,
            messages: messages as Groq.Chat.ChatCompletionMessageParam[],
            temperature: options?.temperature ?? 0.7,
            max_completion_tokens: options?.maxTokens,
            response_format: options?.jsonMode ? { type: "json_object" } : undefined,
            // Every product-generation call here is structured extraction
            // from a profile the model already has, not a problem that
            // benefits from extended reasoning — see `AICompletionMode`.
            // gpt-oss models on Groq don't support "none" the way qwen3
            // does, so "low" is the FAST-mode floor; `mode: "deep"` (unused
            // today) maps to "high". A retry after a JSON-validation
            // rejection bumps to "medium" — more reasoning room measurably
            // helps the model get a large nested structure right the second
            // time. `reasoning_format: "hidden"` keeps any reasoning trace
            // out of `message.content` entirely, so the JSON parser never
            // has to strip a preamble.
            reasoning_effort: options?.mode === "deep" ? "high" : attempt > 1 ? "medium" : "low",
            reasoning_format: "hidden",
          },
          { signal: options?.signal }
        );

        return {
          content: response.choices[0]?.message?.content ?? "",
          provider: this.name,
          model: response.model,
        };
      } catch (error) {
        if (attempt === 1 && options?.jsonMode && isJsonValidationError(error)) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`[groq] jsonMode response failed validation, retrying once with reasoning_effort=medium`);
          }
          continue;
        }
        throw translateGroqError(error, this.model);
      }
    }
    // Unreachable — the loop always returns or throws — but keeps TypeScript's control-flow analysis satisfied.
    throw new Error("unreachable");
  }

  async *stream(messages: AIMessage[], options?: Omit<AICompletionOptions, "jsonMode">): AsyncIterable<string> {
    try {
      const stream = await this.client.chat.completions.create(
        {
          model: this.model,
          messages: messages as Groq.Chat.ChatCompletionMessageParam[],
          temperature: options?.temperature ?? 0.7,
          max_completion_tokens: options?.maxTokens,
          reasoning_effort: options?.mode === "deep" ? "high" : "low",
          reasoning_format: "hidden",
          stream: true,
        },
        { signal: options?.signal }
      );

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    } catch (error) {
      throw translateGroqError(error, this.model);
    }
  }
}
