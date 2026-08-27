import { getDictionary } from "@/lib/i18n/dictionaries";
import { estimateCareerDna } from "./dna-heuristic";
import { professionCatalog, insightTemplates, summaryTemplates } from "./mock-data";
import { buildMockRoadmap } from "./mock-roadmap";
import { buildMockCareerMissions } from "./mock-missions";
import { buildMockInterviewQuestion, evaluateMockInterviewAnswer, generateMockInterviewReport } from "./mock-interview";
import { buildMockResumeDraft, buildMockResumeSection, buildMockResumeReview } from "./mock-resume";
import { buildMockJobPreparationPlan } from "./mock-job-preparation";
import { parseMockJobSearchQuery } from "./mock-job-search-assistant";
import { buildMockCoachReply, stripCoachDisplayMarkers } from "./mock-coach";
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

/**
 * No network calls, fully deterministic. `pickNextQuestionId` (called from
 * `chat.service.ts`, not here) already decided the adaptive question
 * sequence and `resolveQuestionPrompt` already resolved its dictionary
 * text — this only has to phrase a short, varied acknowledgement of
 * whatever the user just answered, plus refresh the Career DNA estimate
 * from the growing text corpus. Good enough to exercise, demo, and test
 * the entire pipeline with zero API keys.
 */
export class MockCareerService implements AICareerService {
  async analyzeUser(input: AnalyzeUserInput): Promise<UserAnalysisResult> {
    const dict = getDictionary(input.locale);

    const combinedText = [
      input.profile.personalitySummary,
      ...input.history.filter((m) => m.role === "user").map((m) => m.content),
      input.latestUserMessage,
    ]
      .filter(Boolean)
      .join(" ");
    const dna = estimateCareerDna(combinedText);

    if (!input.nextQuestionCategory) {
      return { reply: dict.questionnaire.readyReply, dna };
    }

    const acknowledgements = dict.questionnaire.acknowledgements;
    const seed = input.history.length % acknowledgements.length;
    const reply = acknowledgements[seed];

    return { reply, dna };
  }

  async generateCareerAnalysis(input: CareerAnalysisContext): Promise<CareerAnalysisResult> {
    const interests = input.profile.interests.length > 0 ? input.profile.interests : ["other"];
    const excluded = new Set(input.excludeTitles ?? []);

    const scored = professionCatalog
      .filter((profession) => !excluded.has(profession.title[input.locale]))
      .map((profession) => {
        const overlap = profession.interestTags.filter((tag) => interests.includes(tag)).length;
        return { profession, overlap };
      });

    scored.sort((a, b) => b.overlap - a.overlap);
    const top = scored.slice(0, 5);
    const maxOverlap = Math.max(1, top[0]?.overlap ?? 1);

    const recommendations = top.map(({ profession, overlap }) => ({
      title: profession.title[input.locale],
      matchScore: Math.min(97, 60 + Math.round((overlap / maxOverlap) * 35)),
      reasoning: profession.reasoning[input.locale],
      requiredSkills: profession.skills[input.locale],
      learningTimeMonths: profession.learningTimeMonths,
      growthPotential: profession.growthPotential,
      difficultyLevel: profession.difficultyLevel,
      hhSearchTitle: profession.hhSearchTitle[input.locale],
      firstJobTitle: profession.firstJobTitle[input.locale],
      searchAliases: profession.searchAliases[input.locale],
    }));

    const pool = insightTemplates[input.locale];
    const seedText = [input.profile.personalitySummary, input.profile.strengths.join(" ")].filter(Boolean).join(" ");
    const seed = seedText.length % pool.length;
    const topMatch = professionCatalog.find((p) => p.interestTags.some((tag) => interests.includes(tag))) ?? professionCatalog[0];

    return {
      summary: summaryTemplates[input.locale](topMatch.title[input.locale]),
      insights: Array.from({ length: 4 }, (_, i) => pool[(seed + i) % pool.length]),
      recommendations,
    };
  }

  async generateRoadmap(input: RoadmapGenerationContext): Promise<RoadmapMilestoneResult[]> {
    return buildMockRoadmap(input.careerTitle, input.locale);
  }

  async generateResume(input: ResumeGenerationContext): Promise<ResumeDraftResult> {
    return buildMockResumeDraft(input);
  }

  async generateResumeSection(input: ResumeSectionContext): Promise<ResumeSectionSuggestion> {
    return buildMockResumeSection(input);
  }

  async reviewResume(input: ResumeReviewContext): Promise<ResumeReviewResult> {
    return buildMockResumeReview(input);
  }

  async generateCareerMissions(input: CareerMissionsContext): Promise<CareerMissionsGenerationResult> {
    return buildMockCareerMissions(input);
  }

  async generateInterviewQuestion(input: InterviewQuestionContext): Promise<InterviewQuestionResult> {
    return buildMockInterviewQuestion(input);
  }

  async evaluateInterviewAnswer(input: InterviewAnswerContext): Promise<InterviewAnswerEvaluationResult> {
    return evaluateMockInterviewAnswer(input);
  }

  async generateInterviewReport(input: InterviewReportContext): Promise<InterviewReportResult> {
    return generateMockInterviewReport(input);
  }

  async generateJobPreparationPlan(input: JobPreparationContext): Promise<JobPreparationResult> {
    return buildMockJobPreparationPlan(input);
  }

  async parseJobSearchQuery(input: JobSearchAssistantContext): Promise<JobSearchAssistantResult> {
    return parseMockJobSearchQuery(input);
  }

  // Still zero network calls and fully deterministic (`buildMockCoachReply`
  // resolves the whole reply upfront) — chunked and paced only so the mock
  // path gives the same live, token-by-token feel as a real streamed
  // provider instead of a jarring instant response. `result.reply` may carry
  // a trailing internal turn-tracking marker (see `stripCoachDisplayMarkers`)
  // that must reach persistence (the `done` event's `content`) but must
  // never be streamed to the client as a visible delta.
  async *streamCoachReply(input: CoachReplyContext): AsyncIterable<CoachStreamEvent> {
    const result = buildMockCoachReply(input);
    const displayText = stripCoachDisplayMarkers(result.reply);
    const words = displayText.split(" ");
    for (const word of words) {
      yield { type: "delta", text: `${word} ` };
      await new Promise((resolve) => setTimeout(resolve, 12));
    }
    yield { type: "done", content: result.reply, intent: result.intent, memoryFact: result.memoryFact };
  }
}
