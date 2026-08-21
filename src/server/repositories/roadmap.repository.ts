import { prisma } from "@/lib/db/prisma";
import type { MilestoneStatus } from "@prisma/client";
import type { EnrichedResourceInput } from "@/lib/career/resource-enrichment";

export type CreateResourceInput = EnrichedResourceInput;

export interface CreateTaskInput {
  title: string;
  resources: CreateResourceInput[];
}

export interface CreateMilestoneInput {
  title: string;
  description: string;
  whyItMatters: string;
  expectedResult: string;
  estimatedWeeks: number;
  skills: string[];
  status: MilestoneStatus;
  tasks: CreateTaskInput[];
}

const roadmapInclude = {
  milestones: {
    orderBy: { order: "asc" as const },
    include: {
      tasks: {
        orderBy: { order: "asc" as const },
        include: { resources: true },
      },
    },
  },
};

export const roadmapRepository = {
  findByUser: (userId: string) => prisma.roadmap.findUnique({ where: { userId }, include: roadmapInclude }),

  replaceForUser: (
    userId: string,
    careerTitle: string,
    milestones: CreateMilestoneInput[],
    careerRecommendationId?: string
  ) =>
    prisma.$transaction(async (tx) => {
      await tx.roadmap.deleteMany({ where: { userId } });
      return tx.roadmap.create({
        data: {
          userId,
          careerTitle,
          careerRecommendationId,
          milestones: {
            create: milestones.map((milestone, milestoneOrder) => ({
              order: milestoneOrder,
              title: milestone.title,
              description: milestone.description,
              whyItMatters: milestone.whyItMatters,
              expectedResult: milestone.expectedResult,
              estimatedWeeks: milestone.estimatedWeeks,
              skills: milestone.skills,
              status: milestone.status,
              tasks: {
                create: milestone.tasks.map((task, taskOrder) => ({
                  order: taskOrder,
                  title: task.title,
                  resources: { create: task.resources },
                })),
              },
            })),
          },
        },
        include: roadmapInclude,
      });
    }),

  findMilestoneById: (id: string) =>
    prisma.roadmapMilestone.findUnique({
      where: { id },
      include: { roadmap: true, tasks: { orderBy: { order: "asc" } } },
    }),

  updateMilestoneStatus: (id: string, status: MilestoneStatus) =>
    prisma.roadmapMilestone.update({ where: { id }, data: { status } }),

  findTaskById: (id: string) =>
    prisma.roadmapTask.findUnique({
      where: { id },
      include: {
        milestone: {
          include: { roadmap: true, tasks: { orderBy: { order: "asc" } } },
        },
      },
    }),

  updateTaskCompleted: (id: string, completed: boolean) =>
    prisma.roadmapTask.update({
      where: { id },
      data: { completed, completedAt: completed ? new Date() : null },
    }),
};
