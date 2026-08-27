import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type DbClient = typeof prisma | Prisma.TransactionClient;

export const interviewAttemptRepository = {
  findActive: (userId: string) =>
    prisma.interviewAttempt.findFirst({ where: { userId, status: "IN_PROGRESS" }, orderBy: { startedAt: "desc" } }),

  create: (userId: string, db: DbClient = prisma) => db.interviewAttempt.create({ data: { userId, status: "IN_PROGRESS" } }),

  complete: (id: string, topCareerTitle?: string | null, db: DbClient = prisma) =>
    db.interviewAttempt.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date(), topCareerTitle } }),

  /** A restart interrupts an unfinished attempt — distinct from `complete`, since it never produced a real result worth showing in history. */
  abandon: (id: string) => prisma.interviewAttempt.update({ where: { id }, data: { status: "ABANDONED" } }),

  setTopCareerTitle: (id: string, topCareerTitle: string) => prisma.interviewAttempt.update({ where: { id }, data: { topCareerTitle } }),

  /** Every past playthrough except the currently active one, newest first — the simple "previous results" history list (item 18). */
  listCompleted: (userId: string) =>
    prisma.interviewAttempt.findMany({ where: { userId, status: "COMPLETED" }, orderBy: { completedAt: "desc" } }),

  findMostRecentCompleted: (userId: string) =>
    prisma.interviewAttempt.findFirst({ where: { userId, status: "COMPLETED" }, orderBy: { completedAt: "desc" } }),

  /** The most recent IN_PROGRESS attempt gets created lazily, on first message — mirrors the existing "no explicit start action" onboarding chat UX. */
  async getOrCreateActive(userId: string) {
    const existing = await this.findActive(userId);
    if (existing) return existing;
    return this.create(userId);
  },
};
