export interface ResumePersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface ResumeExperienceEntry {
  role: string;
  company: string;
  startDate: string;
  endDate?: string;
  bullets: string[];
}

export interface ResumeEducationEntry {
  school: string;
  degree: string;
  startDate: string;
  endDate?: string;
}

export interface ResumeProjectEntry {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface ResumeLanguageEntry {
  name: string;
  level: string;
}

export interface ResumeCertificateEntry {
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
}

export interface ResumeContent {
  personalInfo: ResumePersonalInfo;
  careerObjective: string;
  summary: string;
  experience: ResumeExperienceEntry[];
  education: ResumeEducationEntry[];
  projects: ResumeProjectEntry[];
  skills: string[];
  languages: ResumeLanguageEntry[];
  certificates: ResumeCertificateEntry[];
}

export const emptyResumeContent = (fullName: string, email: string): ResumeContent => ({
  personalInfo: { fullName, email },
  careerObjective: "",
  summary: "",
  experience: [],
  education: [],
  projects: [],
  skills: [],
  languages: [],
  certificates: [],
});

/**
 * True once the user has actually written something — not just the blank
 * document auto-created so the editor always has somewhere to start.
 * `hasResume` signals (Career Score, Weekly Missions) key off this, not raw
 * row existence, so opening `/dashboard/resume` for the first time doesn't
 * silently mark "create a resume" as done.
 */
export function isResumeContentMeaningful(content: ResumeContent): boolean {
  return (
    content.summary.trim().length > 0 ||
    content.careerObjective.trim().length > 0 ||
    content.experience.length > 0 ||
    content.education.length > 0 ||
    content.projects.length > 0 ||
    content.skills.length > 0
  );
}
