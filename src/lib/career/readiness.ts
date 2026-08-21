import type { ApplicationAnalyticsResult } from "./application-analytics";

/**
 * "AI Career Readiness" — deliberately labeled that way (never presented as
 * an objective/scientific measurement) and deliberately a *composite* of
 * dimensions that are each already computed elsewhere by real, explainable
 * logic (Career Score, Resume Score, real interview scores, real match
 * scores, real application status) — this module only combines them, it
 * never invents a sub-score. Any dimension without real data behind it is
 * `null` and excluded from the weighted average (weights renormalize over
 * whatever's actually available) rather than silently defaulted to 0 or 100.
 */
export interface ReadinessBreakdown {
  careerFit: number | null;
  skillReadiness: number | null;
  resumeQuality: number | null;
  interviewReadiness: number | null;
  jobMatch: number | null;
  applicationProgress: number | null;
}

export interface ReadinessResult {
  overall: number;
  breakdown: ReadinessBreakdown;
  availableDimensions: (keyof ReadinessBreakdown)[];
}

const WEIGHTS: Record<keyof ReadinessBreakdown, number> = {
  careerFit: 0.15,
  skillReadiness: 0.25,
  resumeQuality: 0.2,
  interviewReadiness: 0.15,
  jobMatch: 0.15,
  applicationProgress: 0.1,
};

export function computeCareerReadiness(input: ReadinessBreakdown): ReadinessResult {
  const entries = Object.entries(input) as [keyof ReadinessBreakdown, number | null][];
  const available = entries.filter((entry): entry is [keyof ReadinessBreakdown, number] => entry[1] !== null);

  const totalWeight = available.reduce((sum, [key]) => sum + WEIGHTS[key], 0);
  const overall = totalWeight === 0 ? 0 : Math.round(available.reduce((sum, [key, value]) => sum + value * WEIGHTS[key], 0) / totalWeight);

  return { overall, breakdown: input, availableDimensions: available.map(([key]) => key) };
}

const APPLICATION_PROGRESS_BASE_PER_APPLICATION = 5;
const APPLICATION_PROGRESS_BASE_CAP = 50;
const APPLICATION_PROGRESS_INTERVIEW_BONUS = 10;
const APPLICATION_PROGRESS_INTERVIEW_CAP = 30;
const APPLICATION_PROGRESS_OFFER_BONUS = 20;
const APPLICATION_PROGRESS_OFFER_CAP = 20;

/** `null` until the user has applied to at least one saved job — an application-progress score with nothing behind it would be a fabricated 0, not an honest "no data yet." */
export function computeApplicationProgressScore(analytics: ApplicationAnalyticsResult): number | null {
  if (analytics.applications === 0) return null;

  const base = Math.min(APPLICATION_PROGRESS_BASE_CAP, analytics.applications * APPLICATION_PROGRESS_BASE_PER_APPLICATION);
  const interviewBonus = Math.min(APPLICATION_PROGRESS_INTERVIEW_CAP, analytics.interviews * APPLICATION_PROGRESS_INTERVIEW_BONUS);
  const offerBonus = Math.min(APPLICATION_PROGRESS_OFFER_CAP, analytics.offers * APPLICATION_PROGRESS_OFFER_BONUS);

  return Math.min(100, base + interviewBonus + offerBonus);
}
