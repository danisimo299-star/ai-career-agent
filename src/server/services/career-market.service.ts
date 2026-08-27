import type { MarketDemand } from "@prisma/client";
import { env } from "@/lib/env";
import { resolveProfessionalRole, MIN_PROFESSIONAL_ROLE_MATCH_SCORE, type ProfessionalRoleMatch } from "@/lib/jobs/hh-professional-roles";
import { resolveAreaIdLive } from "@/lib/jobs/hh-areas";
import { searchHhVacancies, type HhVacancySearchResult } from "@/lib/jobs/providers/hh.provider";
import type { JobExperienceLevel } from "@/lib/jobs/types";
import type { CareerRecommendationResult } from "@/lib/ai/career/types";

export interface MarketValidation {
  /** False means: no real HH professional-role category matched this candidate at all — it must never be shown as a primary recommendation (see item 4/44 of the brief: this is a programmatic rejection, not a prompt hint). */
  accepted: boolean;
  hhProfessionalRoleId: number | null;
  hhRoleName: string | null;
  hhAreaId: number | null;
  marketDemand: MarketDemand;
  marketMatchedQuery: string | null;
  vacancyCountCity: number | null;
  vacancyCountRussia: number | null;
  marketCheckedCity: string | null;
  marketCheckedAt: Date;
}

