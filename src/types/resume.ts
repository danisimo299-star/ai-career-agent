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
 * Free-text "I don't have one" answers a user types into an empty-looking
 * field (see the Personal Info form, which has no placeholders) — these
 * must never survive into the exported resume, where they'd read as a
 * literal contact detail ("Нет", "-") to a recruiter.
 */
const PLACEHOLDER_ANSWERS = new Set([
  "нет", "нету", "отсутствует", "не указано", "без ссылки",
  "no", "none", "n/a", "na", "null", "-", "—",
]);

function isPlaceholderAnswer(value: string): boolean {
  return PLACEHOLDER_ANSWERS.has(value.trim().toLowerCase());
}

/** LinkedIn/GitHub/website only ever make sense as an actual link or handle — "Википедия Google" typed into a blank Website field is neither. */
function looksLikeLinkOrHandle(value: string): boolean {
  return /[./@]/.test(value);
}

function cleanContactField(value: string | undefined, requireLinkShape: boolean): string | null {
  const trimmed = value?.trim();
  if (!trimmed || isPlaceholderAnswer(trimmed)) return null;
  if (requireLinkShape && !looksLikeLinkOrHandle(trimmed)) return null;
  return trimmed;
}

export type ResumeContactType = "email" | "phone" | "city" | "linkedin" | "github" | "website";

export interface ResumeContactItem {
  type: ResumeContactType;
  value: string;
}

/**
 * The contact line shown under the name — filtered so a stray "Нет" or
 * nonsense answer typed into a blank optional field never reaches the
 * downloadable PDF or the on-screen preview, and tagged with its field type
 * so both renderers can show the right icon (envelope/phone/pin/link)
 * instead of a wall of dot-separated text. Both read from this one function
 * so they can never disagree about what counts as real contact info.
 */
export function getResumeContactItems(personalInfo: ResumePersonalInfo): ResumeContactItem[] {
  const candidates: { type: ResumeContactType; value: string | undefined; requireLinkShape: boolean }[] = [
    { type: "email", value: personalInfo.email, requireLinkShape: false },
    { type: "phone", value: personalInfo.phone, requireLinkShape: false },
    { type: "city", value: personalInfo.city, requireLinkShape: false },
    { type: "linkedin", value: personalInfo.linkedin, requireLinkShape: true },
    { type: "github", value: personalInfo.github, requireLinkShape: true },
    { type: "website", value: personalInfo.website, requireLinkShape: true },
  ];

  return candidates
    .map(({ type, value, requireLinkShape }) => {
      const cleaned = cleanContactField(value, requireLinkShape);
      return cleaned ? { type, value: cleaned } : null;
    })
    .filter((item): item is ResumeContactItem => item !== null);
}

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
