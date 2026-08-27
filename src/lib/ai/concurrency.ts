/** Thrown when a request waited in the bounded-concurrency queue longer than the gate's queue-wait cap — a deliberate "busy, try again" signal instead of silently waiting forever (item 29 of the performance brief: no unbounded queue). */
export class AICapacityError extends Error {
  constructor(message = "AI generation queue is full — try again shortly.") {
    super(message);
    this.name = "AICapacityError";
  }
}

/**
 * A minimal, in-process bounded-concurrency gate — no Redis/queue service,
 * just a counter and a resolve-callback queue. Deliberately not a "real"
 * job queue: this exists so a local Ollama process (which has no useful
 * concurrency of its own) never receives more heavy generation requests at
 * once than it can actually make progress on, while still presenting a
 * single clean abstraction (`run`) that a future hosted/GPU provider can
 * just configure with a higher limit instead of removing.
 *
 * Bounded on BOTH ends: `limit` caps how many calls actually run at once,
 * and `maxQueueWaitMs` caps how long a call is allowed to sit waiting for a
 * slot before it's rejected outright — a request that's been queued too
 * long fails fast and honestly (`AICapacityError`) rather than eventually
 * running so late that it blows through the caller's own generation
 * deadline (that exact bug was caught live: a caller's `AbortController`
 * timeout starts ticking the moment the call is made, not the moment it
 * actually begins running, so an unbounded queue silently ate into the
 * time the generation itself needed).
 */
export class BoundedConcurrency {
  private active = 0;
  private readonly queue: (() => void)[] = [];

  constructor(
    private readonly limit: number,
    private readonly maxQueueWaitMs = 60_000
  ) {}

  get activeCount(): number {
    return this.active;
  }

  get queuedCount(): number {
    return this.queue.length;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) {
      await this.waitForSlot();
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      const next = this.queue.shift();
      if (next) next();
    }
  }

  private waitForSlot(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const entry = () => {
        if (settled) return; // already timed out — don't grant a slot to a caller that's already given up
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        const idx = this.queue.indexOf(entry);
        if (idx !== -1) this.queue.splice(idx, 1);
        reject(new AICapacityError());
      }, this.maxQueueWaitMs);
      this.queue.push(entry);
    });
  }
}
