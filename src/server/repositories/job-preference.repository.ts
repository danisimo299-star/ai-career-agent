import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export const jobPreferenceRepository = {
  findByUserId: (userId: string) => prisma.jobPreference.findUnique({ where: { userId } }),

  upsert: (userId: string, data: Prisma.JobPreferenceUncheckedUpdateInput) =>
    prisma.jobPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data } as Prisma.JobPreferenceUncheckedCreateInput,
    }),
};
