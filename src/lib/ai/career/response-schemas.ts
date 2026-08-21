import { z } from "zod";

const dnaSchema = z.object({
  leadership: z.number(),
  communication: z.number(),
  analyticalThinking: z.number(),
  creativity: z.number(),
  responsibility: z.number(),
  problemSolving: z.number(),
  learningSpeed: z.number(),
});

export const analyzeUserResponseSchema = z.object({
  reply: z.string(),
  dna: dnaSchema,
});

export const careerRecommendationsResponseSchema = z.array(
  z.object({
    title: z.string(),
    matchScore: z.number(),
    reasoning: z.string(),
    requiredSkills: z.array(z.string()),
    learningTimeMonths: z.number(),
    growthPotential: z.enum(["LOW", "MEDIUM", "HIGH"]),
    difficultyLevel: z.enum(["EASY", "MEDIUM", "HARD"]),
  })
);

export const careerInsightsResponseSchema = z.object({
  insights: z.array(z.string()),
});

const roadmapResourceSchema = z.object({
  title: z.string(),
  type: z.enum(["YOUTUBE", "DOCUMENTATION", "COURSE", "BOOK", "ARTICLE"]),
  provider: z.string().optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  language: z.string().optional(),
});

const roadmapTaskSchema = z.object({
  title: z.string(),
  resources: z.array(roadmapResourceSchema).default([]),
});

export const roadmapResponseSchema = z.array(
  z.object({
    title: z.string(),
    description: z.string(),
    whyItMatters: z.string(),
    expectedResult: z.string(),
    estimatedWeeks: z.number(),
    skills: z.array(z.string()).default([]),
    tasks: z.array(roadmapTaskSchema).min(1),
  })
);

export const resumeDraftResponseSchema = z.object({
  careerObjective: z.string(),
  summary: z.string(),
  skills: z.array(z.string()),
});

export const resumeSectionResponseSchema = z.object({
  text: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});

const interviewQuestionTypeSchema = z.enum(["GENERAL", "TECHNICAL", "BEHAVIORAL", "HR", "RESUME_BASED"]);

export const interviewQuestionResponseSchema = z.object({
  question: z.string(),
  type: interviewQuestionTypeSchema,
  skill: z.string().nullable().default(null),
});

const interviewScoreBreakdownSchema = z.object({
  relevance: z.number(),
  correctness: z.number(),
  clarity: z.number(),
  confidence: z.number(),
  technicalDepth: z.number(),
  communication: z.number(),
  completeness: z.number(),
});

export const interviewAnswerEvaluationResponseSchema = z.object({
  scoreBreakdown: interviewScoreBreakdownSchema,
  score: z.number(),
  feedback: z.string(),
  strengths: z.string(),
  improvements: z.string(),
  idealAnswerNotes: z.string(),
  followUpQuestion: z.string().nullable().default(null),
});

export const interviewReportResponseSchema = z.object({
  overallScore: z.number(),
  categoryScores: z.object({
    technicalKnowledge: z.number(),
    communication: z.number(),
    answerQuality: z.number(),
    problemSolving: z.number(),
    confidence: z.number(),
  }),
  overallResult: z.string(),
  strongestAreas: z.array(z.string()).default([]),
  areasToImprove: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).default([]),
});

export const jobSearchAssistantResponseSchema = z.object({
  targetRole: z.string(),
  city: z.string().optional(),
  workFormat: z.enum(["REMOTE", "HYBRID", "ONSITE", "ANY"]).optional(),
  experience: z.enum(["noExperience", "between1And3", "between3And6", "moreThan6"]).optional(),
  employmentTypes: z.array(z.enum(["full", "part", "project", "volunteer", "probation"])).optional(),
  salaryMin: z.number().optional(),
  internshipOnly: z.boolean().optional(),
});

export const coachReplyResponseSchema = z.object({
  reply: z.string(),
  intent: z.enum(["jobs", "resume", "interview", "skillGap", "roadmap", "compareCareers", "nextAction", "applications", "general"]),
  memoryFact: z.string().max(200).nullable().default(null),
});

export const jobPreparationResponseSchema = z.object({
  resumeRecommendations: z.array(z.string()).default([]),
  skillsToImprove: z.array(z.string()).default([]),
  hrQuestions: z.array(z.string()).default([]),
  technicalQuestions: z.array(z.string()).default([]),
  preparationPlan: z.array(z.string()).default([]),
});

const careerMissionSchema = z.object({
  title: z.string(),
  description: z.string(),
  goal: z.string(),
  instructions: z.array(z.string()).default([]),
  whyItMatters: z.string(),
  expectedResult: z.string(),
  estimatedMinutes: z.number(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  skill: z.string().nullable().default(null),
  relatedTaskTitle: z.string().nullable().default(null),
  priority: z.number(),
  resources: z.array(roadmapResourceSchema).default([]),
});

export const careerMissionsResponseSchema = z.object({
  missions: z.array(careerMissionSchema).min(1),
  insight: z.string(),
});
