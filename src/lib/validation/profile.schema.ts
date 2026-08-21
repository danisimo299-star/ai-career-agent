import { z } from "zod";

/**
 * Only the fields a user should be able to write to their own profile
 * directly. Deliberately excludes AI/system-computed fields (careerScore,
 * careerDna, careerInsights, interviewTopicsCovered, strengths, weaknesses,
 * personalitySummary) and onboarding-owned categorical fields
 * (onboardingCompleted, educationStage, interests, goals — editing those
 * needs the same validated enum/key set onboarding uses, not free text).
 */
export const profileUpdateSchema = z
  .object({
    bio: z.string().trim().max(2000).optional(),
    age: z.number().int().min(10).max(100).optional(),
    city: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    languages: z.array(z.string().trim().max(50)).max(20).optional(),
    skills: z.array(z.string().trim().max(50)).max(50).optional(),
    salaryExpectation: z.string().trim().max(200).optional(),
    experienceLevel: z.enum(["STUDENT", "GRADUATE", "JUNIOR", "CAREER_CHANGER", "MID", "SENIOR"]).optional(),
    preferredFormat: z.enum(["REMOTE", "HYBRID", "ONSITE", "ANY"]).optional(),
  })
  .strict();

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
