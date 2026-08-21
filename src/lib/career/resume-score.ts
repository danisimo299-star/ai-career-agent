import type { Locale } from "@/lib/i18n/config";
import { findProfessionByTitle } from "@/lib/ai/career/mock-data";
import type { ResumeContent } from "@/types";

export const resumeRecommendationKeys = [
  "addPersonalInfo",
  "addSummary",
  "addExperienceOrProjects",
  "addEducation",
  "addMeasurableResults",
  "addMoreSkills",
  "addKeywords",
  "shortenLongBullets",
] as const;
export type ResumeRecommendationKey = (typeof resumeRecommendationKeys)[number];

export interface ResumeScoreBreakdown {
  structure: number;
  skills: number;
  achievements: number;
  keywords: number;
  readability: number;
  summaryQuality: number;
}

export interface ResumeScoreResult {
  score: number;
  breakdown: ResumeScoreBreakdown;
  recommendations: ResumeRecommendationKey[];
}

const LONG_BULLET_THRESHOLD = 220;
const MAX_LONG_BULLET_PENALTY_ITEMS = 1;

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function allBullets(content: ResumeContent): string[] {
  return content.experience.flatMap((e) => e.bullets);
}

/**
 * Deterministic, explainable — the same reasoning as Career Score
 * (`lib/career/score.ts`): a resume score has to trace back to concrete,
 * actionable checks, not an LLM's opaque judgment call.
 */
export function computeResumeScore(content: ResumeContent, targetRole: string, locale: Locale): ResumeScoreResult {
  const bullets = allBullets(content);
  const hasPersonalInfo = Boolean(content.personalInfo.fullName?.trim()) && Boolean(content.personalInfo.email?.trim());
  const hasSummary = content.summary.trim().length >= 40;
  const hasExperienceOrProjects = content.experience.length > 0 || content.projects.length > 0;
  const hasEducation = content.education.length > 0;

  const structure = clamp(
    (hasPersonalInfo ? 30 : 0) + (hasSummary ? 25 : 0) + (hasExperienceOrProjects ? 25 : 0) + (hasEducation ? 20 : 0)
  );

  const skills = clamp((content.skills.length / 6) * 100);

  const measurableBullets = bullets.filter((b) => /\d/.test(b)).length;
  const achievements = bullets.length === 0 ? 40 : clamp((measurableBullets / bullets.length) * 100);

  const profession = findProfessionByTitle(targetRole, locale);
  let keywords = 70;
  if (profession) {
    const haystack = [content.summary, content.careerObjective, ...content.skills, ...bullets].join(" ").toLowerCase();
    const catalogSkills = profession.skillKeys;
    const matches = catalogSkills.filter((key) => haystack.includes(key)).length;
    keywords = catalogSkills.length === 0 ? 70 : clamp((matches / catalogSkills.length) * 100 + 20);
  }

  const longBullets = bullets.filter((b) => b.length > LONG_BULLET_THRESHOLD).length;
  const readability = bullets.length === 0 ? 60 : clamp(100 - longBullets * 20);

  const summaryQuality = clamp(Math.min(100, (content.summary.trim().length / 120) * 100));

  const score = clamp(
    structure * 0.25 + skills * 0.15 + achievements * 0.2 + keywords * 0.15 + readability * 0.1 + summaryQuality * 0.15
  );

  const recommendations: ResumeRecommendationKey[] = [];
  if (!hasPersonalInfo) recommendations.push("addPersonalInfo");
  if (!hasSummary) recommendations.push("addSummary");
  if (!hasExperienceOrProjects) recommendations.push("addExperienceOrProjects");
  if (!hasEducation) recommendations.push("addEducation");
  if (bullets.length > 0 && measurableBullets / bullets.length < 0.3) recommendations.push("addMeasurableResults");
  if (content.skills.length < 5) recommendations.push("addMoreSkills");
  if (profession && keywords < 50) recommendations.push("addKeywords");
  if (longBullets > MAX_LONG_BULLET_PENALTY_ITEMS) recommendations.push("shortenLongBullets");

  return {
    score,
    breakdown: { structure, skills, achievements, keywords, readability, summaryQuality },
    recommendations: recommendations.slice(0, 5),
  };
}
