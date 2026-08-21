import { prisma } from "@/lib/db/prisma";
import type { JobRecommendationDTO } from "@/types";
import type { JobSource, Prisma } from "@prisma/client";
import type { JobMatchResult } from "@/lib/career/job-matching";

export interface JobRecommendationWithMatch extends JobRecommendationDTO {
  matchScore: number;
  matchBreakdown: JobMatchResult["breakdown"];
}

export const jobRepository = {
  listByUser: (userId: string) => prisma.jobRecommendation.findMany({ where: { userId }, orderBy: { matchScore: "desc" } }),

  replaceForUser: (userId: string, jobs: JobRecommendationWithMatch[], source: JobSource) =>
    prisma.$transaction([
      prisma.jobRecommendation.deleteMany({ where: { userId } }),
      prisma.jobRecommendation.createMany({
        data: jobs.map((job) => ({
          userId,
          source,
          title: job.title,
          company: job.company,
          location: job.location,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
          matchReason: job.matchReason,
          sourceUrl: job.sourceUrl,
          requiredSkills: job.requiredSkills,
          employmentType: job.employmentType,
          workFormat: job.workFormat,
          experienceLevel: job.experienceLevel,
          matchScore: job.matchScore,
          matchBreakdown: job.matchBreakdown as unknown as Prisma.InputJsonValue,
        })),
      }),
    ]),
};
