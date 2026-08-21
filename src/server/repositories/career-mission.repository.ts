import { prisma } from "@/lib/db/prisma";
import type { CareerMissionStatus } from "@prisma/client";
import type { EnrichedResourceInput } from "@/lib/career/resource-enrichment";

export interface CreateCareerMissionInput {
  roadmapId?: string;
  milestoneId?: string;
  roadmapTaskId?: string;
  title: string;
  description: string;
  goal: string;
  instructions: string[];
  whyItMatters: string;
  expectedResult: string;
  estimatedMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  skill?: string;
  priority: number;
  missionDate: Date;
  resources: EnrichedResourceInput[];
}

const missionInclude = { resources: true } as const;

export const careerMissionRepository = {
  listByUserAndDate: (userId: string, date: Date) =>
    prisma.careerMission.findMany({
      where: { userId, missionDate: date },
      include: missionInclude,
      // Status first (enum declaration order puts AVAILABLE/IN_PROGRESS
      // before terminal states) so a freshly regenerated mission always
      // outranks the terminal one it replaced, even at equal priority.
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
    }),

  listRecentByUser: (userId: string, sinceDate: Date) =>
    prisma.careerMission.findMany({
      where: { userId, missionDate: { gte: sinceDate } },
      include: missionInclude,
      orderBy: [{ missionDate: "desc" }, { priority: "desc" }],
    }),

  listCompletedDates: (userId: string, sinceDate: Date) =>
    prisma.careerMission
      .findMany({
        where: { userId, status: "COMPLETED", missionDate: { gte: sinceDate } },
        select: { missionDate: true },
        distinct: ["missionDate"],
      })
      .then((rows) => rows.map((r) => r.missionDate)),

  findById: (id: string) => prisma.careerMission.findUnique({ where: { id }, include: missionInclude }),

  createManyForUser: (userId: string, missions: CreateCareerMissionInput[]) =>
    prisma.$transaction(
      missions.map(({ resources, ...mission }) =>
        prisma.careerMission.create({
          data: { userId, ...mission, resources: { create: resources } },
          include: missionInclude,
        })
      )
    ),

  createOneForUser: (userId: string, mission: CreateCareerMissionInput) => {
    const { resources, ...rest } = mission;
    return prisma.careerMission.create({
      data: { userId, ...rest, resources: { create: resources } },
      include: missionInclude,
    });
  },

  updateStatus: (
    id: string,
    status: CareerMissionStatus,
    extra: { startedAt?: Date; completedAt?: Date; skippedAt?: Date } = {}
  ) => prisma.careerMission.update({ where: { id }, data: { status, ...extra } }),

  expireStale: (userId: string, beforeDate: Date) =>
    prisma.careerMission.updateMany({
      where: { userId, missionDate: { lt: beforeDate }, status: { in: ["AVAILABLE", "IN_PROGRESS"] } },
      data: { status: "EXPIRED", expiresAt: new Date() },
    }),
};
