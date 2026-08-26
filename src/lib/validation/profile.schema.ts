import { z } from "zod";
import { educationStageValues } from "./onboarding.schema";

/**
 * Only the fields a user should be able to write to their own profile
 * directly. Deliberately excludes AI/system-computed fields (careerScore,
 * careerDna, careerInsights, interviewTopicsCovered, strengths, weaknesses,
 * personalitySummary) and onboarding-owned categorical fields (interests,
 * goals — editing those needs the same validated key set onboarding uses,
 * not free text; `educationStage` is included since it's the same
 * `z.enum` either way).
 *
 * `name` isn't a `Profile` column (it's on `User`) — `profileService.
 * updateProfile` splits it out before writing the rest to `Profile`.
 */
export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    bio: z.string().trim().max(2000).optional(),
    age: z.number().int().min(10).max(100).optional(),
    city: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    educationStage: z.enum(educationStageValues).optional(),
    languages: z.array(z.string().trim().max(50)).max(20).optional(),
    skills: z.array(z.string().trim().max(50)).max(50).optional(),
    salaryExpectation: z.string().trim().max(200).optional(),
    experienceLevel: z.enum(["STUDENT", "GRADUATE", "JUNIOR", "CAREER_CHANGER", "MID", "SENIOR"]).optional(),
    preferredFormat: z.enum(["REMOTE", "HYBRID", "ONSITE", "ANY"]).optional(),
    // Settings-page AI Coach preferences — real toggles read by coach.service.ts, see prisma/schema.prisma's Profile comment.
    aiUseProfileContext: z.boolean().optional(),
    aiRememberHistory: z.boolean().optional(),
    aiReplyStyle: z.enum(["BRIEF", "BALANCED", "DETAILED"]).optional(),
  })
  .strict();

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
