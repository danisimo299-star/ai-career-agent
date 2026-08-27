import type { JobRecommendationDTO } from "@/types";
import type { WorkFormat } from "@prisma/client";
import type { JobSearchQuery, JobsProvider, JobEmploymentType, JobExperienceLevel } from "../types";
import { buildHhSearchUrl } from "../hh-reference";
import { professionCatalog } from "@/lib/ai/career/mock-data";

interface ListingTemplate {
  titlePrefix?: string;
  titleSuffix?: string;
  company: string;
  salaryMin: number;
  salaryMax: number;
  experience: JobExperienceLevel;
  employment: JobEmploymentType;
  workFormat: WorkFormat;
}

const LISTING_TEMPLATES: ListingTemplate[] = [
  { titlePrefix: "Junior", company: "Nova Labs", salaryMin: 60000, salaryMax: 85000, experience: "noExperience", employment: "full", workFormat: "ONSITE" },
  { company: "Bright Systems", salaryMin: 90000, salaryMax: 130000, experience: "between1And3", employment: "full", workFormat: "REMOTE" },
  { titlePrefix: "Senior", company: "Northwind Digital", salaryMin: 160000, salaryMax: 220000, experience: "moreThan6", employment: "full", workFormat: "HYBRID" },
  { titleSuffix: "Internship", company: "Foundry Studio", salaryMin: 25000, salaryMax: 40000, experience: "noExperience", employment: "probation", workFormat: "ONSITE" },
  { titleSuffix: "(Part-time)", company: "Loop Analytics", salaryMin: 50000, salaryMax: 70000, experience: "between1And3", employment: "part", workFormat: "REMOTE" },
];

function guessRequiredSkills(targetRole: string, explicitSkills?: string[]): string[] {
  if (explicitSkills && explicitSkills.length > 0) return explicitSkills;

  const needle = targetRole.trim().toLowerCase();
  const match = professionCatalog.find(
    (p) => p.title.en.toLowerCase() === needle || p.title.ru.toLowerCase() === needle || needle.includes(p.key.split("-")[0])
  );
  if (match) return match.skillKeys;

  return ["communication", "problem solving"];
}

function workFormatMatches(vacancyFormat: WorkFormat, queryFormat?: WorkFormat): boolean {
  if (!queryFormat || queryFormat === "ANY") return true;
  return vacancyFormat === queryFormat;
}

/**
 * Static-but-realistic demo listings so search, filters, sorting, and the
 * matching engine are all fully testable without external credentials.
 * `sourceUrl` is always a genuine, correctly-parameterized HH.ru search
 * link (never a fabricated vacancy page) — "Open Vacancy" on a mock result
 * sends the user to a real HH.ru search for that role/city, exactly as it
 * would for a live-API result.
 */
export class MockJobsProvider implements JobsProvider {
  readonly name = "mock";

  async search(query: JobSearchQuery): Promise<JobRecommendationDTO[]> {
    // Only ever one page of demo data — honestly return nothing further
    // rather than repeating the same 5 templates under a "load more" click.
    if (query.page && query.page > 0) return [];

    const city = query.city ?? undefined;
    const requiredSkills = guessRequiredSkills(query.targetRole, query.skills);

    const candidates = query.internshipOnly ? LISTING_TEMPLATES.filter((t) => t.employment === "probation") : LISTING_TEMPLATES;

    return candidates
      .filter((t) => workFormatMatches(t.workFormat, query.workFormat))
      .filter((t) => !query.experience || t.experience === query.experience)
      .filter((t) => !query.employmentTypes || query.employmentTypes.length === 0 || query.employmentTypes.includes(t.employment))
      .filter((t) => !query.salaryMin || t.salaryMax >= query.salaryMin)
      .map((t) => {
        const title = [t.titlePrefix, query.targetRole, t.titleSuffix].filter(Boolean).join(" ");
        return {
          title,
          company: t.company,
          location: t.workFormat === "REMOTE" ? undefined : city,
          salaryMin: t.salaryMin,
          salaryMax: t.salaryMax,
          currency: "RUB",
          matchReason: `${t.company}${city ? ` · ${city}` : ""}`,
          sourceUrl: buildHhSearchUrl({
            text: query.targetRole,
            city,
            workFormat: t.workFormat,
            experience: t.experience,
            employmentTypes: [t.employment],
            salaryMin: query.salaryMin,
          }),
          requiredSkills,
          employmentType: t.employment,
          workFormat: t.workFormat,
          experienceLevel: t.experience,
          isSearchLink: true,
        } satisfies JobRecommendationDTO;
      });
  }
}
