export type CoachIntent = "jobs" | "resume" | "interview" | "skillGap" | "roadmap" | "compareCareers" | "nextAction" | "applications" | "general";

export interface CoachActionSuggestion {
  labelKey: string;
  href: string;
  count?: number;
}

export interface CoachMessageData {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  suggestedActions: CoachActionSuggestion[] | null;
  createdAt: string;
}

export interface CoachContextSnapshotData {
  targetRole: string | null;
  city: string | null;
  experienceLevel: string | null;
  careerReadiness: number | null;
  skillGapPercent: number | null;
  topMissingSkills: string[];
  resumeScore: number | null;
  interviewAverageScore: number | null;
  applications: number;
  interviews: number;
  offers: number;
  nextActionTitle: string | null;
  proactiveInsight: { skill: string; jobCount: number } | null;
}

export interface ReadinessBreakdownData {
  careerFit: number | null;
  skillReadiness: number | null;
  resumeQuality: number | null;
  interviewReadiness: number | null;
  jobMatch: number | null;
  applicationProgress: number | null;
}

export interface ReadinessResultData {
  overall: number;
  breakdown: ReadinessBreakdownData;
  availableDimensions: (keyof ReadinessBreakdownData)[];
}

export interface ApplicationAnalyticsData {
  applications: number;
  interviews: number;
  offers: number;
  responseRate: number | null;
  interviewRate: number | null;
  offerRate: number | null;
  hasEnoughData: boolean;
  lowInterviewConversion: boolean;
}

export type SkillPriority = "critical" | "high" | "medium" | "low";

export interface SkillGapItemData {
  skill: string;
  priority: SkillPriority;
  marketFrequencyPercent?: number;
}

export interface SkillGapResultData {
  matched: string[];
  missing: SkillGapItemData[];
  gapPercent: number;
}

export interface SkillGapResponseData {
  targetRole: string;
  targetGap: SkillGapResultData | null;
  marketGap: SkillGapResultData & { analyzedVacancyCount: number };
}

export interface CareerPlanMonthData {
  monthIndex: number;
  milestoneTitles: string[];
  allCompleted: boolean;
}

export interface CareerPlanData {
  months: CareerPlanMonthData[];
  totalMonths: number;
}

export interface CareerScenarioData {
  title: string;
  fitPercent: number;
  skillGapPercent: number;
  jobCount: number;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  growthPotential: "LOW" | "MEDIUM" | "HIGH";
  label: "strongestFit" | "strongestLongTerm" | "easiestTransition" | null;
}
