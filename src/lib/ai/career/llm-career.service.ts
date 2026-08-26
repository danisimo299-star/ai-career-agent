import type { AIProvider, AIMessage } from "../types";
import {
  buildAnalyzeUserPrompt,
  buildCareerRecommendationsPrompt,
  buildCareerInsightsPrompt,
  buildRoadmapPrompt,
  buildResumePrompt,
  buildResumeSectionPrompt,
  buildResumeReviewPrompt,
  buildCareerMissionsPrompt,
  buildInterviewQuestionPrompt,
  buildInterviewAnswerEvaluationPrompt,
  buildInterviewReportPrompt,
  buildJobPreparationPrompt,
  buildJobSearchAssistantPrompt,
  buildCoachSystemPrompt,
  buildCoachMetaPrompt,
} from "./prompts";
import {
  analyzeUserResponseSchema,
  careerRecommendationsResponseSchema,
  careerInsightsResponseSchema,
  roadmapResponseSchema,
  resumeDraftResponseSchema,
  resumeSectionResponseSchema,
  resumeReviewResponseSchema,
  careerMissionsResponseSchema,
  interviewQuestionResponseSchema,
  interviewAnswerEvaluationResponseSchema,
  interviewReportResponseSchema,
  jobPreparationResponseSchema,
  jobSearchAssistantResponseSchema,
  coachMetaResponseSchema,
} from "./response-schemas";
import type {
  AICareerService,
  AnalyzeUserInput,
  UserAnalysisResult,
  CareerAnalysisContext,
  CareerRecommendationResult,
  RoadmapGenerationContext,
  RoadmapMilestoneResult,
  ResumeGenerationContext,
  ResumeDraftResult,
  ResumeSectionContext,
  ResumeSectionSuggestion,
  ResumeReviewContext,
  ResumeReviewResult,
  CareerMissionsContext,
  CareerMissionsGenerationResult,
  InterviewQuestionContext,
  InterviewQuestionResult,
  InterviewAnswerContext,
  InterviewAnswerEvaluationResult,
  InterviewReportContext,
  InterviewReportResult,
  JobPreparationContext,
  JobPreparationResult,
  JobSearchAssistantContext,
  JobSearchAssistantResult,
  CoachReplyContext,
  CoachStreamEvent,
} from "./types";

function parseJson<T>(raw: string, schema: { parse: (data: unknown) => T }, label: string): T {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`${label}: AI response was not valid JSON`);
  }

  return schema.parse(data);
}

/**
 * Implements the full `AICareerService` contract generically on top of the
 * low-level `AIProvider.complete()`. Works unchanged whether that provider
 * is OpenAI, Anthropic, or a future Gemini adapter — only `provider.ts`'s
 * factory needs to change to add one, never this file.
 */
export class LLMCareerService implements AICareerService {
  constructor(private readonly provider: AIProvider) {}

  private async completeJson<T>(
    systemPrompt: string,
    schema: { parse: (data: unknown) => T },
    label: string,
    conversation: AIMessage[] = [],
    signal?: AbortSignal
  ): Promise<T> {
    const messages: AIMessage[] = [{ role: "system", content: systemPrompt }, ...conversation];
    const result = await this.provider.complete(messages, { jsonMode: true, temperature: 0.6, signal });
    return parseJson(result.content, schema, label);
  }

  async analyzeUser(input: AnalyzeUserInput): Promise<UserAnalysisResult> {
    const conversation: AIMessage[] = input.history.map((turn) => ({ role: turn.role, content: turn.content }));
    return this.completeJson(buildAnalyzeUserPrompt(input), analyzeUserResponseSchema, "analyzeUser", conversation);
  }

  async generateCareerRecommendations(input: CareerAnalysisContext): Promise<CareerRecommendationResult[]> {
    const result = await this.completeJson(
      buildCareerRecommendationsPrompt(input),
      careerRecommendationsResponseSchema,
      "generateCareerRecommendations"
    );
    return result.recommendations;
  }

