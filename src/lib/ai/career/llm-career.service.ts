import type { AIProvider, AIMessage } from "../types";
import {
  buildAnalyzeUserPrompt,
  buildCareerRecommendationsPrompt,
  buildCareerInsightsPrompt,
  buildRoadmapPrompt,
  buildResumePrompt,
  buildResumeSectionPrompt,
  buildCareerMissionsPrompt,
  buildInterviewQuestionPrompt,
  buildInterviewAnswerEvaluationPrompt,
  buildInterviewReportPrompt,
  buildJobPreparationPrompt,
  buildJobSearchAssistantPrompt,
  buildCoachReplyPrompt,
} from "./prompts";
import {
  analyzeUserResponseSchema,
  careerRecommendationsResponseSchema,
  careerInsightsResponseSchema,
  roadmapResponseSchema,
  resumeDraftResponseSchema,
  resumeSectionResponseSchema,
  careerMissionsResponseSchema,
  interviewQuestionResponseSchema,
  interviewAnswerEvaluationResponseSchema,
  interviewReportResponseSchema,
  jobPreparationResponseSchema,
  jobSearchAssistantResponseSchema,
  coachReplyResponseSchema,
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
  CoachReplyResult,
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
    conversation: AIMessage[] = []
  ): Promise<T> {
    const messages: AIMessage[] = [{ role: "system", content: systemPrompt }, ...conversation];
    const result = await this.provider.complete(messages, { jsonMode: true, temperature: 0.6 });
    return parseJson(result.content, schema, label);
  }

  async analyzeUser(input: AnalyzeUserInput): Promise<UserAnalysisResult> {
    const conversation: AIMessage[] = input.history.map((turn) => ({ role: turn.role, content: turn.content }));
    return this.completeJson(buildAnalyzeUserPrompt(input), analyzeUserResponseSchema, "analyzeUser", conversation);
  }

  async generateCareerRecommendations(input: CareerAnalysisContext): Promise<CareerRecommendationResult[]> {
    return this.completeJson(
      buildCareerRecommendationsPrompt(input),
      careerRecommendationsResponseSchema,
      "generateCareerRecommendations"
    );
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
    return this.completeJson(buildRoadmapPrompt(input), roadmapResponseSchema, "generateRoadmap");
  }

  async generateResume(input: ResumeGenerationContext): Promise<ResumeDraftResult> {
    return this.completeJson(buildResumePrompt(input), resumeDraftResponseSchema, "generateResume");
  }

  async generateResumeSection(input: ResumeSectionContext): Promise<ResumeSectionSuggestion> {
    return this.completeJson(buildResumeSectionPrompt(input), resumeSectionResponseSchema, "generateResumeSection");
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

  async generateCoachReply(input: CoachReplyContext): Promise<CoachReplyResult> {
    return this.completeJson(buildCoachReplyPrompt(input), coachReplyResponseSchema, "generateCoachReply");
  }
}
