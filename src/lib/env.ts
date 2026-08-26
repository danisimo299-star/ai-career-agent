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

  JOBS_PROVIDER: z.enum(["mock", "hh"]).default("mock"),
  /// Optional HH.ru OAuth access token (see dev.hh.ru — requires a
  /// registered application). Without it, `HhJobsProvider` never fabricates
  /// vacancies: it returns no live results and the caller falls back to a
  /// real, correctly-parameterized HH.ru search link instead.
  HH_ACCESS_TOKEN: z.string().optional(),
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
