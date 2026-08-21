import { prisma } from "@/lib/db/prisma";
import type { CareerRecommendationResult } from "@/lib/ai/career/types";

export const careerRepository = {
  listByUser: (userId: string) =>
    prisma.careerRecommendation.findMany({
      where: { userId },
      orderBy: { matchScore: "desc" },
    }),

  replaceForUser: (userId: string, recommendations: CareerRecommendationResult[]) =>
    prisma.$transaction([
      prisma.careerRecommendation.deleteMany({ where: { userId } }),
      prisma.careerRecommendation.createMany({
        data: recommendations.map((rec) => ({ userId, ...rec })),
      }),
    ]),
};
