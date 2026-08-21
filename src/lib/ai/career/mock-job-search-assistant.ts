import { HH_AREA_IDS } from "@/lib/jobs/hh-reference";
import type { JobEmploymentType, JobExperienceLevel } from "@/lib/jobs/types";
import type { JobSearchAssistantContext, JobSearchAssistantResult } from "./types";

const CITY_DISPLAY: Record<string, string> = {
  "москва": "Москва",
  "moscow": "Moscow",
  "санкт-петербург": "Санкт-Петербург",
  "saint petersburg": "Saint Petersburg",
  "st petersburg": "Saint Petersburg",
  "spb": "Saint Petersburg",
  "спб": "Санкт-Петербург",
  "екатеринбург": "Екатеринбург",
  "yekaterinburg": "Yekaterinburg",
  "новосибирск": "Новосибирск",
  "novosibirsk": "Novosibirsk",
  "казань": "Казань",
  "kazan": "Kazan",
  "иннополис": "Иннополис",
  "innopolis": "Innopolis",
};

const REMOTE_KEYWORDS = ["remote", "удалён", "удален", "из дома", "work from home"];
const INTERNSHIP_KEYWORDS = ["intern", "стажир", "стажёр", "стажер"];
const NO_EXPERIENCE_KEYWORDS = [
  "without experience",
  "with no experience",
  "no experience",
  "без опыта",
  "junior",
  "джуниор",
  "джун",
  "entry level",
  "entry-level",
];
/** Leftover connector words that read fine mid-sentence but look wrong once the surrounding keyword phrase (city, experience, etc.) has been stripped out — e.g. "Python jobs in Kazan" -> "Python  in " once "jobs" and "Kazan" are gone. */
const STOPWORDS = ["in", "for", "at", "with", "and", "the", "a", "an", "в", "для", "с", "и"];
const SENIOR_KEYWORDS = ["senior", "сеньор", "синьор"];
const MID_KEYWORDS = ["middle", "миддл", "мидл"];
const PART_TIME_KEYWORDS = ["part-time", "part time", "частичная занятость", "неполный день"];

function findKeyword(haystack: string, keywords: string[]): string | null {
  return keywords.find((kw) => haystack.includes(kw)) ?? null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Word-boundary matching so e.g. stripping "in" never eats the middle of "Marketing". */
function stripKeywords(text: string, keywords: string[]): string {
  let result = text;
  for (const kw of keywords) result = result.replace(new RegExp(`\\b${escapeRegExp(kw)}\\b`, "gi"), " ");
  return result;
}

/**
 * No network call — a small deterministic keyword parser. It only ever
 * sets a field when the free text actually contains a recognizable signal
 * for it; everything else is left unset rather than guessed, matching the
 * same "never fabricate a filter" rule the real LLM prompt is given.
 */
export function parseMockJobSearchQuery(input: JobSearchAssistantContext): JobSearchAssistantResult {
  const raw = input.freeText.trim();
  const lower = raw.toLowerCase();

  const result: JobSearchAssistantResult = { targetRole: raw };

  const cityKey = Object.keys(HH_AREA_IDS).find((key) => lower.includes(key));
  if (cityKey) result.city = CITY_DISPLAY[cityKey] ?? cityKey;

  if (findKeyword(lower, REMOTE_KEYWORDS)) result.workFormat = "REMOTE";

  const isInternship = Boolean(findKeyword(lower, INTERNSHIP_KEYWORDS));
  if (isInternship) {
    result.internshipOnly = true;
    result.employmentTypes = ["probation"] satisfies JobEmploymentType[];
  } else if (findKeyword(lower, PART_TIME_KEYWORDS)) {
    result.employmentTypes = ["part"] satisfies JobEmploymentType[];
  }

  let experience: JobExperienceLevel | null = null;
  if (findKeyword(lower, SENIOR_KEYWORDS)) experience = "moreThan6";
  else if (findKeyword(lower, MID_KEYWORDS)) experience = "between1And3";
  else if (isInternship || findKeyword(lower, NO_EXPERIENCE_KEYWORDS)) experience = "noExperience";
  if (experience) result.experience = experience;

  const salaryMatch = lower.match(/(\d[\d\s]{2,})\s*(?:rub|руб|₽|k|тыс)/);
  if (salaryMatch) {
    const digits = salaryMatch[1].replace(/\s/g, "");
    const value = Number(digits) * (salaryMatch[0].includes("k") || salaryMatch[0].includes("тыс") ? 1000 : 1);
    if (Number.isFinite(value) && value > 0) result.salaryMin = value;
  }

  const allKeywords = [
    ...(cityKey ? [cityKey] : []),
    ...REMOTE_KEYWORDS,
    ...INTERNSHIP_KEYWORDS,
    ...NO_EXPERIENCE_KEYWORDS,
    ...SENIOR_KEYWORDS,
    ...MID_KEYWORDS,
    ...PART_TIME_KEYWORDS,
    "find me",
    "jobs",
    "vacancies",
    "найди",
    "вакансии",
    "работу",
  ];
  const afterKeywords = stripKeywords(raw, allKeywords);
  const cleanedRole = stripKeywords(afterKeywords, STOPWORDS).replace(/\s+/g, " ").trim();
  result.targetRole = cleanedRole.length > 1 ? cleanedRole : raw;

  return result;
}
