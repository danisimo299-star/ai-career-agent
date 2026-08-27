import type { Locale } from "@/lib/i18n/config";
import type { InterviewType, DifficultyLevel, InterviewQuestion } from "@prisma/client";
import { interviewRepository } from "@/server/repositories/interview.repository";
import { profileRepository } from "@/server/repositories/profile.repository";
import { resumeRepository } from "@/server/repositories/resume.repository";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import { toProfileSnapshot } from "@/lib/ai/career/profile-snapshot";
import { getAICareerService } from "@/lib/ai/career/get-career-service";
import { careerScoreService } from "@/server/services/career-score.service";
import { missionsService } from "@/server/services/missions.service";
import type { InterviewSetupContext, InterviewTurn, InterviewScoreBreakdown, ExperienceLevel } from "@/lib/ai/career/types";
import { isResumeContentMeaningful, type ResumeContent } from "@/types";
import { createTimer } from "@/lib/dev-timing";

/**
 * `session.experienceLevel` comes back from Prisma typed with its full
 * six-value enum (it also backs the unrelated, broader `Profile.experienceLevel`
 * field), but this feature's own `startSession` only ever writes one of the
 * four values `ExperienceLevel` (the narrower AI-domain type) allows — enforced
 * by `start/route.ts`'s Zod schema. Safe to narrow back on read.
 */
function toDomainExperienceLevel(value: string): ExperienceLevel {
  return value as ExperienceLevel;
}

export class InterviewAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterviewAccessError";
  }
}

function buildResumeSummaryText(content: ResumeContent | null): string | null {
  if (!content) return null;
  const parts = [content.summary];
  if (content.skills.length > 0) parts.push(`Skills: ${content.skills.join(", ")}.`);
  const recentExperience = content.experience[0];
  if (recentExperience) {
    parts.push(`Most recent role: ${recentExperience.role} at ${recentExperience.company}. ${recentExperience.bullets.join(" ")}`);
  }
  return parts.filter(Boolean).join(" ");
}

const MAX_RESUME_HIGHLIGHTS = 8;

/** Short, real facts pulled verbatim from experience bullets and project descriptions — never AI-invented — for RESUME_BASED questions to ask about directly. */
function buildResumeHighlights(content: ResumeContent | null): string[] {
  if (!content) return [];
  const bulletHighlights = content.experience.flatMap((e) => e.bullets.filter((b) => b.trim().length > 0));
  const projectHighlights = content.projects
    .filter((p) => p.name.trim().length > 0)
    .map((p) => `${p.name}${p.description ? `: ${p.description}` : ""}`);
  return [...projectHighlights, ...bulletHighlights].slice(0, MAX_RESUME_HIGHLIGHTS);
}

async function loadSetupContext(
  userId: string,
  locale: Locale,
  overrides: { targetRole: string; interviewType: InterviewType; difficulty: DifficultyLevel; experienceLevel: ExperienceLevel; targetQuestionCount: number }
): Promise<InterviewSetupContext> {
  const [profile, scoreSnapshot, resumes, roadmap] = await Promise.all([
    profileRepository.findByUserId(userId),
    careerScoreService.getSnapshot(userId),
    resumeRepository.listByUser(userId),
    roadmapRepository.findByUser(userId),
  ]);

  const latestResumeContent = (resumes[0]?.content as unknown as ResumeContent | undefined) ?? null;
  const latestResume = latestResumeContent && isResumeContentMeaningful(latestResumeContent) ? latestResumeContent : null;
  const currentMilestone = roadmap
    ? (roadmap.milestones.find((m) => m.status === "IN_PROGRESS") ?? roadmap.milestones.find((m) => m.status === "AVAILABLE") ?? null)
    : null;

  return {
    locale,
    profile: toProfileSnapshot(profile),
    dna: scoreSnapshot.dna,
    careerScore: profile?.careerScore ?? null,
    targetRole: overrides.targetRole,
    interviewType: overrides.interviewType,
    difficulty: overrides.difficulty,
    experienceLevel: overrides.experienceLevel,
    resumeSummary: buildResumeSummaryText(latestResume),
    resumeHighlights: buildResumeHighlights(latestResume),
    roadmapSkills: currentMilestone?.skills ?? [],
    targetQuestionCount: overrides.targetQuestionCount,
  };
}

