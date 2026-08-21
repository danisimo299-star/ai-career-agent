import type { ExperienceLevel, WorkFormat } from "@prisma/client";
import { compareSkills, normalizeSkills } from "./skill-normalization";
import type { JobExperienceLevel } from "@/lib/jobs/types";

/**
 * Deterministic job matching engine — the source of truth for every match
 * score in the product. Architecture mandated by the spec: User Profile ->
 * Normalization (`skill-normalization.ts`) -> rule-based matching (this
 * file) -> score. AI is never in this path; `AICareerService.
 * generateJobPreparationPlan` only narrates a result this module already
 * computed, for the one screen (Prepare for this job) where narration adds
 * real value.
 *
 * Returns semantic keys, never prose — same convention as
 * `lib/career/score.ts` / `resume-score.ts` — so every string stays
 * translatable via the RU/EN dictionaries instead of being baked in here.
 */

export interface JobMatchBreakdown {
  skills: number;
  experience: number;
  location: number;
  careerGoal: number;
  salary: number;
}

export interface JobMatchVacancyInput {
  title: string;
  location?: string | null;
  workFormat?: WorkFormat | null;
  /** HH.ru experience vocabulary (noExperience/between1And3/between3And6/moreThan6), when known. */
  experienceLevel?: string | null;
  requiredSkills: string[];
  salaryMin?: number | null;
}

export interface JobMatchInput {
  userSkills: string[];
  roadmapSkills: string[];
  targetRole: string;
  careerGoals: string[];
  experienceLevel: ExperienceLevel | null;
  city: string | null;
  preferredFormat: WorkFormat | null;
  salaryExpectation: number | null;
  careerScore: number | null;
  vacancy: JobMatchVacancyInput;
}

export interface JobMatchResult {
  score: number;
  breakdown: JobMatchBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  /** A roadmap-priority skill this vacancy also requires, or null — lets the UI render "X is one of your roadmap priorities and this vacancy requires it." */
  roadmapPrioritySkill: string | null;
  /** True when the user's overall Career Score is still low but this specific vacancy is a strong match — the UI uses this to frame the result positively rather than as a rejection. */
  positiveFraming: boolean;
}

const WEIGHTS = { skills: 0.35, experience: 0.15, location: 0.15, careerGoal: 0.2, salary: 0.15 } as const;

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

const USER_EXPERIENCE_RANK: Record<ExperienceLevel, number> = {
  STUDENT: 0,
  GRADUATE: 0,
  CAREER_CHANGER: 0,
  JUNIOR: 1,
  MID: 2,
  SENIOR: 3,
};

const HH_EXPERIENCE_RANK: Record<string, number> = {
  noExperience: 0,
  between1And3: 1,
  between3And6: 2,
  moreThan6: 3,
};

function scoreExperience(userLevel: ExperienceLevel | null, vacancyLevel?: string | null): number {
  if (!vacancyLevel || !(vacancyLevel in HH_EXPERIENCE_RANK)) return 70;
  const userRank = userLevel ? USER_EXPERIENCE_RANK[userLevel] : 0;
  const vacancyRank = HH_EXPERIENCE_RANK[vacancyLevel];
  const diff = Math.abs(userRank - vacancyRank);
  if (diff === 0) return 100;
  if (diff === 1) return 65;
  if (diff === 2) return 35;
  return 15;
}

function scoreLocation(
  city: string | null,
  preferredFormat: WorkFormat | null,
  vacancyLocation: string | null | undefined,
  vacancyFormat: WorkFormat | null | undefined
): number {
  if (vacancyFormat === "REMOTE" || preferredFormat === "REMOTE") return 90;
  if (!city || !vacancyLocation) return 55;
  return city.trim().toLowerCase() === vacancyLocation.trim().toLowerCase() ? 100 : 30;
}

function scoreCareerGoal(targetRole: string, careerGoals: string[], vacancyTitle: string): number {
  const haystack = vacancyTitle.trim().toLowerCase();
  const needle = targetRole.trim().toLowerCase();
  if (needle && haystack.includes(needle)) return 100;

  if (careerGoals.some((goal) => goal.trim() && haystack.includes(goal.trim().toLowerCase()))) return 85;

  const titleWords = new Set(haystack.split(/\s+/).filter((w) => w.length > 2));
  const roleWords = needle.split(/\s+/).filter((w) => w.length > 2);
  const overlap = roleWords.filter((w) => titleWords.has(w)).length;
  if (roleWords.length > 0 && overlap / roleWords.length >= 0.5) return 70;

  return 40;
}

