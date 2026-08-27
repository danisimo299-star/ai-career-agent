import { prisma } from "@/lib/db/prisma";
import type { ChatRole, Prisma } from "@prisma/client";
import { ConcurrentInterviewWriteError } from "@/lib/errors";

type DbClient = typeof prisma | Prisma.TransactionClient;

export const chatRepository = {
  /** Only the CURRENT attempt's transcript — never a previous playthrough's, so a restarted interview's AI context and the on-screen chat both start clean (see `InterviewAttempt`). */
  listByAttempt: (attemptId: string, limit = 50) =>
    prisma.chatMessage.findMany({ where: { attemptId }, orderBy: { createdAt: "asc" }, take: limit }),

  append: (
    userId: string,
    role: ChatRole,
    content: string,
    attemptId: string,
    questionSpec?: Prisma.InputJsonValue | null,
    db: DbClient = prisma
  ) => db.chatMessage.create({ data: { userId, role, content, attemptId, questionSpec: questionSpec ?? undefined } }),

  /**
   * Persists one full Career Interview turn (the user's answer bubble + the
   * assistant's acknowledgement/next-question bubble + the profile fields
   * that answer writes) as one atomic unit, with an optimistic-concurrency
   * check on `Profile.interviewVersion`. If a concurrent request already
   * advanced the version, the `updateMany` matches 0 rows and the whole
   * transaction rolls back — including the two message inserts — so a lost
   * race never leaves duplicate or orphaned chat messages behind; the
   * caller (`chat.service.ts`) surfaces a plain retry instead.
   */
  async appendTurnAndUpdateProfile(params: {
    userId: string;
    attemptId: string;
    userContent: string;
    assistantContent: string;
    assistantQuestionSpec: Prisma.InputJsonValue | null;
    expectedVersion: number;
    profileUpdate: Prisma.ProfileUncheckedUpdateInput;
  }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.chatMessage.create({
        data: { userId: params.userId, role: "USER", content: params.userContent, attemptId: params.attemptId },
      });
      await tx.chatMessage.create({
        data: {
          userId: params.userId,
          role: "ASSISTANT",
          content: params.assistantContent,
          attemptId: params.attemptId,
          questionSpec: params.assistantQuestionSpec ?? undefined,
        },
      });
      const { count } = await tx.profile.updateMany({
        where: { userId: params.userId, interviewVersion: params.expectedVersion },
        data: { ...params.profileUpdate, interviewVersion: { increment: 1 } },
      });
      if (count === 0) throw new ConcurrentInterviewWriteError();
    });
  },
};
