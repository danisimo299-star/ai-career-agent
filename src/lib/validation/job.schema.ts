import { z } from "zod";
import { isSafeExternalUrl } from "@/lib/security/url-safety";

export const jobExperienceSchema = z.enum(["noExperience", "between1And3", "between3And6", "moreThan6"]);
export const jobEmploymentTypeSchema = z.enum(["full", "part", "project", "volunteer", "probation"]);
export const jobWorkFormatSchema = z.enum(["REMOTE", "HYBRID", "ONSITE", "ANY"]);
export const jobSortOrderSchema = z.enum(["bestMatch", "highestSalary", "newest", "lowestExperience"]);
export const savedJobStatusSchema = z.enum(["SAVED", "PREPARING", "APPLIED", "INTERVIEW", "REJECTED", "OFFER"]);

export const jobSearchFiltersSchema = z.object({
  targetRole: z.string().trim().min(1).max(200),
  city: z.string().trim().max(100).optional(),
  workFormat: jobWorkFormatSchema.optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  experience: jobExperienceSchema.optional(),
  employmentTypes: z.array(jobEmploymentTypeSchema).max(5).optional(),
  salaryMin: z.number().int().positive().max(100_000_000).optional(),
  internshipOnly: z.boolean().optional(),
  sort: jobSortOrderSchema.optional(),
  /** A career recommendation already resolved to a real HH professional-role id — reuses it instead of re-guessing from `targetRole` text alone. */
  professionalRoleIds: z.array(z.number().int().positive()).max(5).optional(),
  /** 0-based — "Показать ещё вакансии" fetches the next page instead of re-running page 0. */
  page: z.number().int().min(0).max(50).optional(),
});
export type JobSearchFiltersInput = z.infer<typeof jobSearchFiltersSchema>;

export const jobPreferencesSchema = z.object({
  city: z.string().trim().max(100).optional(),
  workFormat: jobWorkFormatSchema.optional(),
  experienceLevel: z.enum(["STUDENT", "GRADUATE", "JUNIOR", "CAREER_CHANGER", "MID", "SENIOR"]).optional(),
  employmentTypes: z.array(jobEmploymentTypeSchema).max(5).optional(),
  salaryExpectationMin: z.number().int().positive().max(100_000_000).optional(),
  openToInternship: z.boolean().optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
});
export type JobPreferencesInput = z.infer<typeof jobPreferencesSchema>;

const matchBreakdownSchema = z.object({
  skills: z.number(),
  experience: z.number(),
  location: z.number(),
  careerGoal: z.number(),
  salary: z.number(),
});

export const saveJobSchema = z.object({
  title: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(200),
  location: z.string().trim().max(100).optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  currency: z.string().trim().max(10).optional(),
  // `.url()` alone accepts any scheme with a valid authority shape (including
  // e.g. `javascript:`/`data:` in some parsers) — explicitly require http/https
  // so a hand-crafted request can never turn `sourceUrl` into an unsafe link.
  sourceUrl: z
    .string()
    .url()
    .max(2000)
    .refine(isSafeExternalUrl, { message: "unsafe_url_protocol" }),
  source: z.enum(["MOCK", "HH_RU"]),
  requiredSkills: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  matchScore: z.number().int().min(0).max(100).optional(),
  matchBreakdown: matchBreakdownSchema.optional(),
});
export type SaveJobInput = z.infer<typeof saveJobSchema>;

export const updateSavedJobStatusSchema = z.object({
  status: savedJobStatusSchema,
  notes: z.string().trim().max(2000).optional(),
});

export const jobSearchAssistantInputSchema = z.object({
  freeText: z.string().trim().min(2).max(500),
});

export const prepareForJobSchema = z.object({
  title: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(200),
  requiredSkills: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
});