function scoreSalary(expectation: number | null, vacancySalaryMin?: number | null): number {
  if (!expectation || !vacancySalaryMin) return 65;
  if (vacancySalaryMin >= expectation) return 100;
  const ratio = vacancySalaryMin / expectation;
  if (ratio >= 0.85) return 70;
  if (ratio >= 0.65) return 45;
  return 25;
}

/** The inverse of `HH_EXPERIENCE_RANK` — used to derive a sensible default HH.ru experience filter from the user's own profile level (e.g. for the "Recommended Jobs" widget, which has no explicit user-picked filter). */
export function experienceLevelToHhExperience(level: ExperienceLevel | null): JobExperienceLevel | undefined {
  if (!level) return undefined;
  const rank = USER_EXPERIENCE_RANK[level];
  if (rank === 0) return "noExperience";
  if (rank === 1) return "between1And3";
  if (rank === 2) return "between3And6";
  return "moreThan6";
}

const POSITIVE_FRAMING_CAREER_SCORE_CEILING = 50;
const POSITIVE_FRAMING_MATCH_FLOOR = 60;

export function computeJobMatch(input: JobMatchInput): JobMatchResult {
  const { matched, missing } = compareSkills([...input.userSkills, ...input.roadmapSkills], input.vacancy.requiredSkills);
  const requiredCount = normalizeSkills(input.vacancy.requiredSkills).length;
  const skills = requiredCount === 0 ? 70 : clamp((matched.length / requiredCount) * 100);

  const experience = scoreExperience(input.experienceLevel, input.vacancy.experienceLevel);
  const location = scoreLocation(input.city, input.preferredFormat, input.vacancy.location, input.vacancy.workFormat);
  const careerGoal = scoreCareerGoal(input.targetRole, input.careerGoals, input.vacancy.title);
  const salary = scoreSalary(input.salaryExpectation, input.vacancy.salaryMin);

  const score = clamp(
    skills * WEIGHTS.skills + experience * WEIGHTS.experience + location * WEIGHTS.location + careerGoal * WEIGHTS.careerGoal + salary * WEIGHTS.salary
  );

  const normalizedRoadmapSkills = new Set(normalizeSkills(input.roadmapSkills));
  const roadmapPrioritySkill = matched.find((skill) => normalizedRoadmapSkills.has(skill)) ?? null;

  const positiveFraming =
    input.careerScore !== null && input.careerScore < POSITIVE_FRAMING_CAREER_SCORE_CEILING && score >= POSITIVE_FRAMING_MATCH_FLOOR;

  return {
    score,
    breakdown: { skills, experience, location, careerGoal, salary },
    matchedSkills: matched,
    missingSkills: missing,
    roadmapPrioritySkill,
    positiveFraming,
  };
}

export interface ResumeVacancyMatchResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

/**
 * "Resume Match" — compares what the resume actually says (skills +
 * summary/bullet text) against a vacancy's required skills. Read-only: it
 * only reports a score and missing keywords, it never rewrites the resume.
 */
export function computeResumeVacancyMatch(resumeSkills: string[], resumeText: string, requiredSkills: string[]): ResumeVacancyMatchResult {
  const { matched: skillMatches, missing } = compareSkills(resumeSkills, requiredSkills);

  const haystack = resumeText.toLowerCase();
  const normalizedRequired = normalizeSkills(requiredSkills);
  const textMatches = normalizedRequired.filter((skill) => haystack.includes(skill));

  const matchedKeywords = Array.from(new Set([...skillMatches, ...textMatches]));
  const missingKeywords = normalizedRequired.filter((skill) => !matchedKeywords.includes(skill));

  const score = normalizedRequired.length === 0 ? 70 : clamp((matchedKeywords.length / normalizedRequired.length) * 100);

  return { score, matchedKeywords, missingKeywords: missingKeywords.length > 0 ? missingKeywords : missing };
}
