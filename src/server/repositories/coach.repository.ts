import { prisma } from "@/lib/db/prisma";
import type { CoachMessageRole, Prisma } from "@prisma/client";

export const coachRepository = {
  listByUser: (userId: string) =>
    prisma.coachMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),

  recentByUser: (userId: string, count = 10) =>
    prisma.coachMessage
      .findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: count })
      .then((messages) => messages.reverse()),

  append: (userId: string, role: CoachMessageRole, content: string, suggestedActions?: Prisma.InputJsonValue) =>
    prisma.coachMessage.create({ data: { userId, role, content, suggestedActions } }),
};

const MAX_MEMORY_FACTS = 20;

export const coachMemoryRepository = {
  recentByUser: (userId: string, count = 5) => prisma.coachMemoryFact.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: count }),

  async append(userId: string, fact: string) {
    const existing = await prisma.coachMemoryFact.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: MAX_MEMORY_FACTS });
    const isDuplicate = existing.some((f) => f.fact.toLowerCase().includes(fact.toLowerCase()) || fact.toLowerCase().includes(f.fact.toLowerCase()));
    if (isDuplicate) return null;

    const created = await prisma.coachMemoryFact.create({ data: { userId, fact } });

    if (existing.length >= MAX_MEMORY_FACTS) {
      const oldest = existing[existing.length - 1];
      await prisma.coachMemoryFact.delete({ where: { id: oldest.id } }).catch(() => {});
    }

    return created;
  },
};
