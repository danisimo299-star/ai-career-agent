import type { JobRecommendationDTO } from "@/types";
import type { WorkFormat } from "@prisma/client";
import { env } from "@/lib/env";
import type { JobSearchQuery, JobsProvider } from "../types";
import { resolveHhAreaId, workFormatToHhSchedule } from "../hh-reference";
import { isTrustedHhUrl } from "@/lib/security/url-safety";

interface HhVacancy {
  name: string;
  employer?: { name?: string };
  area?: { name?: string };
  salary?: { from?: number | null; to?: number | null; currency?: string | null } | null;
  alternate_url: string;
  key_skills?: { name: string }[];
  employment?: { id?: string };
  experience?: { id?: string };
  schedule?: { id?: string };
  published_at?: string;
  snippet?: { requirement?: string | null; responsibility?: string | null };
}

interface HhSearchResponse {
  items: HhVacancy[];
}

function hhScheduleToWorkFormat(scheduleId?: string): WorkFormat {
  if (scheduleId === "remote") return "REMOTE";
  return "ONSITE";
}

/** HH's snippet text wraps matched keywords in `<highlighttext>` tags — strip all markup before it ever reaches the UI. */
function stripHtml(value?: string | null): string | undefined {
  if (!value) return undefined;
  const stripped = value.replace(/<[^>]*>/g, "").trim();
  return stripped.length > 0 ? stripped : undefined;
}

function mapVacancy(vacancy: HhVacancy): JobRecommendationDTO | null {
  // A real HH.ru API response should always report an hh.ru URL — reject
  // anything else defensively rather than ever rendering an unverified link.
  if (!isTrustedHhUrl(vacancy.alternate_url)) return null;

  return {
    title: vacancy.name,
    company: vacancy.employer?.name ?? "—",
    location: vacancy.area?.name,
    salaryMin: vacancy.salary?.from ?? undefined,
    salaryMax: vacancy.salary?.to ?? undefined,
    currency: vacancy.salary?.currency ?? undefined,
    matchReason: `${vacancy.employer?.name ?? ""}${vacancy.area?.name ? ` · ${vacancy.area.name}` : ""}`,
    // Real vacancy URL reported by HH.ru itself — never a constructed/guessed one.
    sourceUrl: vacancy.alternate_url,
    isSearchLink: false,
    requiredSkills: (vacancy.key_skills ?? []).map((s) => s.name),
    employmentType: vacancy.employment?.id,
    workFormat: hhScheduleToWorkFormat(vacancy.schedule?.id),
    experienceLevel: vacancy.experience?.id,
    publishedAt: vacancy.published_at,
    requirementSnippet: stripHtml(vacancy.snippet?.requirement),
    responsibilitySnippet: stripHtml(vacancy.snippet?.responsibility),
  };
}

/**
 * Real HH.ru API integration, shaped for the live `GET
 * https://api.hh.ru/vacancies` endpoint. As of this integration (see
 * ARCHITECTURE.md's "Job Matching" section for the live-verified research),
 * that endpoint returns 403 for anonymous requests — it requires an OAuth
 * token from a registered application at dev.hh.ru, which this deployment
 * does not have configured by default.
 *
 * Without `HH_ACCESS_TOKEN` set, `search()` returns an empty array rather
 * than fabricating vacancies — `jobsService` always separately builds a
 * real HH.ru search link (`buildHhSearchUrl`) so the product stays useful
 * either way. Once a token is configured, this same code path starts
 * returning real, provider-reported vacancy data with genuine
 * `alternate_url`s — no other code changes needed.
 */
export class HhJobsProvider implements JobsProvider {
  readonly name = "hh";

  async search(query: JobSearchQuery): Promise<JobRecommendationDTO[]> {
    if (!env.HH_ACCESS_TOKEN) return [];

    try {
      const url = new URL("https://api.hh.ru/vacancies");
      url.searchParams.set("text", query.targetRole);
      url.searchParams.set("area", String(resolveHhAreaId(query.city)));
      url.searchParams.set("search_field", "name");
      url.searchParams.set("per_page", "20");
      if (query.experience) url.searchParams.set("experience", query.experience);
      for (const employment of query.employmentTypes ?? []) url.searchParams.append("employment", employment);
      const schedule = workFormatToHhSchedule(query.workFormat);
      if (schedule) url.searchParams.set("schedule", schedule);
      if (query.salaryMin) {
        url.searchParams.set("salary", String(query.salaryMin));
        url.searchParams.set("only_with_salary", "true");
      }

      const response = await fetch(url, {
        headers: {
          "User-Agent": "AI-Career-Agent/1.0 (contact: support@ai-career-agent.local)",
          Authorization: `Bearer ${env.HH_ACCESS_TOKEN}`,
        },
      });

      if (!response.ok) return [];

      const data = (await response.json()) as HhSearchResponse;
      return (data.items ?? []).map(mapVacancy).filter((v): v is JobRecommendationDTO => v !== null);
    } catch {
      return [];
    }
  }
}
