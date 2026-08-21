import { prisma } from "@/lib/db/prisma";
import type { MissionStatus } from "@prisma/client";

export const missionRepository = {
  listByUser: (userId: string) => prisma.mission.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),

  upsertStatus: (userId: string, key: string, status: MissionStatus) =>
    prisma.mission.upsert({
      where: { userId_key: { userId, key } },
      update: { status, completedAt: status === "COMPLETED" ? new Date() : null },
      create: { userId, key, status, completedAt: status === "COMPLETED" ? new Date() : null },
    }),
};
