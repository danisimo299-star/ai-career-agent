import type { Locale } from "@/lib/i18n/config";
import { professionCatalog } from "@/lib/ai/career/mock-data";
import { compareSkills, normalizeSkills } from "./skill-normalization";

export type SkillPriority = "critical" | "high" | "medium" | "low";

export interface SkillGapItem {
  skill: string;
  priority: SkillPriority;
  /** 0-100, only set for market-based gaps — the % of analyzed vacancies that mention this skill. */
  marketFrequencyPercent?: number;
}

export interface SkillGapResult {
  matched: string[];
  missing: SkillGapItem[];
  gapPercent: number;
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Loose lookup — same "exact title, else substring-of-catalog-key" fallback used by `mock.provider.ts`'s `guessRequiredSkills`, so target-role matching behaves identically across Jobs and the Coach. */
export function findCatalogSkillsForRole(targetRole: string, locale: Locale): string[] | null {
  const needle = targetRole.trim().toLowerCase();
  const match = professionCatalog.find(
    (p) => p.title[locale].toLowerCase() === needle || p.title.en.toLowerCase() === needle || p.title.ru.toLowerCase() === needle || needle.includes(p.key.split("-")[0])
  );
  return match?.skillKeys ?? null;
}

/**
 * Compares the user's real skills (profile + resume) against a target
 * profession's catalog skill list. Deterministic — no AI call, no market
 * data, just the same `professionCatalog` Career Analysis and Jobs already
 * use.
 */
export function computeTargetSkillGap(userSkills: string[], targetRole: string, locale: Locale): SkillGapResult | null {
  const catalogSkills = findCatalogSkillsForRole(targetRole, locale);
  if (!catalogSkills || catalogSkills.length === 0) return null;

  const { matched, missing } = compareSkills(userSkills, catalogSkills);
  const gapPercent = catalogSkills.length === 0 ? 0 : clamp((missing.length / catalogSkills.length) * 100);

  return {
    matched,
    missing: missing.map((skill) => ({ skill, priority: "high" as SkillPriority })),
    gapPercent,
  };
}

const CRITICAL_FREQUENCY_THRESHOLD = 50;
const HIGH_FREQUENCY_THRESHOLD = 35;
const MEDIUM_FREQUENCY_THRESHOLD = 15;

function priorityFromFrequency(frequencyPercent: number): SkillPriority {
  if (frequencyPercent >= CRITICAL_FREQUENCY_THRESHOLD) return "critical";
  if (frequencyPercent >= HIGH_FREQUENCY_THRESHOLD) return "high";
  if (frequencyPercent >= MEDIUM_FREQUENCY_THRESHOLD) return "medium";
  return "low";
}

/**
 * Market-based skill gap (the spec's "job-based skill gap") — aggregates
 * `requiredSkills` across a real set of searched vacancies (mock demo
 * listings or real HH.ru results, whichever the active provider returned)
 * rather than a static profession description, so "Docker appears in 47%
 * of analyzed vacancies" is a real count over real search results, not an
 * invented statistic.
 */
export function computeMarketSkillGap(userSkills: string[], vacancyRequiredSkills: string[][]): SkillGapResult & { analyzedVacancyCount: number } {
  const analyzedVacancyCount = vacancyRequiredSkills.length;
  const frequency = new Map<string, number>();

  for (const skills of vacancyRequiredSkills) {
    for (const skill of normalizeSkills(skills)) {
      frequency.set(skill, (frequency.get(skill) ?? 0) + 1);
    }
  }

  const normalizedUserSkills = new Set(normalizeSkills(userSkills));
  const matched: string[] = [];
  const missing: SkillGapItem[] = [];

  for (const [skill, count] of frequency) {
    const marketFrequencyPercent = analyzedVacancyCount === 0 ? 0 : clamp((count / analyzedVacancyCount) * 100);
    if (normalizedUserSkills.has(skill)) {
      matched.push(skill);
    } else {
      missing.push({ skill, priority: priorityFromFrequency(marketFrequencyPercent), marketFrequencyPercent });
    }
  }

  missing.sort((a, b) => (b.marketFrequencyPercent ?? 0) - (a.marketFrequencyPercent ?? 0));

  const totalRelevantSkills = matched.length + missing.length;
  const gapPercent = totalRelevantSkills === 0 ? 0 : clamp((missing.length / totalRelevantSkills) * 100);

  return { matched, missing, gapPercent, analyzedVacancyCount };
}
