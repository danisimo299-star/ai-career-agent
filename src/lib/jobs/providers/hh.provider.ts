import type { JobRecommendationDTO } from "@/types";
import type { WorkFormat } from "@prisma/client";
import { env } from "@/lib/env";
import type { JobSearchQuery, JobsProvider } from "../types";
import { resolveAreaIdLive } from "../hh-areas";
import { buildHHVacancyParams } from "../hh-query";
import { HH_USER_AGENT, fetchHhAuthed } from "../hh-client";
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
  found: number;
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
 *
 * Query params are built by the same `buildHHVacancyParams` the market
 * validator uses (see `career-market.service.ts`) and the area is resolved
 * by the same live `resolveAreaIdLive` — this provider is never the reason
 * a validated recommendation shows 0 vacancies on the Jobs page.
 */
export class HhJobsProvider implements JobsProvider {
  readonly name = "hh";

  async search(query: JobSearchQuery): Promise<JobRecommendationDTO[]> {
    const result = await searchHhVacancies(query);
    return result.status === "ok" ? result.data : [];
  }
}

interface HhVacancySearchOk {
  status: "ok";
  data: JobRecommendationDTO[];
  /** HH's own reported total match count — may exceed `data.length` (capped by `per_page`). */
  found: number;
}

export type HhVacancySearchResult = HhVacancySearchOk | { status: "no_token" | "http_error" | "network_error" };

/**
 * The one real `/vacancies` call in the app — `HhJobsProvider.search()`
 * (Jobs page) and `career-market.service.ts` (recommendation validation)
 * both call this, so they can never diverge on what "search for X" means.
 * Returns a distinguishable status so a caller can tell "confirmed zero"
 * apart from "couldn't check" (item 22 of the market-reality brief).
 */
export async function searchHhVacancies(query: JobSearchQuery): Promise<HhVacancySearchResult> {
  const areaId = await resolveAreaIdLive(query.city);
  const url = new URL("https://api.hh.ru/vacancies");
  url.search = buildHHVacancyParams({
    text: query.targetRole,
    professionalRoleIds: query.professionalRoleIds,
    areaId,
    experience: query.experience,
    employmentTypes: query.employmentTypes,
    workFormat: query.workFormat,
    salaryMin: query.salaryMin,
    page: query.page,
  }).toString();

  const result = await fetchHhAuthed<HhSearchResponse>(url, env.HH_ACCESS_TOKEN);
  if (result.status !== "ok") return result;

  const data = result.data.items.map(mapVacancy).filter((v): v is JobRecommendationDTO => v !== null);
  return { status: "ok", data, found: result.data.found ?? data.length };
}

// Re-exported for any caller that still wants the plain "identify yourself" header value.
export { HH_USER_AGENT };
