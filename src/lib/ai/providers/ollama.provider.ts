import { AIProviderUnavailableError } from "@/lib/errors";
import { env } from "@/lib/env";
import { BoundedConcurrency } from "../concurrency";
import type { AICompletionOptions, AICompletionResult, AIMessage, AIProvider } from "../types";

// Module-level (one process, one local Ollama server) — every `OllamaProvider`
// instance shares the same gate, since `getAIProvider()` already caches a
// single instance anyway, but this is correct even if that ever changes.
// 120s queue-wait cap: comfortably above the slowest single generation
// measured live on this deployment (Roadmap, ~87-102s) so a request queued
// behind exactly one other heavy job still gets its turn; a longer wait
// means the queue is genuinely backed up, not just "unlucky timing".
const generationGate = new BoundedConcurrency(env.AI_MAX_CONCURRENT_GENERATIONS, 120_000);

interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

/**
 * Ollama's own default `keep_alive` is 5 minutes — plenty for one Chat turn,
 * but shorter than the time a user often spends filling out a form between
 * "Generate" clicks (an onboarding step, reading a roadmap, editing a
 * resume). Once the model unloads, the *next* request pays a real reload
 * cost on top of its own generation time — live-measured on this deployment
 * at ~5s, small next to a ~50-100s generation but still pure waste. 30
 * minutes keeps the model resident across a normal session without holding
 * it in memory indefinitely on a genuinely idle server.
 */
const KEEP_ALIVE = "30m";

async function ollamaFetch(baseUrl: string, path: string, body: unknown, signal?: AbortSignal): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AIProviderUnavailableError(`Could not reach Ollama at ${baseUrl} — is it running? (\`ollama serve\`)`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    // A missing/unpulled model is still a reachable server, but the request
    // can never succeed without `ollama pull <model>` — surfaced the same
    // way as "unreachable" since neither is fixable by retrying the request.
    if (response.status === 404) {
      throw new AIProviderUnavailableError(`Ollama model not found — run \`ollama pull <model>\` first. (${text})`);
    }
    throw new Error(`Ollama request failed: ${response.status} ${text}`);
  }

  return response;
}

/**
 * Thin adapter over a local Ollama server's native `/api/chat` endpoint (no
 * API key — it's not a hosted service). Mirrors `OpenAIProvider`/
 * `AnthropicProvider` so `AI_PROVIDER=ollama` needs no other code changes;
 * `format: "json"` is Ollama's equivalent of `jsonMode`.
 */
export class OllamaProvider implements AIProvider {
  readonly name = "ollama";

  constructor(
    private readonly baseUrl: string,
    private readonly model: string
  ) {}

  async complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult> {
    const run = async () => {
      const response = await ollamaFetch(
        this.baseUrl,
        "/api/chat",
        {
          model: this.model,
          messages,
          stream: false,
          keep_alive: KEEP_ALIVE,
          // A reasoning-capable local model (e.g. Qwen3) defaults to emitting a
          // long internal "thinking" trace before the real answer — harmless
          // for correctness (it's returned in a separate `message.thinking`
          // field this provider never reads) but it turned a trivial reply into
          // a 50+ second wait in testing. See `AICompletionMode` — every call
          // site in this app is "fast" (the default) today; `think` only
          // turns on if a caller explicitly asks for `mode: "deep"`.
          think: options?.mode === "deep",
          format: options?.jsonMode ? "json" : undefined,
          // Structured product-analysis calls ask for a few short sentences
          // per field, never an essay — bounding `num_predict` stops a local
          // model from wandering into a much longer generation than the
          // response actually needs, which was a direct contributor to the
          // multi-second-to-a-minute Career Analysis latency (num_ctx large
          // enough to hold the whole prompt + conversation history without
          // Ollama silently truncating older turns).
          options: { temperature: options?.temperature ?? 0.7, num_predict: options?.maxTokens ?? 500, num_ctx: 8192 },
        },
        options?.signal
      );

      const data = (await response.json()) as OllamaChatResponse;

      return {
        content: data.message?.content ?? "",
        provider: this.name,
        model: data.model,
      };
    };

    // Bounded (item 28/29 of the performance brief): every real product
    // generation (Career Analysis, Roadmap, Resume, ...) queues here so a
    // single local Ollama process never receives more heavy requests at
    // once than it can actually make progress on. `skipConcurrencyGate` is
    // the one deliberate exception — Coach's intent/memory classification
    // uses `complete()` too, but it's part of a live chat turn, not a
    // "generate" button; it must never wait behind a queue of unrelated
    // heavy generations (verified live: without this, a busy queue visibly
    // delayed chat's suggested-actions, which item 6 explicitly forbids).
    if (options?.skipConcurrencyGate) return run();
    return generationGate.run(run);
  }

  async *stream(messages: AIMessage[], options?: Omit<AICompletionOptions, "jsonMode">): AsyncIterable<string> {
    // Chat is explicitly out of scope for this pass — this keeps its exact
    // prior behavior (thinking always off) since no chat call site passes
    // `mode`, it's just expressed through the same `AICompletionMode`
    // mechanism as `complete()` instead of a second hardcoded `false`.
    const response = await ollamaFetch(
      this.baseUrl,
      "/api/chat",
      {
        model: this.model,
        messages,
        stream: true,
        keep_alive: KEEP_ALIVE,
        think: options?.mode === "deep",
        options: { temperature: options?.temperature ?? 0.7 },
      },
      options?.signal
    );

    if (!response.body) throw new AIProviderUnavailableError(`Ollama at ${this.baseUrl} returned no response body.`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Ollama streams newline-delimited JSON objects, not SSE `data:` frames.
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const chunk = JSON.parse(trimmed) as OllamaChatResponse;
          if (chunk.message?.content) yield chunk.message.content;
          if (chunk.done) return;
        } catch {
          // Ignore a partial/malformed line — the next chunk completes it.
        }
      }
    }
  }
}
