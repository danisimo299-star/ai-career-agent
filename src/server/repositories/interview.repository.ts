import { prisma } from "@/lib/db/prisma";
import type { Prisma, InterviewType, DifficultyLevel, ExperienceLevel } from "@prisma/client";
import type { InterviewReportResult, InterviewScoreBreakdown } from "@/lib/ai/career/types";

export interface CreateSessionInput {
  targetRole: string;
  type: InterviewType;
  difficulty: DifficultyLevel;
  experienceLevel: ExperienceLevel;
  questionCount: number;
}

export interface AddQuestionInput {
  order: number;
  type: InterviewType;
  skill: string | null;
  isFollowUp: boolean;
  question: string;
}

export interface RecordAnswerInput {
  userAnswer: string;
  aiEvaluation: string;
  scoreBreakdown: InterviewScoreBreakdown;
  score: number;
  strengths: string;
  improvements: string;
  idealAnswerNotes: string;
}

const sessionInclude = { questions: { orderBy: { order: "asc" as const } } };

export const interviewRepository = {
  listByUser: (userId: string) =>
    prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: sessionInclude,
    }),

  findById: (id: string) => prisma.interviewSession.findUnique({ where: { id }, include: sessionInclude }),

  create: (userId: string, input: CreateSessionInput) =>
    prisma.interviewSession.create({
      data: { userId, ...input },
      include: sessionInclude,
    }),

  addQuestion: (sessionId: string, input: AddQuestionInput) =>
    prisma.interviewQuestion.create({ data: { sessionId, ...input } }),

  findQuestionById: (id: string) =>
    prisma.interviewQuestion.findUnique({ where: { id }, include: { session: true } }),

  recordAnswer: (questionId: string, input: RecordAnswerInput) =>
    prisma.interviewQuestion.update({
      where: { id: questionId },
      data: {
        userAnswer: input.userAnswer,
        aiEvaluation: input.aiEvaluation,
        scoreBreakdown: input.scoreBreakdown as unknown as Prisma.InputJsonValue,
        score: input.score,
        strengths: input.strengths,
        improvements: input.improvements,
        idealAnswerNotes: input.idealAnswerNotes,
      },
    }),

  finish: (sessionId: string, report: InterviewReportResult) =>
    prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        report: report as unknown as Prisma.InputJsonValue,
      },
      include: sessionInclude,
    }),
};
