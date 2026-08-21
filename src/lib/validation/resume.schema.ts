import { z } from "zod";

const personalInfoSchema = z.object({
  fullName: z.string().trim().max(200),
  email: z.string().trim().max(200),
  phone: z.string().trim().max(50).optional(),
  city: z.string().trim().max(100).optional(),
  linkedin: z.string().trim().max(300).optional(),
  github: z.string().trim().max(300).optional(),
  website: z.string().trim().max(300).optional(),
});

const experienceEntrySchema = z.object({
  role: z.string().trim().max(200),
  company: z.string().trim().max(200),
  startDate: z.string().trim().max(50),
  endDate: z.string().trim().max(50).optional(),
  bullets: z.array(z.string().trim().max(500)).max(10),
});

const educationEntrySchema = z.object({
  school: z.string().trim().max(200),
  degree: z.string().trim().max(200),
  startDate: z.string().trim().max(50),
  endDate: z.string().trim().max(50).optional(),
});

const projectEntrySchema = z.object({
  name: z.string().trim().max(200),
  description: z.string().trim().max(1000),
  technologies: z.array(z.string().trim().max(50)).max(20),
  url: z.string().trim().max(300).optional(),
});

const languageEntrySchema = z.object({
  name: z.string().trim().max(100),
  level: z.string().trim().max(50),
});

const certificateEntrySchema = z.object({
  name: z.string().trim().max(200),
  issuer: z.string().trim().max(200).optional(),
  date: z.string().trim().max(50).optional(),
  url: z.string().trim().max(300).optional(),
});

export const resumeContentSchema = z.object({
  personalInfo: personalInfoSchema,
  careerObjective: z.string().trim().max(500),
  summary: z.string().trim().max(2000),
  experience: z.array(experienceEntrySchema).max(20),
  education: z.array(educationEntrySchema).max(20),
  projects: z.array(projectEntrySchema).max(20),
  skills: z.array(z.string().trim().max(60)).max(40),
  languages: z.array(languageEntrySchema).max(20),
  certificates: z.array(certificateEntrySchema).max(20),
});

export const updateResumeSchema = z.object({
  title: z.string().trim().max(200).optional(),
  content: resumeContentSchema.optional(),
  template: z.enum(["MODERN", "PROFESSIONAL", "MINIMAL"]).optional(),
});

export const generateDraftSchema = z.object({
  targetRole: z.string().trim().min(1).max(200),
});

export const generateSectionSchema = z.object({
  section: z.enum(["summary", "careerObjective", "experienceBullets", "projectDescription", "skills"]),
  /** The role currently typed in the editor, which may not be saved yet — always preferred over the persisted resume title so a suggestion never uses a stale or empty role. */
  targetRole: z.string().trim().max(200).optional(),
  sectionInput: z.object({
    role: z.string().trim().max(200).optional(),
    company: z.string().trim().max(200).optional(),
    existingBullets: z.array(z.string().trim().max(500)).max(10).optional(),
    projectName: z.string().trim().max(200).optional(),
    technologies: z.array(z.string().trim().max(50)).max(20).optional(),
    existingSkills: z.array(z.string().trim().max(60)).max(40).optional(),
  }),
});
