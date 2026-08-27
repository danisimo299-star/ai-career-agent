import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

type DbClient = typeof prisma | Prisma.TransactionClient;

export const profileRepository = {
  findByUserId: (userId: string) => prisma.profile.findUnique({ where: { userId } }),

  upsert: (userId: string, data: Prisma.ProfileUncheckedUpdateInput, db: DbClient = prisma) =>
    db.profile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data } as Prisma.ProfileUncheckedCreateInput,
    }),

  /**
   * Optimistic-concurrency write for the Career Interview's read-modify-write
   * turn — succeeds only if `interviewVersion` still matches what this
   * request read at the start (nobody else advanced the interview in the
   * meantime); returns the number of rows actually updated (0 means a
   * concurrent write won the race and this one must be discarded, see
   * `chat.service.ts`). Requires the profile to already exist — always true
   * once onboarding has run.
   */
  async updateWithVersionCheck(userId: string, expectedVersion: number, data: Prisma.ProfileUncheckedUpdateInput, db: DbClient = prisma) {
    const result = await db.profile.updateMany({
      where: { userId, interviewVersion: expectedVersion },
      data: { ...data, interviewVersion: { increment: 1 } },
    });
    return result.count;
  },

  /**
   * "Delete my career profile" (Settings → Data & Privacy) — resets what the
   * Career Interview and AI analysis built up, not the account itself:
   * onboarding's own fields (name, age, city, educationStage) and
   * `onboardingCompleted` are untouched, so the user isn't sent back through
   * onboarding by this action.
   */
  resetCareerData: (userId: string) =>
    prisma.profile.update({
      where: { userId },
      data: {
        interests: [],
        goals: [],
        skills: [],
        strengths: [],
        weaknesses: [],
        personalitySummary: null,
        careerDna: Prisma.JsonNull,
        careerScore: null,
        careerInsights: [],
        careerSummary: null,
        interviewTopicsCovered: [],
        careerPriorities: [],
        questionnaireCompleted: false,
      },
    }),
};
