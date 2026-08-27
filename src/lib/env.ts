import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  AI_PROVIDER: z.enum(["mock", "openai", "anthropic", "ollama"]).default("mock"),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  /// A local Ollama server (see ollama.com) — no API key, since it's not a
  /// hosted service. `OLLAMA_MODEL` must already be pulled locally
  /// (`ollama pull <model>`) before `AI_PROVIDER=ollama` can serve requests.
  OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().optional(),
  /// Bounded in-process concurrency for heavy (`jsonMode`) generation calls
  /// only — chat streaming is never limited by this. A single local Ollama
  /// process has no queueing of its own worth relying on; this makes the
  /// queue explicit and adjustable instead of letting concurrent requests
  /// silently stack up inside Ollama. Default is 1, not a guess: live-tested
  /// at 2 on this deployment's actual hardware (4B model, no dedicated GPU),
  /// two concurrent heavy generations roughly doubled each one's wall time
  /// and pushed Career Analysis past its own 90s abort timeout — running
  /// them one at a time (queued, not dropped) is strictly better on this
  /// hardware than letting both degrade together. Safe to raise for a
  /// hosted/GPU provider later — see `src/lib/ai/concurrency.ts`.
  AI_MAX_CONCURRENT_GENERATIONS: z.coerce.number().int().positive().default(1),

  JOBS_PROVIDER: z.enum(["mock", "hh"]).default("mock"),
  /// Optional HH.ru OAuth access token (see dev.hh.ru — requires a
  /// registered application). Without it, `HhJobsProvider` never fabricates
  /// vacancies: it returns no live results and the caller falls back to a
  /// real, correctly-parameterized HH.ru search link instead.
  HH_ACCESS_TOKEN: z.string().optional(),
  /// Minimum confirmed HH.ru vacancies in the user's city for a recommendation
  /// to count as a normal (non-"limited market") primary suggestion — see
  /// `career-market.service.ts`. Below this it's still shown, just flagged.
  MIN_CITY_VACANCIES_FOR_PRIMARY_CAREER: z.coerce.number().int().positive().default(3),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables. Check .env against .env.example.");
  }

  return parsed.data;
}

export const env = loadEnv();
