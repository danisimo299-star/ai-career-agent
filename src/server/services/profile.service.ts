import { profileRepository } from "@/server/repositories/profile.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { careerRepository } from "@/server/repositories/career.repository";
import type { ProfileUpdateInput } from "@/lib/validation/profile.schema";
import type { Prisma } from "@prisma/client";

export const profileService = {
  getProfile: (userId: string) => profileRepository.findByUserId(userId),

  async updateProfile(userId: string, data: ProfileUpdateInput) {
    const { name, ...profileFields } = data;
    if (name !== undefined) await userRepository.updateName(userId, name);
    return profileRepository.upsert(userId, profileFields as Prisma.ProfileUncheckedUpdateInput);
  },

  /** "Delete my career profile" — see `profileRepository.resetCareerData` for exactly what this does and doesn't touch. */
  async resetCareerProfile(userId: string) {
    await Promise.all([profileRepository.resetCareerData(userId), careerRepository.deleteAllForUser(userId)]);
  },
};
