import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  /// The legacy single-provider switch — still the fallback both
  /// `AI_CHAT_PROVIDER` and `AI_GENERATION_PROVIDER` resolve to when unset,
  /// and still what `getAICareerService()` checks for the `mock` gate.
  AI_PROVIDER: z.enum(["mock", "openai", "anthropic", "ollama", "groq"]).default("mock"),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  /// A local Ollama server (see ollama.com) — no API key, since it's not a
  /// hosted service. `OLLAMA_MODEL` must already be pulled locally
  /// (`ollama pull <model>`) before `AI_PROVIDER=ollama` can serve requests.
  OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().optional(),
  /// Hosted, fast inference (see console.groq.com) — used for heavy
  /// structured generation (Career Analysis, Roadmap, Resume, Missions,
  /// Interview, Job Prep) while Chat stays on Ollama. Server-side only:
  /// never read outside `providers/groq.provider.ts`, never sent to the
  /// client, never logged.
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("openai/gpt-oss-20b"),
  /// Which concrete provider handles live conversational calls (Coach chat
  /// streaming, the Career Interview's chat acknowledgement) vs. discrete
  /// "Generate ..." product features — see `getChatProvider()` /
  /// `getGenerationProvider()` in `provider.ts`. Each falls back to
  /// `AI_PROVIDER` when unset, so a deployment that only sets `AI_PROVIDER`
  /// keeps working exactly as before.
  AI_CHAT_PROVIDER: z.enum(["mock", "openai", "anthropic", "ollama", "groq"]).optional(),
  AI_GENERATION_PROVIDER: z.enum(["mock", "openai", "anthropic", "ollama", "groq"]).optional(),
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
