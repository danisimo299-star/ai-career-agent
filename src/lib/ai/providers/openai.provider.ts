import type { AICompletionOptions, AICompletionResult, AIMessage, AIProvider } from "../types";

interface OpenAIChatCompletionResponse {
  model: string;
  choices: { message: { content: string } }[];
}

interface OpenAIStreamChunk {
  choices: { delta: { content?: string } }[];
}

/**
 * Thin adapter over the OpenAI Chat Completions REST API. No SDK dependency
 * on purpose — one fetch call keeps the abstraction boundary honest and
 * avoids coupling the app to a provider-specific client.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model = "gpt-4o-mini"
  ) {}

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        response_format: options?.jsonMode ? { type: "json_object" } : undefined,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as OpenAIChatCompletionResponse;

    return {
      content: data.choices[0]?.message?.content ?? "",
      provider: this.name,
      model: data.model,
    };
  }

  async *stream(
    messages: AIMessage[],
    options?: Omit<AICompletionOptions, "jsonMode">
  ): AsyncIterable<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        stream: true,
      }),
      signal: options?.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`OpenAI stream request failed: ${response.status} ${await response.text().catch(() => "")}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice("data:".length).trim();
        if (payload === "[DONE]") return;

        try {
          const chunk = JSON.parse(payload) as OpenAIStreamChunk;
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Ignore a partial/malformed SSE frame — the next chunk completes it.
        }
      }
    }
  }
}
