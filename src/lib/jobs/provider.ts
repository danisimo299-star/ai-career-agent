import { env } from "@/lib/env";
import type { JobsProvider } from "./types";
import { MockJobsProvider } from "./providers/mock.provider";
import { HhJobsProvider } from "./providers/hh.provider";

let cachedProvider: JobsProvider | null = null;

export function getJobsProvider(): JobsProvider {
  if (cachedProvider) return cachedProvider;

  switch (env.JOBS_PROVIDER) {
    case "hh":
      cachedProvider = new HhJobsProvider();
      break;
    case "mock":
    default:
      cachedProvider = new MockJobsProvider();
      break;
  }

  return cachedProvider;
}
