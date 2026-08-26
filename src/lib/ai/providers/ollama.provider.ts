import { AIProviderUnavailableError } from "@/lib/errors";
import type { AICompletionOptions, AICompletionResult, AIMessage, AIProvider } from "../types";

interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

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
    const response = await ollamaFetch(
      this.baseUrl,
      "/api/chat",
      {
        model: this.model,
        messages,
        stream: false,
        // A reasoning-capable local model (e.g. Qwen3) defaults to emitting a
        // long internal "thinking" trace before the real answer — harmless
        // for correctness (it's returned in a separate `message.thinking`
        // field this provider never reads) but it turned a trivial reply into
        // a 50+ second wait in testing. Coach replies need to feel like a
        // live conversation, not a reasoning benchmark, so thinking is off.
        think: false,
        format: options?.jsonMode ? "json" : undefined,
        options: { temperature: options?.temperature ?? 0.7 },
      },
      options?.signal
    );

    const data = (await response.json()) as OllamaChatResponse;

    return {
      content: data.message?.content ?? "",
      provider: this.name,
      model: data.model,
    };
  }

  async *stream(messages: AIMessage[], options?: Omit<AICompletionOptions, "jsonMode">): AsyncIterable<string> {
    const response = await ollamaFetch(
      this.baseUrl,
      "/api/chat",
      {
        model: this.model,
        messages,
        stream: true,
        think: false,
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
