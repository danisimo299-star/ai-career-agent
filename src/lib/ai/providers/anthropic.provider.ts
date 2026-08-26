import type { AICompletionOptions, AICompletionResult, AIMessage, AIProvider } from "../types";

interface AnthropicMessageResponse {
  model: string;
  content: { type: string; text: string }[];
}

interface AnthropicStreamEvent {
  type: string;
  delta?: { type?: string; text?: string };
}

/**
 * Thin adapter over the Anthropic Messages REST API. Mirrors
 * `OpenAIProvider` so either one can be swapped in via `AI_PROVIDER`
 * without touching any calling code.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  constructor(
    private readonly apiKey: string,
    private readonly model = "claude-sonnet-5"
  ) {}

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult> {
    const systemMessage = messages.find((m) => m.role === "system")?.content;
    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        system: systemMessage,
        messages: conversation,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.7,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as AnthropicMessageResponse;

    return {
      content: data.content.map((block) => block.text).join(""),
      provider: this.name,
      model: data.model,
    };
  }

  async *stream(
    messages: AIMessage[],
    options?: Omit<AICompletionOptions, "jsonMode">
  ): AsyncIterable<string> {
    const systemMessage = messages.find((m) => m.role === "system")?.content;
    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        system: systemMessage,
        messages: conversation,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.7,
        stream: true,
      }),
      signal: options?.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Anthropic stream request failed: ${response.status} ${await response.text().catch(() => "")}`);
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
        if (!payload) continue;

        try {
          const event = JSON.parse(payload) as AnthropicStreamEvent;
          if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
            yield event.delta.text;
          }
          if (event.type === "message_stop") return;
        } catch {
          // Ignore a partial/malformed SSE frame — the next chunk completes it.
        }
      }
    }
  }
}