function toTurn(question: InterviewQuestion): InterviewTurn | null {
  if (question.userAnswer === null || question.type === "MIXED") return null;
  return {
    question: question.question,
    type: question.type,
    skill: question.skill,
    isFollowUp: question.isFollowUp,
    answer: question.userAnswer,
  };
}

export const interviewService = {
  async startSession(
    userId: string,
    locale: Locale,
    setup: { targetRole: string; interviewType: InterviewType; difficulty: DifficultyLevel; experienceLevel: ExperienceLevel; questionCount: number }
  ) {
    const timer = createTimer("interview.startSession");
    const context = await loadSetupContext(userId, locale, { ...setup, targetQuestionCount: setup.questionCount });
    timer.mark("read+context");

    const firstQuestion = await getAICareerService().generateInterviewQuestion({ ...context, history: [] });
    timer.mark("ai");

    const session = await interviewRepository.create(userId, {
      targetRole: setup.targetRole,
      type: setup.interviewType,
      difficulty: setup.difficulty,
      experienceLevel: setup.experienceLevel,
      questionCount: setup.questionCount,
    });
    await interviewRepository.addQuestion(session.id, {
      order: 0,
      type: firstQuestion.type,
      skill: firstQuestion.skill,
      isFollowUp: false,
      question: firstQuestion.question,
    });
    timer.mark("save");
    timer.done();

    return interviewRepository.findById(session.id);
  },

  listByUser(userId: string) {
    return interviewRepository.listByUser(userId);
  },

  async getById(userId: string, sessionId: string) {
    const session = await interviewRepository.findById(sessionId);
    if (!session || session.userId !== userId) throw new InterviewAccessError("not_found");
    return session;
  },

  async submitAnswer(userId: string, questionId: string, answer: string, locale: Locale) {
    const timer = createTimer("interview.submitAnswer");
    const question = await interviewRepository.findQuestionById(questionId);
    if (!question || question.session.userId !== userId) throw new InterviewAccessError("not_found");
    if (question.session.status !== "IN_PROGRESS") throw new InterviewAccessError("session_finished");
    if (question.userAnswer !== null) throw new InterviewAccessError("already_answered");

    const session = question.session;
    const context = await loadSetupContext(userId, locale, {
      targetRole: session.targetRole,
      interviewType: session.type,
      difficulty: session.difficulty,
      experienceLevel: toDomainExperienceLevel(session.experienceLevel),
      targetQuestionCount: session.questionCount,
    });

    const priorQuestions = (await interviewRepository.findById(session.id))!.questions.filter((q) => q.id !== questionId);
    const history = priorQuestions.map(toTurn).filter((t): t is InterviewTurn => t !== null);
    timer.mark("read+context");

    const currentQuestion = {
      question: question.question,
      type: question.type as Exclude<InterviewType, "MIXED">,
      skill: question.skill,
      isFollowUp: question.isFollowUp,
    };

    const evaluation = await getAICareerService().evaluateInterviewAnswer({
      ...context,
      history,
      currentQuestion,
      answer,
    });
    timer.mark("ai-evaluate");

    await interviewRepository.recordAnswer(questionId, {
      userAnswer: answer,
      aiEvaluation: evaluation.feedback,
      scoreBreakdown: evaluation.scoreBreakdown,
      score: evaluation.score,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      idealAnswerNotes: evaluation.idealAnswerNotes,
    });

    const askedSoFar = history.filter((t) => !t.isFollowUp).length + (question.isFollowUp ? 0 : 1);
    // `!question.isFollowUp` caps a follow-up chain at depth 1: a
    // follow-up's own answer can never spawn another follow-up, only the
    // primary question it replied to can.
    const canFollowUp = !question.isFollowUp && evaluation.followUpQuestion !== null && askedSoFar < session.questionCount;

    const fullHistory: InterviewTurn[] = [...history, { ...currentQuestion, answer }];

    if (canFollowUp && evaluation.followUpQuestion) {
      await interviewRepository.addQuestion(session.id, {
        order: priorQuestions.length + 1,
        type: currentQuestion.type,
        skill: currentQuestion.skill,
        isFollowUp: true,
        question: evaluation.followUpQuestion,
      });
      timer.mark("save");
      timer.done();
      return interviewRepository.findById(session.id);
    }

    if (askedSoFar < session.questionCount) {
      const next = await getAICareerService().generateInterviewQuestion({ ...context, history: fullHistory });
      timer.mark("ai-nextQuestion");
      await interviewRepository.addQuestion(session.id, {
        order: priorQuestions.length + 1,
        type: next.type,
        skill: next.skill,
        isFollowUp: false,
        question: next.question,
      });
      timer.mark("save");
      timer.done();
      return interviewRepository.findById(session.id);
    }

    timer.mark("save");
    timer.done();
    // Last question answered — chains straight into the report generation
    // (its own [PERF] timer below), a second, necessarily sequential AI call
    // since the report depends on this answer's evaluation being recorded.
    return interviewService.finishSession(userId, session.id, locale);
  },

  async finishSession(userId: string, sessionId: string, locale: Locale) {
    const timer = createTimer("interview.finishSession");
    const session = await interviewRepository.findById(sessionId);
    if (!session || session.userId !== userId) throw new InterviewAccessError("not_found");
    timer.mark("read");

    const report = await getAICareerService().generateInterviewReport({
      locale,
      targetRole: session.targetRole,
      interviewType: session.type,
      experienceLevel: toDomainExperienceLevel(session.experienceLevel),
      turns: session.questions
        .map((q) => {
          const turn = toTurn(q);
          if (!turn) return null;
          return { ...turn, score: q.score, scoreBreakdown: (q.scoreBreakdown as unknown as InterviewScoreBreakdown | null) ?? null };
        })
        .filter((t): t is InterviewTurn & { score: number | null; scoreBreakdown: InterviewScoreBreakdown | null } => t !== null),
    });
    timer.mark("ai");

    const finished = await interviewRepository.finish(sessionId, report);
    await Promise.all([missionsService.sync(userId), careerScoreService.getSnapshot(userId)]);
    timer.mark("save");
    timer.done();
    return finished;
  },
};

