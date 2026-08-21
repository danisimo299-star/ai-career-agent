import type { AICompletionOptions, AICompletionResult, AIMessage, AIProvider } from "../types";

/**
 * Deterministic, zero-dependency provider used in local development and
 * tests when no real API key is configured. Lets the rest of the app
 * (chat, career analysis, interview prep) be built and tested end-to-end
 * before an OpenAI/Anthropic key ever exists.
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

    const content = options?.jsonMode
      ? JSON.stringify({ mock: true, echo: lastUserMessage?.content ?? "" })
      : `[mock reply] ${lastUserMessage?.content ?? "Hello!"}`;

    return {
      content,
      provider: this.name,
      model: "mock-1",
    };
  }
}
