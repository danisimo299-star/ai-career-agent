import { z } from "zod";

/**
 * JSON-mode on every real provider (OpenAI `json_object`, Ollama `format:
 * "json"`) makes the model fill every field shown in the example shape
 * rather than omitting ones that don't apply — for "not applicable" it
 * emits `null`, not an absent key. Plain `.optional()` only accepts
 * `undefined`, so a real `null` response fails validation even though it's
 * the model's correct way of saying "no value here." This accepts either
 * and normalizes to `undefined`, so every downstream consumer still sees
 * the same `T | undefined` type it always did — found via a real 502 on
 * `jobSearchAssistantResponseSchema.salaryMin` with a live model.
 */
function nullableOptional<T extends z.ZodTypeAny>(schema: T) {
  return schema.nullish().transform((v) => v ?? undefined);
}

/**
 * Truncates instead of rejecting — a real model running a few characters
 * past a "1-2 sentences" instruction shouldn't fail `completeJson`'s
 * validation (no retry/repair pass exists), the same reasoning
 * `resumeReviewResponseSchema` already documents for array cardinality,
 * extended here to string length.
 */
function boundedText(max: number) {
  return z.string().transform((v) => (v.length > max ? `${v.slice(0, max - 1).trimEnd()}…` : v));
}

// Each trait defaults rather than rejects when a real model omits one field
// out of seven — observed live against a local Ollama model: an otherwise
// valid response missing just `learningSpeed` used to fail the whole
// `analyzeUser` call and burn a retry for no good reason.
const dnaTrait = z.number().default(65);
const dnaSchema = z.object({
  leadership: dnaTrait,
  communication: dnaTrait,
  analyticalThinking: dnaTrait,
  creativity: dnaTrait,
  responsibility: dnaTrait,
  problemSolving: dnaTrait,
  learningSpeed: dnaTrait,
});

export const analyzeUserResponseSchema = z.object({
  reply: z.string(),
  dna: dnaSchema,
});

const careerRecommendationSchema = z.object({
  title: boundedText(80),
  matchScore: z.number(),
  reasoning: boundedText(280),
  requiredSkills: z.array(z.string()),
  learningTimeMonths: z.number(),
  growthPotential: z.enum(["LOW", "MEDIUM", "HIGH"]),
  difficultyLevel: z.enum(["EASY", "MEDIUM", "HARD"]),
  // Market-realism fields — `career-market.service.ts` validates these
  // against real hh.ru search results before the recommendation is
  // shown as having genuine market demand.
  hhSearchTitle: nullableOptional(boundedText(80)),
  firstJobTitle: nullableOptional(boundedText(80)),
  searchAliases: nullableOptional(z.array(boundedText(80))),
});

/**
 * One combined generation instead of two separate Ollama round trips
 * (recommendations + insights used to be independent prompts/calls) — see
 * item 21 of the performance brief. Wrapped in an object, not a bare
 * top-level array/mixed shape — JSON-mode on every real provider (OpenAI's
 * `json_object`, Ollama's `format: "json"`) only guarantees a JSON *object*
 * comes back.
 */
export const careerAnalysisResponseSchema = z.object({
  summary: boundedText(320),
  insights: z.array(boundedText(200)),
  recommendations: z.array(careerRecommendationSchema),
});

const roadmapResourceSchema = z.object({
  title: z.string(),
  type: z.enum(["YOUTUBE", "DOCUMENTATION", "COURSE", "BOOK", "ARTICLE"]),
  provider: nullableOptional(z.string()),
  difficulty: nullableOptional(z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"])),
  language: nullableOptional(z.string()),
});

const roadmapTaskSchema = z.object({
  title: z.string(),
  resources: z.array(roadmapResourceSchema).default([]),
});

// Same top-level-array-into-object wrapping as `careerRecommendationsResponseSchema` above, for the same reason.
export const roadmapResponseSchema = z.object({
  milestones: z.array(
    z.object({
      title: boundedText(100),
      description: boundedText(280),
      whyItMatters: boundedText(200),
      expectedResult: boundedText(200),
      estimatedWeeks: z.number(),
      skills: z.array(z.string()).default([]),
      tasks: z.array(roadmapTaskSchema).min(1),
    })
  ),
});

export const resumeDraftResponseSchema = z.object({
  careerObjective: z.string(),
  summary: z.string(),
  skills: z.array(z.string()),
});

export const resumeSectionResponseSchema = z.object({
  text: nullableOptional(z.string()),
  bullets: nullableOptional(z.array(z.string())),
  skills: nullableOptional(z.array(z.string())),
});

// No `.max()` here on purpose — a model that ignores the "up to 3" prompt
// instruction and returns 5 should still validate; `reviewResume` below
// truncates in code instead of letting a cardinality mismatch fail the
// whole response (the same class of over-strict-schema bug fixed earlier
// for `careerRecommendationsResponseSchema`/`roadmapResponseSchema`).
export const resumeReviewResponseSchema = z.object({
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  missing: z.array(z.string()).default([]),
  fitNote: boundedText(280),
  nextStep: boundedText(200),
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
  feedback: boundedText(220),
  strengths: boundedText(280),
  improvements: boundedText(280),
  idealAnswerNotes: boundedText(280),
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
  overallResult: boundedText(280),
  strongestAreas: z.array(z.string()).default([]),
  areasToImprove: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).default([]),
});

export const jobSearchAssistantResponseSchema = z.object({
  targetRole: z.string(),
  city: nullableOptional(z.string()),
  workFormat: nullableOptional(z.enum(["REMOTE", "HYBRID", "ONSITE", "ANY"])),
  experience: nullableOptional(z.enum(["noExperience", "between1And3", "between3And6", "moreThan6"])),
  employmentTypes: nullableOptional(z.array(z.enum(["full", "part", "project", "volunteer", "probation"]))),
  salaryMin: nullableOptional(z.number()),
  internshipOnly: nullableOptional(z.boolean()),
});

export const coachMetaResponseSchema = z.object({
  intent: z.enum(["jobs", "resume", "interview", "skillGap", "roadmap", "compareCareers", "nextAction", "applications", "general"]),
  memoryFact: boundedText(200).nullable().default(null),
});

export const jobPreparationResponseSchema = z.object({
  resumeRecommendations: z.array(z.string()).default([]),
  skillsToImprove: z.array(z.string()).default([]),
  hrQuestions: z.array(z.string()).default([]),
  technicalQuestions: z.array(z.string()).default([]),
  preparationPlan: z.array(z.string()).default([]),
});

const careerMissionSchema = z.object({
  title: boundedText(100),
  description: boundedText(200),
  goal: boundedText(200),
  instructions: z.array(z.string()).default([]),
  whyItMatters: boundedText(200),
  expectedResult: boundedText(200),
  estimatedMinutes: z.number(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  skill: z.string().nullable().default(null),
  relatedTaskTitle: z.string().nullable().default(null),
  priority: z.number(),
  resources: z.array(roadmapResourceSchema).default([]),
});

export const careerMissionsResponseSchema = z.object({
  missions: z.array(careerMissionSchema).min(1),
  insight: boundedText(200),
});
