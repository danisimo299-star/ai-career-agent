import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export const profileRepository = {
  findByUserId: (userId: string) => prisma.profile.findUnique({ where: { userId } }),

  upsert: (userId: string, data: Prisma.ProfileUncheckedUpdateInput) =>
    prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data } as Prisma.ProfileUncheckedCreateInput,
    }),

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
        interviewTopicsCovered: [],
        careerPriorities: [],
        questionnaireCompleted: false,
      },
    }),
};
