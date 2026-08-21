import type { WorkFormat } from "@prisma/client";
import type { JobRecommendationDTO } from "@/types";
import type { HH_EMPLOYMENT_VALUES, HH_EXPERIENCE_VALUES } from "./hh-reference";

/** HH.ru's own employment vocabulary — reused directly rather than inventing a parallel one. "probation" is HH's id for internship/trial positions. */
export type JobEmploymentType = (typeof HH_EMPLOYMENT_VALUES)[number];
/** HH.ru's own experience vocabulary. */
export type JobExperienceLevel = (typeof HH_EXPERIENCE_VALUES)[number];

export type JobSortOrder = "bestMatch" | "highestSalary" | "newest" | "lowestExperience";

export interface JobSearchQuery {
  targetRole: string;
  city?: string;
  workFormat?: WorkFormat;
  skills?: string[];
  experience?: JobExperienceLevel;
  employmentTypes?: JobEmploymentType[];
  salaryMin?: number;
  internshipOnly?: boolean;
}

/**
 * Job board integrations (HH.ru, LinkedIn, etc.) all implement this
 * contract. `MockJobsProvider` is the always-on demo source; `HhJobsProvider`
 * performs a real authenticated search when `HH_ACCESS_TOKEN` is configured
 * and otherwise returns no results (never fabricated ones) — either way,
 * `jobsService` always additionally computes a real HH.ru search link via
 * `buildHhSearchUrl` so the product stays useful with zero credentials.
 */
export interface JobsProvider {
  readonly name: string;
  search(query: JobSearchQuery): Promise<JobRecommendationDTO[]>;
}
