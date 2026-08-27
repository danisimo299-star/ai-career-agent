/**
 * Lightweight per-request timing, development only — never logs answer
 * content, profile data, or anything else user-identifying, only labeled
 * durations, so pipeline bottlenecks (which AI/HH call is actually slow) are
 * visible without a profiler attached.
 */
export function createTimer(label: string) {
  const start = Date.now();
  const marks: { name: string; ms: number }[] = [];

  return {
    mark(name: string) {
      marks.push({ name, ms: Date.now() - start });
    },
    done() {
      if (process.env.NODE_ENV === "production") return;
      const total = Date.now() - start;
      let prev = 0;
      const parts = marks.map((m) => {
        const delta = m.ms - prev;
        prev = m.ms;
        return `${m.name}: ${delta}ms`;
      });
      console.log(`[timing] ${label} — ${parts.join(", ")} — total: ${total}ms`);
    },
  };
}
