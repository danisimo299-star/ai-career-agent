import { prisma } from "@/lib/db/prisma";

export const userRepository = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  findById: (id: string) => prisma.user.findUnique({ where: { id } }),

  create: (data: { email: string; passwordHash: string }) =>
    prisma.user.create({ data, select: { id: true, email: true, name: true } }),

  updateName: (id: string, name: string) => prisma.user.update({ where: { id }, data: { name } }),
};
