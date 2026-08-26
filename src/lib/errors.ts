export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} is not implemented yet — scaffolded per architecture, see TODO.md.`);
    this.name = "NotImplementedError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * The AI provider itself couldn't be reached or produced no usable response
 * — a down local Ollama server, a DNS/network failure, a model that isn't
 * pulled — as opposed to a request-shape or application-logic error. Kept
 * distinct so the UI can show "the AI service is unreachable" instead of a
 * generic failure message.
 */
export class AIProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderUnavailableError";
  }
}