  async generateCareerInsights(input: CareerAnalysisContext): Promise<string[]> {
    const result = await this.completeJson(
      buildCareerInsightsPrompt(input),
      careerInsightsResponseSchema,
      "generateCareerInsights"
    );
    return result.insights;
  }

  async generateRoadmap(input: RoadmapGenerationContext): Promise<RoadmapMilestoneResult[]> {
    const result = await this.completeJson(buildRoadmapPrompt(input), roadmapResponseSchema, "generateRoadmap");
    return result.milestones;
  }

  async generateResume(input: ResumeGenerationContext): Promise<ResumeDraftResult> {
    return this.completeJson(buildResumePrompt(input), resumeDraftResponseSchema, "generateResume");
  }

  async generateResumeSection(input: ResumeSectionContext): Promise<ResumeSectionSuggestion> {
    return this.completeJson(buildResumeSectionPrompt(input), resumeSectionResponseSchema, "generateResumeSection");
  }

  async reviewResume(input: ResumeReviewContext): Promise<ResumeReviewResult> {
    const result = await this.completeJson(buildResumeReviewPrompt(input), resumeReviewResponseSchema, "reviewResume");
    return {
      ...result,
      strengths: result.strengths.slice(0, 3),
      improvements: result.improvements.slice(0, 3),
      missing: result.missing.slice(0, 3),
    };
  }

  async generateCareerMissions(input: CareerMissionsContext): Promise<CareerMissionsGenerationResult> {
    return this.completeJson(buildCareerMissionsPrompt(input), careerMissionsResponseSchema, "generateCareerMissions");
  }

  async generateInterviewQuestion(input: InterviewQuestionContext): Promise<InterviewQuestionResult> {
    return this.completeJson(
      buildInterviewQuestionPrompt(input),
      interviewQuestionResponseSchema,
      "generateInterviewQuestion"
    );
  }

  async evaluateInterviewAnswer(input: InterviewAnswerContext): Promise<InterviewAnswerEvaluationResult> {
    return this.completeJson(
      buildInterviewAnswerEvaluationPrompt(input),
      interviewAnswerEvaluationResponseSchema,
      "evaluateInterviewAnswer"
    );
  }

  async generateInterviewReport(input: InterviewReportContext): Promise<InterviewReportResult> {
    return this.completeJson(buildInterviewReportPrompt(input), interviewReportResponseSchema, "generateInterviewReport");
  }

  async generateJobPreparationPlan(input: JobPreparationContext): Promise<JobPreparationResult> {
    return this.completeJson(buildJobPreparationPrompt(input), jobPreparationResponseSchema, "generateJobPreparationPlan");
  }

  async parseJobSearchQuery(input: JobSearchAssistantContext): Promise<JobSearchAssistantResult> {
    return this.completeJson(buildJobSearchAssistantPrompt(input), jobSearchAssistantResponseSchema, "parseJobSearchQuery");
  }

  async *streamCoachReply(input: CoachReplyContext): AsyncIterable<CoachStreamEvent> {
    const messages: AIMessage[] = [
      { role: "system", content: buildCoachSystemPrompt(input) },
      ...input.history.map((turn): AIMessage => ({ role: turn.role, content: turn.content })),
      { role: "user", content: input.message },
    ];

    // Classification runs concurrently with the streamed reply — it doesn't
    // depend on the reply text, so there's no reason to wait for the stream
    // to finish before starting it. The extra `.catch` is only there so a
    // rejection isn't "unhandled" if the stream loop below throws first and
    // this promise is never awaited — the real error is still surfaced via
    // `await metaPromise` on the line that actually needs its result.
    const metaPromise = this.completeJson(buildCoachMetaPrompt(input), coachMetaResponseSchema, "streamCoachReply.meta", [], input.signal);
    metaPromise.catch(() => {});

    let content = "";
    for await (const delta of this.provider.stream(messages, { temperature: 0.7, signal: input.signal })) {
      if (!delta) continue;
      content += delta;
      yield { type: "delta", text: delta };
    }

    const meta = await metaPromise;
    yield { type: "done", content, intent: meta.intent, memoryFact: meta.memoryFact };
  }
}
