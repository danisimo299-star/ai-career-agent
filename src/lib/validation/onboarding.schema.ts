import { z } from "zod";

export const educationStageValues = ["SCHOOL", "COLLEGE", "UNIVERSITY", "WORKING"] as const;

export const interestKeys = [
  "programming",
  "business",
  "marketing",
  "medicine",
  "engineering",
  "finance",
  "design",
  "science",
  "law",
  "education",
  "other",
] as const;

export const goalKeys = [
  "chooseProfession",
  "findInternship",
  "findFirstJob",
  "changeCareer",
  "improveSalary",
  "prepareInterview",
  "createResume",
  "other",
] as const;

export type InterestKey = (typeof interestKeys)[number];
export type GoalKey = (typeof goalKeys)[number];

export const onboardingSchema = z.object({
  name: z.string().trim().min(1).max(100),
  age: z.number().int().min(10).max(100),
  city: z.string().trim().min(1).max(100),
  educationStage: z.enum(educationStageValues),
  interests: z.array(z.enum(interestKeys)).min(1),
  goals: z.array(z.enum(goalKeys)).min(1),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
