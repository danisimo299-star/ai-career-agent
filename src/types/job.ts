export interface JobRecommendationDTO {
  title: string;
  company: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  matchReason: string;
  sourceUrl: string;
  /** Canonical (normalized) skill identifiers the vacancy asks for — never invented, either provider-reported or catalog-derived for demo listings. */
  requiredSkills: string[];
  employmentType?: string;
  workFormat?: "REMOTE" | "HYBRID" | "ONSITE" | "ANY";
  experienceLevel?: string;
  /** False for every listing today (no provider currently returns a real individual vacancy) — `sourceUrl` is a genuine HH.ru *search* page, never a fabricated vacancy page. Set true only when a provider reports a real individual vacancy URL (e.g. a future authenticated `HhJobsProvider` result), so the UI can honestly label "Vacancy" vs "Search on HH.ru" instead of disguising one as the other. */
  isSearchLink: boolean;
  /** ISO timestamp, only when a provider actually reports one (HH.ru's real API) — never fabricated for demo listings. */
  publishedAt?: string;
  /** Short, provider-reported requirement/responsibility snippets — only present for real HH.ru results, never invented for demo listings. */
  requirementSnippet?: string;
  responsibilitySnippet?: string;
}
