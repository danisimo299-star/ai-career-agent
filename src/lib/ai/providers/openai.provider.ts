import type { AICompletionOptions, AICompletionResult, AIMessage, AIProvider } from "../types";

interface OpenAIChatCompletionResponse {
  model: string;
  choices: { message: { content: string } }[];
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
}
