function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32 — small, fast, deterministic PRNG from a numeric seed. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A `Math.random()`-shaped [0, 1) generator seeded from a string — same input always produces the same sequence. */
export function seededRandom(seed: string): () => number {
  return mulberry32(hashString(seed || "career-agent"));
}

/** Deterministically picks one item from a non-empty array, seeded by a string. */
export function seededPick<T>(items: readonly T[], seed: string): T {
  const random = seededRandom(seed);
  return items[Math.floor(random() * items.length)];
}
