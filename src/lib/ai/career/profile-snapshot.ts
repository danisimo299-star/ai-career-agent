import type { Profile } from "@prisma/client";
import type { ProfileSnapshot } from "./types";

export function toProfileSnapshot(profile: Profile | null): ProfileSnapshot {
  return {
    age: profile?.age ?? null,
    city: profile?.city ?? null,
    educationStage: profile?.educationStage ?? null,
    interests: profile?.interests ?? [],
    skills: profile?.skills ?? [],
    goals: profile?.goals ?? [],
    salaryExpectation: profile?.salaryExpectation ?? null,
    strengths: profile?.strengths ?? [],
    weaknesses: profile?.weaknesses ?? [],
    personalitySummary: profile?.personalitySummary ?? null,
    preferredFormat: profile?.preferredFormat ?? null,
    careerPriorities: profile?.careerPriorities ?? [],
  };
}
