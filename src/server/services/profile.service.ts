import { profileRepository } from "@/server/repositories/profile.repository";
import type { Prisma } from "@prisma/client";

export const profileService = {
  getProfile: (userId: string) => profileRepository.findByUserId(userId),

  updateProfile: (userId: string, data: Prisma.ProfileUncheckedUpdateInput) =>
    profileRepository.upsert(userId, data),
};
