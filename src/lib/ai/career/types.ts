import type { Locale } from "@/lib/i18n/config";
import type { JobEmploymentType, JobExperienceLevel } from "@/lib/jobs/types";
import type { ResumeContent } from "@/types";
import type { QuestionId, QuestionSpec, QuestionCategory } from "./questionnaire";

export type { QuestionId, QuestionSpec, QuestionCategory };

export interface CareerDnaScores {
  leadership: number;
  communication: number;
  analyticalThinking: number;
  creativity: number;
  responsibility: number;
  problemSolving: number;
  learningSpeed: number;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ProfileSnapshot {
  age?: number | null;
  city?: string | null;
  educationStage?: string | null;
  interests: string[];
  skills: string[];
  goals: string[];
  salaryExpectation?: string | null;
  strengths: string[];
  weaknesses: string[];
  personalitySummary?: string | null;
  preferredFormat?: string | null;
  careerPriorities?: string[];
}

/**
 * `analyzeUser` no longer decides WHAT to ask or WHETHER the interview is
 * done — `lib/ai/career/questionnaire.ts`'s `pickNextQuestionId` does that
 * deterministically before this is even called, and the next question's
 * own prompt text is resolved from the dictionary by `chat.service.ts`.
 * The AI's only job is to phrase one sentence: a conversational
 * acknowledgement of what was just answered, optionally bridging toward
 * the next category.
 */
export interface AnalyzeUserInput {
  locale: Locale;
  profile: ProfileSnapshot;
  history: ChatTurn[];
  /** The message the user just sent (already appended as the last item of `history`, broken out for convenience). */
  latestUserMessage: string;
  /** Which category the message just answered, so the acknowledgement can reference it naturally — null on the very first turn. */
  justAnsweredCategory: QuestionCategory | null;
  /** The category of whatever's asked next, for a natural bridge sentence — null once the questionnaire is complete. */
  nextQuestionCategory: QuestionCategory | null;
  /** Small bag of already-resolved, locale-correct label strings (e.g. `pickedInterestLabel`) the acknowledgement can naturally reference without re-deriving them from raw keys. */
  context: Record<string, string>;
  /** Aborts the underlying provider call on timeout — this is decorative flavor text on the critical path of every "Continue" click, so it must never be allowed to hang the whole answer-save (see `chat.service.ts`). */
  signal?: AbortSignal;
}

export interface UserAnalysisResult {
  /** The assistant's conversational acknowledgement of the answer just given. The next question's own prompt text is resolved separately, from the dictionary, by `chat.service.ts` — not by the AI. */
  reply: string;
  dna?: CareerDnaScores;
}

export interface CareerAnalysisContext {
  locale: Locale;
  profile: ProfileSnapshot;
  /** Titles already tried and rejected by the HH market validator this round — the model must not repeat them (see `career-analysis.service.ts`'s bounded retry). */
  excludeTitles?: string[];
  signal?: AbortSignal;
}

export interface CareerRecommendationResult {
  title: string;
  matchScore: number;
  reasoning: string;
  requiredSkills: string[];
  learningTimeMonths: number;
  growthPotential: "LOW" | "MEDIUM" | "HIGH";
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  /** The real-job-market search string for `title` — what actually gets sent to hh.ru. */
  hhSearchTitle: string;
  /** A realistic entry-level title for someone at the user's current level — see "Target Career vs First Job". */
  firstJobTitle: string;
  /** 2-4 alternate real job titles for the same role, tried by the market validator. */
  searchAliases: string[];
}

/** One combined generation — see `buildCareerAnalysisPrompt`'s doc comment for why this replaced two separate calls. */
export interface CareerAnalysisResult {
  /** 2-3 sentence quick take — the single most important thing to know, shown before the detailed insights list. */
  summary: string;
  insights: string[];
  recommendations: CareerRecommendationResult[];
}

export interface RoadmapGenerationContext {
  locale: Locale;
  careerTitle: string;
  profile: ProfileSnapshot;
  dna: CareerDnaScores | null;
  careerScore: number | null;
  signal?: AbortSignal;
}

export interface RoadmapResourceResult {
  title: string;
  type: "YOUTUBE" | "DOCUMENTATION" | "COURSE" | "BOOK" | "ARTICLE";
  provider?: string;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  language?: string;
}

export interface RoadmapTaskResult {
  title: string;
  resources: RoadmapResourceResult[];
}

export interface RoadmapMilestoneResult {
  title: string;
  description: string;
  whyItMatters: string;
  expectedResult: string;
  estimatedWeeks: number;
  skills: string[];
  tasks: RoadmapTaskResult[];
}

export interface ResumeGenerationContext {
  locale: Locale;
  profile: ProfileSnapshot;
  targetRole: string;
  dna: CareerDnaScores | null;
  careerScore: number | null;
  /** The user's top Career Analysis match, when one exists — grounds the draft in a real recommendation rather than the target role alone. */
  topRecommendationTitle: string | null;
  /** Skills from the user's current roadmap milestone, if a roadmap exists. */
  roadmapSkills: string[];
}

/**
 * Only the fields the AI can respond about safely — never fabricated work
 * history. Experience/education/projects/certificates/languages are real
 * facts only the user has; the AI drafts a starting summary/objective/skill
 * list, and helps word individual sections afterward via
 * `generateResumeSection`, but it never invents a job the user never had.
 */
export interface ResumeDraftResult {
  careerObjective: string;
  summary: string;
  skills: string[];
}

export type ResumeSectionKind = "summary" | "careerObjective" | "experienceBullets" | "projectDescription" | "skills";

export interface ResumeSectionContext {
  locale: Locale;
  targetRole: string;
  profile: ProfileSnapshot;
  section: ResumeSectionKind;
  /** Raw facts the user already entered for this section — the AI writes from these, never invents new ones. */
  sectionInput: {
    role?: string;
    company?: string;
    existingBullets?: string[];
    projectName?: string;
    technologies?: string[];
    existingSkills?: string[];
  };
}

export interface ResumeSectionSuggestion {
  text?: string;
  bullets?: string[];
  skills?: string[];
}

export interface ResumeReviewContext {
  locale: Locale;
  targetRole: string;
  /** The user's actual current resume — a review has to react to what's really there, not just profile data. */
  content: ResumeContent;
}

/** "Проверить резюме" (item 12) — a short, grounded read, never 30 recommendations at once. Every array is capped at 3 by the response schema. */
export interface ResumeReviewResult {
  strengths: string[];
  improvements: string[];
  missing: string[];
  /** One or two sentences on fit for `targetRole` specifically. */
  fitNote: string;
  /** The single most valuable next action — not a repeat of the improvements list. */
  nextStep: string;
}

export type InterviewType = "GENERAL" | "TECHNICAL" | "BEHAVIORAL" | "HR" | "MIXED" | "RESUME_BASED";
export type InterviewDifficulty = "EASY" | "MEDIUM" | "HARD";
/** Matches the (larger) Prisma `ExperienceLevel` enum already used by `Profile.experienceLevel` — the interview feature only offers this subset. */
export type ExperienceLevel = "STUDENT" | "JUNIOR" | "MID" | "SENIOR";

export interface InterviewTurn {
  question: string;
  type: Exclude<InterviewType, "MIXED">;
  skill: string | null;
  isFollowUp: boolean;
  answer: string;
}

/**
 * Everything the interviewer needs to know about who it's talking to,
 * shared by question generation, answer evaluation, and the final report.
 */
export interface InterviewSetupContext {
  locale: Locale;
  profile: ProfileSnapshot;
  dna: CareerDnaScores | null;
  careerScore: number | null;
  targetRole: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  experienceLevel: ExperienceLevel;
  /** Condensed resume content (summary + skills + notable bullets), when the user has one — never fabricated. */
  resumeSummary: string | null;
  /** Short, factual snippets pulled verbatim from the user's real experience bullets and project descriptions — what RESUME_BASED questions are grounded in and picked from, never invented. */
  resumeHighlights: string[];
  /** Skills from the user's current/next roadmap milestone, to ground technical questions in what they're actually learning. */
  roadmapSkills: string[];
  targetQuestionCount: number;
}

export interface InterviewQuestionContext extends InterviewSetupContext {
  history: InterviewTurn[];
}

export interface InterviewQuestionResult {
  question: string;
  /** Concrete type for this one question — always resolved even in a MIXED session, never "MIXED" itself. */
  type: Exclude<InterviewType, "MIXED">;
  /** Which skill this question probes, set only for TECHNICAL questions. */
  skill: string | null;
}

export interface InterviewAnswerContext extends InterviewSetupContext {
  history: InterviewTurn[];
  currentQuestion: { question: string; type: Exclude<InterviewType, "MIXED">; skill: string | null; isFollowUp: boolean };
  answer: string;
}

export interface InterviewScoreBreakdown {
  relevance: number;
  correctness: number;
  clarity: number;
  confidence: number;
  technicalDepth: number;
  communication: number;
  completeness: number;
}

export interface InterviewAnswerEvaluationResult {
  scoreBreakdown: InterviewScoreBreakdown;
  /** 0-100 aggregate of the breakdown above. */
  score: number;
  /** Short, 1-2 sentence feedback shown immediately after the answer. */
  feedback: string;
  /** What was good about the answer — shown in the post-interview review. */
  strengths: string;
  /** What could be improved — shown in the post-interview review. */
  improvements: string;
  /** What a strong answer could include — one good approach, never framed as the only correct answer. */
  idealAnswerNotes: string;
  /**
   * A natural follow-up question probing deeper into this specific answer,
   * or null if none is warranted. The caller decides whether to actually
   * use it (e.g. a follow-up budget per primary question) — never trusted
   * to unilaterally control how long the interview runs.
   */
  followUpQuestion: string | null;
}

export interface InterviewReportContext {
  locale: Locale;
  targetRole: string;
  interviewType: InterviewType;
  experienceLevel: ExperienceLevel;
  turns: (InterviewTurn & { score: number | null; scoreBreakdown: InterviewScoreBreakdown | null })[];
}

export interface InterviewCategoryScores {
  technicalKnowledge: number;
  communication: number;
  answerQuality: number;
  problemSolving: number;
  confidence: number;
}

export interface InterviewReportResult {
  overallScore: number;
  categoryScores: InterviewCategoryScores;
  /** 1-2 sentence narrative verdict, e.g. "Good candidate — keep improving behavioral answers." */
  overallResult: string;
  strongestAreas: string[];
  areasToImprove: string[];
  /** 2-4 concrete next actions. */
  nextSteps: string[];
}

export interface IncompleteRoadmapTask {
  title: string;
  milestoneTitle: string;
}

export interface CareerMissionsContext {
  locale: Locale;
  profile: ProfileSnapshot;
  dna: CareerDnaScores | null;
  careerScore: number | null;
  careerTitle: string;
  currentMilestone: { title: string; description: string; skills: string[] } | null;
  incompleteTasks: IncompleteRoadmapTask[];
  completedMissionTitles: string[];
  skippedMissionTitles: string[];
  count: number;
  signal?: AbortSignal;
}

export interface CareerMissionResult {
  title: string;
  description: string;
  goal: string;
  instructions: string[];
  whyItMatters: string;
  expectedResult: string;
  estimatedMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  skill: string | null;
  /**
   * Free text matched against `incompleteTasks[].title` by the caller,
   * *never* trusted as a real ID — the AI has no knowledge of database
   * identifiers, and even a plausible-looking one must be resolved back to
   * a real `RoadmapTask` owned by this user, or dropped.
   */
  relatedTaskTitle: string | null;
  priority: number;
  resources: RoadmapResourceResult[];
}

export interface CareerMissionsGenerationResult {
  missions: CareerMissionResult[];
  /** One short, specific sentence grounded in the context actually passed in — not a template filled with placeholders. */
  insight: string;
}

export interface JobPreparationContext {
  locale: Locale;
  targetRole: string;
  vacancyTitle: string;
  company: string;
  requiredSkills: string[];
  /** Already computed by the deterministic matching engine — the AI narrates this result, it never recomputes or overrides it. */
  matchedSkills: string[];
  missingSkills: string[];
  resumeSummary: string | null;
}

export interface JobPreparationResult {
  resumeRecommendations: string[];
  skillsToImprove: string[];
  hrQuestions: string[];
  technicalQuestions: string[];
  preparationPlan: string[];
}

export interface JobSearchAssistantContext {
  locale: Locale;
  /** The user's raw free-text query, e.g. "Find me junior Python jobs in Kazan without experience". */
  freeText: string;
}

/**
 * Structured, Zod-validated output only — the caller feeds this straight
 * into the normal deterministic search (`jobsService.search`), never lets
 * the model run a query itself.
 */
export interface JobSearchAssistantResult {
  targetRole: string;
  city?: string;
  workFormat?: "REMOTE" | "HYBRID" | "ONSITE" | "ANY";
  experience?: JobExperienceLevel;
  employmentTypes?: JobEmploymentType[];
  salaryMin?: number;
  internshipOnly?: boolean;
}

/**
 * Compact, pre-computed facts about the user — deliberately not a raw
 * profile/DB dump. Every field here is already known and real (computed by
 * existing deterministic services), so the prompt can instruct the model to
 * never ask about any of them, only reason from them.
 */
export interface CoachContextSnapshot {
  name: string | null;
  age: number | null;
  targetRole: string | null;
  city: string | null;
  experienceLevel: string | null;
  educationStage: string | null;
  salaryExpectation: string | null;
  careerReadiness: number | null;
  skillGapPercent: number | null;
  topMissingSkills: string[];
  matchedSkills: string[];
  resumeScore: number | null;
  interviewAverageScore: number | null;
  applications: number;
  interviews: number;
  offers: number;
  savedJobsCount: number;
  matchingJobsCount: number;
  nextActionTitle: string | null;
  /** Meaningful preferences the Coach extracted from earlier conversation (e.g. "prefers less client-facing work") — never every sentence, only what was actually distinctive. */
  careerPreferences: string[];
  /** Fixed-key priorities from the Questionnaire (salary/stability/growth/...) — see lib/ai/career/questionnaire.ts. */
  careerPriorities: string[];
  /** A real, honest pattern found across the user's own saved jobs (e.g. "3 saved jobs need Docker, which isn't in your profile") — null when there isn't one yet. Never invented; see lib/career/coach-insights.ts. */
  proactiveInsight: { skill: string; jobCount: number } | null;
}

export type CoachIntent =
  | "jobs"
  | "resume"
  | "interview"
  | "skillGap"
  | "roadmap"
  | "compareCareers"
  | "nextAction"
  | "applications"
  | "general";

export type CoachReplyStyle = "BRIEF" | "BALANCED" | "DETAILED";

export interface CoachReplyContext {
  locale: Locale;
  profile: ProfileSnapshot;
  snapshot: CoachContextSnapshot;
  /** Recent Coach turns only — never the unrelated onboarding-interview `ChatMessage` history. */
  history: ChatTurn[];
  message: string;
  /** Settings-page preference (Settings → ProfyMind → reply style) — a real length/depth directive, not decorative. Defaults to "BALANCED" when absent (e.g. the mock provider ignores it). */
  replyStyle?: CoachReplyStyle;
  /** Aborts the underlying provider call when the client stops generation — see `AICompletionOptions.signal`. */
  signal?: AbortSignal;
}

/**
 * The model classifies intent and writes the reply — it never invents the
 * actual suggested actions (hrefs/labels); the caller deterministically
 * maps `intent` to a fixed action list, the same "AI reasons, code acts"
 * split already used by the Jobs search assistant.
 */
export interface CoachReplyResult {
  reply: string;
  intent: CoachIntent;
  /**
   * A single short, meaningful career preference worth remembering for
   * future replies (e.g. "prefers less client-facing work"), or `null` if
   * nothing distinctive was said this turn — never a summary of the whole
   * message, never set just because the user said something.
   */
  memoryFact: string | null;
}

/** The non-reply half of `CoachReplyResult` — everything the stream's trailing `done` event carries. */
export interface CoachReplyMeta {
  intent: CoachIntent;
  memoryFact: string | null;
}

/**
 * `streamCoachReply` yields the reply text as it's generated (`delta`
 * events, one per chunk — always safe, user-visible text) so the client can
 * render it token-by-token like a real chat model, then a single trailing
 * `done` event with `content` (the exact text to persist as the assistant
 * message — for a real provider this is just the concatenated deltas, but
 * the mock provider's turn-tracking marker, see `stripCoachDisplayMarkers`,
 * is appended here and here only, never sent as a visible delta) plus the
 * metadata a streamed prose response can't carry inline (intent
 * classification, an extracted memory fact) — computed via a second, fast,
 * non-streamed call that runs concurrently with the streamed reply, not
 * sequentially after it.
 */
export type CoachStreamEvent = { type: "delta"; text: string } | ({ type: "done"; content: string } & CoachReplyMeta);

/**
 * The single contract every AI career-intelligence implementation must
 * satisfy. `MockCareerService` fabricates realistic answers deterministically
 * (no network call); `LLMCareerService` implements the same methods
 * generically on top of the low-level `AIProvider` (OpenAI/Anthropic/future
 * Gemini) — so swapping the underlying LLM never touches this interface or
 * anything that calls it.
 */
export interface AICareerService {
  analyzeUser(input: AnalyzeUserInput): Promise<UserAnalysisResult>;
  generateCareerAnalysis(input: CareerAnalysisContext): Promise<CareerAnalysisResult>;
  generateRoadmap(input: RoadmapGenerationContext): Promise<RoadmapMilestoneResult[]>;
  generateResume(input: ResumeGenerationContext): Promise<ResumeDraftResult>;
  generateResumeSection(input: ResumeSectionContext): Promise<ResumeSectionSuggestion>;
  reviewResume(input: ResumeReviewContext): Promise<ResumeReviewResult>;
  generateCareerMissions(input: CareerMissionsContext): Promise<CareerMissionsGenerationResult>;
  generateInterviewQuestion(input: InterviewQuestionContext): Promise<InterviewQuestionResult>;
  evaluateInterviewAnswer(input: InterviewAnswerContext): Promise<InterviewAnswerEvaluationResult>;
  generateInterviewReport(input: InterviewReportContext): Promise<InterviewReportResult>;
  generateJobPreparationPlan(input: JobPreparationContext): Promise<JobPreparationResult>;
  parseJobSearchQuery(input: JobSearchAssistantContext): Promise<JobSearchAssistantResult>;
  streamCoachReply(input: CoachReplyContext): AsyncIterable<CoachStreamEvent>;
}
