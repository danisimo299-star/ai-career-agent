import { prisma } from "@/lib/db/prisma";
import type { ChatRole, Prisma } from "@prisma/client";

export const chatRepository = {
  listByUser: (userId: string, limit = 50) =>
    prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: limit,
    }),

  append: (userId: string, role: ChatRole, content: string, questionSpec?: Prisma.InputJsonValue | null) =>
    prisma.chatMessage.create({ data: { userId, role, content, questionSpec: questionSpec ?? undefined } }),
};
