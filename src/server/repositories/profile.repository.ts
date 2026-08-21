import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export const profileRepository = {
  findByUserId: (userId: string) => prisma.profile.findUnique({ where: { userId } }),

  upsert: (userId: string, data: Prisma.ProfileUncheckedUpdateInput) =>
    prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data } as Prisma.ProfileUncheckedCreateInput,
    }),
};
