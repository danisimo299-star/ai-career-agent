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
