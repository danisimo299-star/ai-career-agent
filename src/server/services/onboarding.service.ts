import { prisma } from "@/lib/db/prisma";
import type { OnboardingInput } from "@/lib/validation/onboarding.schema";

export const onboardingService = {
  async complete(userId: string, data: OnboardingInput) {
    const [, profile] = await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { name: data.name } }),
      prisma.profile.upsert({
        where: { userId },
        update: {
          age: data.age,
          city: data.city,
          educationStage: data.educationStage,
          interests: data.interests,
          goals: data.goals,
          onboardingCompleted: true,
        },
        create: {
          userId,
          age: data.age,
          city: data.city,
          educationStage: data.educationStage,
          interests: data.interests,
          goals: data.goals,
          onboardingCompleted: true,
        },
      }),
    ]);

    return profile;
  },
};
