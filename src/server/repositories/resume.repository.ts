import { prisma } from "@/lib/db/prisma";
import type { ResumeContent } from "@/types";
import type { Prisma, ResumeTemplate } from "@prisma/client";

export interface UpdateResumeInput {
  title?: string;
  content?: ResumeContent;
  template?: ResumeTemplate;
}

export const resumeRepository = {
  listByUser: (userId: string) => prisma.resume.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),

  findById: (id: string) => prisma.resume.findUnique({ where: { id } }),

  create: (userId: string, title: string, content: ResumeContent, template?: ResumeTemplate) =>
    prisma.resume.create({
      data: { userId, title, content: content as unknown as Prisma.InputJsonValue, ...(template ? { template } : {}) },
    }),

  update: (id: string, data: UpdateResumeInput) =>
    prisma.resume.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.content !== undefined ? { content: data.content as unknown as Prisma.InputJsonValue } : {}),
        ...(data.template !== undefined ? { template: data.template } : {}),
      },
    }),
};