export interface WeakSkillRecommendation {
  skill: string;
  averageScore: number;
  sampleSize: number;
}

const WEAK_SKILL_SCORE_THRESHOLD = 60;
const WEAK_SKILL_MIN_SAMPLES = 2;

/**
 * Computed from real stored technical-question scores across completed
 * sessions — never a fabricated statistic. Returns null when there isn't
 * enough data yet. Surfaced as a recommendation only; it never mutates the
 * roadmap itself (see ARCHITECTURE.md's "Interview Simulator" section).
 */
export async function getWeakSkillRecommendation(userId: string): Promise<WeakSkillRecommendation | null> {
  const sessions = await interviewRepository.listByUser(userId);
  const bySkill = new Map<string, number[]>();

  for (const session of sessions) {
    if (session.status !== "COMPLETED") continue;
    for (const question of session.questions) {
      if (question.type !== "TECHNICAL" || !question.skill || question.score === null) continue;
      const list = bySkill.get(question.skill) ?? [];
      list.push(question.score);
      bySkill.set(question.skill, list);
    }
  }

  let worst: WeakSkillRecommendation | null = null;
  for (const [skill, scores] of bySkill) {
    if (scores.length < WEAK_SKILL_MIN_SAMPLES) continue;
    const averageScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
    if (averageScore >= WEAK_SKILL_SCORE_THRESHOLD) continue;
    if (!worst || averageScore < worst.averageScore) {
      worst = { skill, averageScore, sampleSize: scores.length };
    }
  }

  return worst;
}