const REJECTED_VALIDATION: Omit<MarketValidation, "marketCheckedAt" | "marketCheckedCity"> = {
  accepted: false,
  hhProfessionalRoleId: null,
  hhRoleName: null,
  hhAreaId: null,
  marketDemand: "UNKNOWN",
  marketMatchedQuery: null,
  vacancyCountCity: null,
  vacancyCountRussia: null,
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { value: MarketValidation; expiresAt: number }>();

function tierFromCount(count: number): MarketDemand {
  if (count >= 15) return "HIGH";
  if (count >= env.MIN_CITY_VACANCIES_FOR_PRIMARY_CAREER) return "MEDIUM";
  return "LOW";
}

function devLog(...parts: unknown[]) {
  if (process.env.NODE_ENV !== "production") console.log("[career-market]", ...parts);
}

interface CascadeStage {
  label: string;
  text: string;
  professionalRoleIds?: number[];
}

function buildCascade(
  role: ProfessionalRoleMatch,
  candidate: Pick<CareerRecommendationResult, "title" | "hhSearchTitle" | "searchAliases">
): CascadeStage[] {
  const aliasText = (candidate.searchAliases ?? []).filter(Boolean).join(" OR ");
  return [
    { label: "professional_role only", text: "", professionalRoleIds: [role.role.id] },
    { label: "canonical title + role", text: candidate.hhSearchTitle || candidate.title, professionalRoleIds: [role.role.id] },
    { label: "aliases + role", text: aliasText, professionalRoleIds: [role.role.id] },
    { label: "canonical title, no role filter", text: candidate.hhSearchTitle || candidate.title },
  ].filter((stage) => stage.professionalRoleIds || stage.text);
}

async function runCascade(stages: CascadeStage[], city: string | null, experience?: JobExperienceLevel) {
  let sawOk = false;
  for (const stage of stages) {
    if (!stage.text && !stage.professionalRoleIds) continue;
    const result: HhVacancySearchResult = await searchHhVacancies({
      targetRole: stage.text,
      city: city ?? undefined,
      professionalRoleIds: stage.professionalRoleIds,
      experience,
    });
    if (result.status === "ok") {
      sawOk = true;
      devLog("  stage:", stage.label, "found:", result.found);
      if (result.found > 0) return { matchedStage: stage, count: result.found, sawOk };
    } else {
      devLog("  stage:", stage.label, "unavailable:", result.status);
    }
  }
  return { matchedStage: null, count: sawOk ? 0 : null, sawOk };
}

/**
 * The full "AI candidate → real market" pipeline (items 1-16 of the
 * market-reality brief): resolve against HH's own closed professional-role
 * catalog first (programmatic, not prompt-based — a candidate with no
 * confident match is rejected outright), then run a real HH `/vacancies`
 * cascade (professional_role+city → canonical title+city → aliases+city →
 * nationwide) for both the city and nationwide counts, sharing the exact
 * same `buildHHVacancyParams` the Jobs page search uses.
 */
export async function validateCareerMarket(
  candidate: Pick<CareerRecommendationResult, "title" | "hhSearchTitle" | "searchAliases" | "firstJobTitle">,
  city: string | null,
  experience?: JobExperienceLevel
): Promise<MarketValidation> {
  const cacheKey = `${candidate.hhSearchTitle}|${candidate.title}::${city ?? "RU"}::${experience ?? "any"}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  devLog("candidate:", candidate.title);

  const role = await resolveProfessionalRole([candidate.hhSearchTitle, candidate.title, ...(candidate.searchAliases ?? []), candidate.firstJobTitle]);

  if (!role || role.score < MIN_PROFESSIONAL_ROLE_MATCH_SCORE) {
    devLog("  REJECTED — no confident HH professional_role match", role ? `(best score ${role.score.toFixed(2)} for "${role.role.name}")` : "");
    const value: MarketValidation = { ...REJECTED_VALIDATION, marketCheckedCity: city, marketCheckedAt: new Date() };
    cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  devLog("  resolved HH role:", role.role.name, `(id=${role.role.id}, score=${role.score.toFixed(2)}, exact=${role.exact})`);

  const stages = buildCascade(role, candidate);

  // The city cascade and the nationwide cascade are independent HH lookups —
  // running them one after another (`await` then `await`) doubled this
  // candidate's network wait for no reason; `resolveAreaIdLive` is also
  // independent of both, so all three go out together.
  const [areaId, cityResult, russiaResult] = await Promise.all([
    resolveAreaIdLive(city),
    city ? runCascade(stages, city, experience) : Promise.resolve({ matchedStage: null, count: null, sawOk: false }),
    runCascade(stages, null, experience),
  ]);

  devLog("  city:", city ?? "—", "vacancies:", cityResult.count, "| Russia vacancies:", russiaResult.count);

  const bestCount = city ? cityResult.count : russiaResult.count;
  const checkedSomething = cityResult.sawOk || russiaResult.sawOk;
  const marketDemand: MarketDemand = !checkedSomething ? "UNKNOWN" : bestCount === null ? "UNKNOWN" : tierFromCount(bestCount);

  devLog("  ACCEPTED —", marketDemand);

  const value: MarketValidation = {
    accepted: true,
    hhProfessionalRoleId: role.role.id,
    hhRoleName: role.role.name,
    hhAreaId: areaId,
    marketDemand,
    marketMatchedQuery: (cityResult.matchedStage ?? russiaResult.matchedStage)?.text || role.role.name,
    vacancyCountCity: cityResult.count,
    vacancyCountRussia: russiaResult.count,
    marketCheckedCity: city,
    marketCheckedAt: new Date(),
  };

  cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/** Best-effort, per-recommendation — one failed lookup never blocks the others. */
export async function validateCareerMarketBatch(
  candidates: Pick<CareerRecommendationResult, "title" | "hhSearchTitle" | "searchAliases" | "firstJobTitle">[],
  city: string | null,
  experience?: JobExperienceLevel
): Promise<MarketValidation[]> {
  return Promise.all(
    candidates.map((candidate) =>
      // `accepted: true` here is deliberate: an *unexpected* exception (a bug,
      // not a normal no-token/http-error path — those are already handled
      // inside `validateCareerMarket`) shouldn't silently hide a possibly-good
      // recommendation. Only a confident professional-role mismatch rejects a
      // candidate; an inconclusive check just means an honestly unknown demand.
      validateCareerMarket(candidate, city, experience).catch(
        (): MarketValidation => ({ ...REJECTED_VALIDATION, accepted: true, marketCheckedCity: city, marketCheckedAt: new Date() })
      )
    )
  );
}
