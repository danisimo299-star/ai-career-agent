export type JobWorkFormat = "REMOTE" | "HYBRID" | "ONSITE" | "ANY";
export type JobExperience = "noExperience" | "between1And3" | "between3And6" | "moreThan6";
export type JobEmployment = "full" | "part" | "project" | "volunteer" | "probation";
export type JobSort = "bestMatch" | "highestSalary" | "newest" | "lowestExperience";
export type SavedJobStatus = "SAVED" | "PREPARING" | "APPLIED" | "INTERVIEW" | "REJECTED" | "OFFER";

export interface VacancyData {
  title: string;
  company: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  matchReason: string;
  sourceUrl: string;
  requiredSkills: string[];
  employmentType?: string;
  workFormat?: JobWorkFormat;
  experienceLevel?: string;
  isSearchLink: boolean;
  publishedAt?: string;
  requirementSnippet?: string;
  responsibilitySnippet?: string;
}

export interface JobMatchBreakdownData {
  skills: number;
  experience: number;
  location: number;
  careerGoal: number;
  salary: number;
}

export interface JobMatchData {
  score: number;
  breakdown: JobMatchBreakdownData;
  matchedSkills: string[];
  missingSkills: string[];
  roadmapPrioritySkill: string | null;
  positiveFraming: boolean;
}

export interface JobSearchResultItemData {
  vacancy: VacancyData;
  match: JobMatchData;
}

export interface JobSearchResponseData {
  results: JobSearchResultItemData[];
  hhSearchUrl: string;
  providerName: string;
}

export interface SavedJobData {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  sourceUrl: string;
  source: "MOCK" | "HH_RU";
  requiredSkills: string[];
  matchScore: number | null;
  matchBreakdown: JobMatchBreakdownData | null;
  status: SavedJobStatus;
  notes: string | null;
  savedAt: string;
  statusUpdatedAt: string;
}

export interface JobPreferencesData {
  city: string | null;
  workFormat: JobWorkFormat | null;
  experienceLevel: string | null;
  employmentTypes: string[];
  salaryExpectationMin: number | null;
  openToInternship: boolean;
  skills: string[];
}

export interface JobSearchFiltersState {
  targetRole: string;
  city?: string;
  workFormat?: JobWorkFormat;
  experience?: JobExperience;
  employmentTypes?: JobEmployment[];
  salaryMin?: number;
  internshipOnly?: boolean;
  sort?: JobSort;
}

export interface JobPreparationData {
  resumeRecommendations: string[];
  skillsToImprove: string[];
  hrQuestions: string[];
  technicalQuestions: string[];
  preparationPlan: string[];
}

export interface ResumeVacancyMatchData {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export interface PrepareResponseData {
  plan: JobPreparationData;
  matchedSkills: string[];
  missingSkills: string[];
  resumeMatch: ResumeVacancyMatchData | null;
}
