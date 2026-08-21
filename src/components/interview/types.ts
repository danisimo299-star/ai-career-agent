export type InterviewSessionStatus = "IN_PROGRESS" | "COMPLETED";
export type InterviewQuestionType = "GENERAL" | "TECHNICAL" | "BEHAVIORAL" | "HR" | "MIXED" | "RESUME_BASED";
export type InterviewDifficulty = "EASY" | "MEDIUM" | "HARD";
export type InterviewExperienceLevel = "STUDENT" | "JUNIOR" | "MID" | "SENIOR";

export interface InterviewScoreBreakdownData {
  relevance: number;
  correctness: number;
  clarity: number;
  confidence: number;
  technicalDepth: number;
  communication: number;
  completeness: number;
}

export interface InterviewQuestionData {
  id: string;
  order: number;
  type: InterviewQuestionType;
  skill: string | null;
  isFollowUp: boolean;
  question: string;
  userAnswer: string | null;
  aiEvaluation: string | null;
  scoreBreakdown: InterviewScoreBreakdownData | null;
  score: number | null;
  strengths: string | null;
  improvements: string | null;
  idealAnswerNotes: string | null;
}

export interface InterviewReportData {
  overallScore: number;
  categoryScores: {
    technicalKnowledge: number;
    communication: number;
    answerQuality: number;
    problemSolving: number;
    confidence: number;
  };
  overallResult: string;
  strongestAreas: string[];
  areasToImprove: string[];
  nextSteps: string[];
}

export interface InterviewSessionData {
  id: string;
  targetRole: string;
  type: InterviewQuestionType;
  difficulty: InterviewDifficulty;
  experienceLevel: InterviewExperienceLevel;
  questionCount: number;
  status: InterviewSessionStatus;
  report: InterviewReportData | null;
  questions: InterviewQuestionData[];
  createdAt: string;
  finishedAt: string | null;
}

export interface InterviewSetupInput {
  targetRole: string;
  interviewType: InterviewQuestionType;
  difficulty: InterviewDifficulty;
  experienceLevel: InterviewExperienceLevel;
  questionCount: 5 | 10 | 15;
}

export interface WeakSkillRecommendationData {
  skill: string;
  averageScore: number;
  sampleSize: number;
}
