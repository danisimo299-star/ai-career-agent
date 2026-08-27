import type { AIProvider, AIMessage } from "../types";
import {
  buildAnalyzeUserPrompt,
  buildCareerAnalysisPrompt,
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
  careerAnalysisResponseSchema,
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
  CareerAnalysisResult,
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
    // A truncated response (the model hit `num_predict` before finishing)
    // is the most common real cause — the tail of `raw` is what shows that,
    // never logged in production since this can echo profile-derived text.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[llm-career] ${label}: unparseable JSON, length=${raw.length}, tail: …${raw.slice(-200)}`);
    }
    throw new Error(`${label}: AI response was not valid JSON (length ${raw.length})`);
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
    signal?: AbortSignal,
    maxTokens?: number
  ): Promise<T> {
    const messages: AIMessage[] = [{ role: "system", content: systemPrompt }, ...conversation];
    const result = await this.provider.complete(messages, { jsonMode: true, temperature: 0.6, signal, maxTokens });
    return parseJson(result.content, schema, label);
  }

  async analyzeUser(input: AnalyzeUserInput): Promise<UserAnalysisResult> {
    const conversation: AIMessage[] = input.history.map((turn) => ({ role: turn.role, content: turn.content }));
    return this.completeJson(buildAnalyzeUserPrompt(input), analyzeUserResponseSchema, "analyzeUser", conversation, input.signal);
  }

  async generateCareerAnalysis(input: CareerAnalysisContext): Promise<CareerAnalysisResult> {
    // 5 recommendations + summary + insights genuinely needs more room than
    // the default budget for a short acknowledgement/classification call.
    const result = await this.completeJson(buildCareerAnalysisPrompt(input), careerAnalysisResponseSchema, "generateCareerAnalysis", [], input.signal, 1800);
    return {
      summary: result.summary,
      insights: result.insights,
      recommendations: result.recommendations.map((rec) => ({
        ...rec,
        hhSearchTitle: rec.hhSearchTitle ?? rec.title,
        firstJobTitle: rec.firstJobTitle ?? rec.title,
        searchAliases: rec.searchAliases ?? [],
      })),
    };
  }

  async generateRoadmap(input: RoadmapGenerationContext): Promise<RoadmapMilestoneResult[]> {
    // 6-8 milestones with 3-4 tasks each (trimmed from 6-10/3-6, and
    // resources requested only on each milestone's first task — see
    // `buildRoadmapPrompt`) — still a genuinely large structured response,
    // so it gets real headroom rather than the default budget. The
    // ORIGINAL 6-10/3-6 shape with per-task resources measured live at
    // ~3400+ real output tokens, which silently truncated mid-JSON at a
    // 2500-token cap after a 95s wait (`AI response was not valid JSON`) —
    // this smaller ask plus a larger cap fixes both the correctness bug and
    // the latency at once.
    const result = await this.completeJson(buildRoadmapPrompt(input), roadmapResponseSchema, "generateRoadmap", [], input.signal, 3000);
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
    return this.completeJson(buildCareerMissionsPrompt(input), careerMissionsResponseSchema, "generateCareerMissions", [], input.signal, 3000);
  }

  async generateInterviewQuestion(input: InterviewQuestionContext): Promise<InterviewQuestionResult> {
    return this.completeJson(
      buildInterviewQuestionPrompt(input),
      interviewQuestionResponseSchema,
      "generateInterviewQuestion"
    );
  }

  async evaluateInterviewAnswer(input: InterviewAnswerContext): Promise<InterviewAnswerEvaluationResult> {
    // 7 score fields plus 4 real text fields (feedback/strengths/improvements/idealAnswerNotes) — the
    // default 500-token budget was tight enough to risk truncated JSON.
    return this.completeJson(
      buildInterviewAnswerEvaluationPrompt(input),
      interviewAnswerEvaluationResponseSchema,
      "evaluateInterviewAnswer",
      [],
      undefined,
      900
    );
  }

  async generateInterviewReport(input: InterviewReportContext): Promise<InterviewReportResult> {
    // 5 category scores plus 3 arrays (2-4 items each) plus a narrative verdict.
    return this.completeJson(buildInterviewReportPrompt(input), interviewReportResponseSchema, "generateInterviewReport", [], undefined, 900);
  }

  async generateJobPreparationPlan(input: JobPreparationContext): Promise<JobPreparationResult> {
    // 5 separate arrays (up to ~19 short strings total).
    return this.completeJson(buildJobPreparationPrompt(input), jobPreparationResponseSchema, "generateJobPreparationPlan", [], undefined, 900);
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
