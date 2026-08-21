import { prisma } from "@/lib/db/prisma";
import type { JobSource, Prisma, SavedJobStatus } from "@prisma/client";

export interface CreateSavedJobInput {
  title: string;
  company: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  sourceUrl: string;
  source: JobSource;
  requiredSkills: string[];
  matchScore?: number;
  matchBreakdown?: Prisma.InputJsonValue;
}

export const savedJobRepository = {
  listByUser: (userId: string) => prisma.savedJob.findMany({ where: { userId }, orderBy: { savedAt: "desc" } }),

  findById: (id: string) => prisma.savedJob.findUnique({ where: { id } }),

  /** Same vacancy (by sourceUrl) saved twice for one user updates the existing row instead of duplicating it. */
  create: (userId: string, data: CreateSavedJobInput) =>
    prisma.savedJob.upsert({
      where: { userId_sourceUrl: { userId, sourceUrl: data.sourceUrl } },
      update: { ...data },
      create: { userId, ...data },
    }),

  updateStatus: (id: string, status: SavedJobStatus, notes?: string) =>
    prisma.savedJob.update({
      where: { id },
      data: { status, statusUpdatedAt: new Date(), ...(notes !== undefined ? { notes } : {}) },
    }),

  delete: (id: string) => prisma.savedJob.delete({ where: { id } }),
};
