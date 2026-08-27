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

/**
 * A Career Interview answer lost an optimistic-concurrency race — another
 * request for the same user already advanced `Profile.interviewVersion`
 * first (a genuine duplicate/overlapping submit, not a normal error). The
 * whole write transaction was rolled back, so nothing was corrupted or
 * duplicated; the caller should surface a plain "try again" and the client
 * retries with the SAME answer once it re-reads fresh state — see
 * `chat.repository.ts`'s `appendTurnAndUpdateProfile`.
 */
export class ConcurrentInterviewWriteError extends Error {
  constructor() {
    super("Interview answer conflicted with a concurrent write for the same user.");
    this.name = "ConcurrentInterviewWriteError";
  }
}
