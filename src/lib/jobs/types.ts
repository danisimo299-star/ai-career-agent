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
  /** HH's own professional-role category id(s), when a career recommendation already resolved to one — see `hh-professional-roles.ts`. Narrows the search far more reliably than free text alone. */
  professionalRoleIds?: number[];
  /** 0-based — "Показать ещё вакансии" fetches the next page instead of re-running page 0. */
  page?: number;
}

/**
 * Why a search reports no vacancies. An empty `results` array is ambiguous on
 * its own, and the difference matters to the user: "this search really has no
 * matches" is a fact about the job market, while "we could not reach HH.ru" is
 * a fact about us. Collapsing the latter into the former makes the app state
 * something false with full confidence, so the distinction is carried in the
 * contract rather than reconstructed downstream.
 */
export type JobProviderSearchStatus =
  /** The provider answered. `results` is the real, complete answer — including a genuinely empty one. */
  | "ok"
  /** No credentials configured, so no live search was attempted. */
  | "not_configured"
  /** The provider was asked and failed (rejected credentials, HTTP error, network error). Nothing is known about the market. */
  | "unavailable";

export interface JobProviderSearchResult {
  status: JobProviderSearchStatus;
  results: JobRecommendationDTO[];
}

/**
 * Job board integrations (HH.ru, LinkedIn, etc.) all implement this
 * contract. `MockJobsProvider` is the always-on demo source; `HhJobsProvider`
 * performs a real authenticated search when `HH_CLIENT_ID`/`HH_CLIENT_SECRET`
 * are configured and otherwise reports `not_configured` (never fabricated
 * results) — either way, `jobsService` always additionally computes a real
 * HH.ru search link via `buildHhSearchUrl` so the product stays useful with
 * zero credentials.
 */
export interface JobsProvider {
  readonly name: string;
  search(query: JobSearchQuery): Promise<JobProviderSearchResult>;
}
