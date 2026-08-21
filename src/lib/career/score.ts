import type { CareerDnaScores, ProfileSnapshot } from "@/lib/ai/career/types";

export const scoreStrengthKeys = ["motivation", "technicalInterest", "selfAware"] as const;
export const scoreMissingKeys = ["resume", "roadmap", "interview", "skills"] as const;
export type ScoreStrengthKey = (typeof scoreStrengthKeys)[number];
export type ScoreMissingKey = (typeof scoreMissingKeys)[number];

export interface CareerScoreSignals {
  profile: ProfileSnapshot;
  dna: CareerDnaScores | null;
  hasResume: boolean;
  hasRoadmap: boolean;
  hasCompletedInterview: boolean;
}

export interface CareerScoreResult {
  score: number;
  strengths: ScoreStrengthKey[];
  missing: ScoreMissingKey[];
}

const TECHNICAL_INTERESTS = ["programming", "engineering", "science"];

function profileRichness(profile: ProfileSnapshot): number {
  const fields = [
    Boolean(profile.age),
    Boolean(profile.city),
    Boolean(profile.educationStage),
    profile.interests.length > 0,
    profile.goals.length > 0,
    profile.strengths.length > 0,
    profile.weaknesses.length > 0,
    Boolean(profile.personalitySummary),
    Boolean(profile.salaryExpectation),
  ];
  return (fields.filter(Boolean).length / fields.length) * 100;
}

function dnaAverage(dna: CareerDnaScores | null): number {
  if (!dna) return 0;
  const values = Object.values(dna);
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function computeCareerScore(signals: CareerScoreSignals): CareerScoreResult {
  const strengths: ScoreStrengthKey[] = [];
  if (signals.profile.goals.length > 0) strengths.push("motivation");
  if (signals.profile.interests.some((i) => TECHNICAL_INTERESTS.includes(i))) strengths.push("technicalInterest");
  if (signals.profile.strengths.length > 0 && signals.profile.weaknesses.length > 0) strengths.push("selfAware");

  const missing: ScoreMissingKey[] = [];
  if (!signals.hasResume) missing.push("resume");
  if (!signals.hasRoadmap) missing.push("roadmap");
  if (!signals.hasCompletedInterview) missing.push("interview");
  if (signals.profile.skills.length === 0) missing.push("skills");

  const doneCount = scoreMissingKeys.length - missing.length;
  const checklistScore = (doneCount / scoreMissingKeys.length) * 100;

  const score = Math.round(
    profileRichness(signals.profile) * 0.3 + dnaAverage(signals.dna) * 0.3 + checklistScore * 0.4
  );

  return { score: Math.min(100, Math.max(0, score)), strengths, missing };
}
