import { prisma } from "@/lib/db/prisma";
import type { CareerRecommendationResult } from "@/lib/ai/career/types";
import type { MarketValidation } from "@/server/services/career-market.service";

export const careerRepository = {
  listByUser: (userId: string) =>
    prisma.careerRecommendation.findMany({
      where: { userId },
      orderBy: { matchScore: "desc" },
    }),

  replaceForUser: (userId: string, recommendations: (CareerRecommendationResult & Partial<MarketValidation>)[]) =>
    prisma.$transaction([
      prisma.careerRecommendation.deleteMany({ where: { userId } }),
      prisma.careerRecommendation.createMany({
        data: recommendations.map((rec) => ({ userId, ...rec })),
      }),
    ]),

  /** "Показать ещё варианты" — adds more validated options alongside whatever's already there, never discards the existing ones (unlike `replaceForUser`, used by a full Regenerate/interview restart). */
  appendForUser: (userId: string, recommendations: (CareerRecommendationResult & Partial<MarketValidation>)[]) =>
    prisma.careerRecommendation.createMany({ data: recommendations.map((rec) => ({ userId, ...rec })) }),

  deleteAllForUser: (userId: string) => prisma.careerRecommendation.deleteMany({ where: { userId } }),
};
