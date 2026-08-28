import { z } from "zod";

const AI_PROVIDER_NAMES = ["mock", "openai", "anthropic", "ollama", "groq"] as const;

const baseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  /// The legacy single-provider switch — still the fallback both
  /// `AI_CHAT_PROVIDER` and `AI_GENERATION_PROVIDER` resolve to when unset,
  /// and still what `getAICareerService()` checks for the `mock` gate.
  AI_PROVIDER: z.enum(AI_PROVIDER_NAMES).default("mock"),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  /// A local Ollama server (see ollama.com) — no API key, since it's not a
  /// hosted service. `OLLAMA_MODEL` must already be pulled locally
  /// (`ollama pull <model>`) before `AI_PROVIDER=ollama` can serve requests.
  /// Never required just because this schema loads — only when Ollama is
  /// actually the resolved provider for chat or generation (enforced below,
  /// in `.superRefine()` — a production deployment that only uses Groq must
  /// never be blocked on an Ollama variable it will never read).
  OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().optional(),
  /// Hosted, fast inference (see console.groq.com) — used for heavy
  /// structured generation (Career Analysis, Roadmap, Resume, Missions,
  /// Interview, Job Prep) while Chat stays on Ollama. Server-side only:
  /// never read outside `providers/groq.provider.ts`, never sent to the
  /// client, never logged. Required only when Groq is actually the
  /// resolved provider for chat or generation — see `.superRefine()` below.
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("openai/gpt-oss-20b"),
  /// Which concrete provider handles live conversational calls (Coach chat
  /// streaming, the Career Interview's chat acknowledgement) vs. discrete
  /// "Generate ..." product features — see `getChatProvider()` /
  /// `getGenerationProvider()` in `provider.ts`. Each falls back to
  /// `AI_PROVIDER` when unset, so a deployment that only sets `AI_PROVIDER`
  /// keeps working exactly as before.
  AI_CHAT_PROVIDER: z.enum(AI_PROVIDER_NAMES).optional(),
  AI_GENERATION_PROVIDER: z.enum(AI_PROVIDER_NAMES).optional(),
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

/**
 * `AI_PROVIDER`/`AI_CHAT_PROVIDER`/`AI_GENERATION_PROVIDER` each independently
 * pick a provider name, and only the provider(s) actually *resolved to* need
 * their credentials present — never every provider this app knows how to
 * talk to. A production deployment running Groq-only must build cleanly
 * with zero Ollama/OpenAI/Anthropic variables set, and vice versa.
 */
const envSchema = baseEnvSchema.superRefine((data, ctx) => {
  const resolvedProviders = new Set([data.AI_PROVIDER, data.AI_CHAT_PROVIDER, data.AI_GENERATION_PROVIDER]);

  const requireWhenResolved = (provider: (typeof AI_PROVIDER_NAMES)[number], field: keyof typeof data, envVarName: string) => {
    if (resolvedProviders.has(provider) && !data[field]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${envVarName} is required because AI_PROVIDER, AI_CHAT_PROVIDER, or AI_GENERATION_PROVIDER is set to "${provider}".`,
      });
    }
  };

  requireWhenResolved("groq", "GROQ_API_KEY", "GROQ_API_KEY");
  requireWhenResolved("ollama", "OLLAMA_MODEL", "OLLAMA_MODEL");
  requireWhenResolved("openai", "OPENAI_API_KEY", "OPENAI_API_KEY");
  requireWhenResolved("anthropic", "ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY");
});

export type Env = z.infer<typeof baseEnvSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    // The exact failing variable(s) go in the thrown message itself, not
    // just `console.error` — a build log excerpt often only captures the
    // final thrown `Error:` line, which used to say nothing more specific
    // than "Invalid environment variables", making the real cause a guess.
    const details = Object.entries(fieldErrors)
      .map(([key, messages]) => `${key}: ${(messages ?? []).join("; ")}`)
      .join(" | ");
    console.error("Invalid environment variables:", fieldErrors);
    throw new Error(`Invalid environment variables — ${details || "see server logs for details"}. Check .env against .env.example.`);
  }

  return parsed.data as Env;
}

export const env = loadEnv();
