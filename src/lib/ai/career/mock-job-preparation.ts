import { generalQuestions, hrQuestions, getTechnicalQuestions } from "@/lib/career/interview-bank";
import { seededPick } from "@/lib/career/seeded-random";
import type { Locale } from "@/lib/i18n/config";
import type { JobPreparationContext, JobPreparationResult } from "./types";

const RESUME_TIPS: Record<Locale, (skill: string) => string> = {
  en: (skill) => `Add a concrete example of using ${skill} — a project, task, or coursework — even a small one counts.`,
  ru: (skill) => `Добавь конкретный пример использования "${skill}" — проект, задачу или учебную работу, даже небольшой опыт считается.`,
};

const PLAN_STEPS: Record<Locale, string[]> = {
  en: [
    "Re-read the vacancy description and note every skill it mentions.",
    "Update your resume's skills section and summary to reflect the matches found below.",
    "Spend focused time on the top missing skill before the interview.",
    "Prepare short, concrete stories for the HR questions below (situation → action → result).",
    "Do a mock interview run for the technical questions below.",
  ],
  ru: [
    "Перечитай описание вакансии и отметь каждый упомянутый навык.",
    "Обнови раздел навыков и краткое резюме в соответствии с найденными совпадениями ниже.",
    "Удели отдельное время главному недостающему навыку перед собеседованием.",
    "Подготовь короткие конкретные истории для HR-вопросов ниже (ситуация → действие → результат).",
    "Проведи тренировочное собеседование по техническим вопросам ниже.",
  ],
};

/**
 * No network call — narrates a result the deterministic matching engine
 * already computed (`matchedSkills`/`missingSkills` are trusted as-is,
 * never recomputed here), using the same question banks the Interview
 * Simulator draws from so the two features feel consistent.
 */
export function buildMockJobPreparationPlan(input: JobPreparationContext): JobPreparationResult {
  const locale = input.locale;
  const tip = RESUME_TIPS[locale];

  const resumeRecommendations = input.missingSkills.slice(0, 3).map(tip);
  if (resumeRecommendations.length === 0) {
    resumeRecommendations.push(
      locale === "ru"
        ? `Твои навыки уже хорошо покрывают требования "${input.vacancyTitle}" — убедись, что резюме явно их перечисляет.`
        : `Your skills already cover most of "${input.vacancyTitle}"'s requirements — make sure your resume states them explicitly.`
    );
  }

  const skillsToImprove = input.missingSkills.slice(0, 4);

  const seed = `${input.vacancyTitle}:${input.company}`;
  const hrPool = hrQuestions[locale];
  const generalPool = generalQuestions[locale];
  const selectedHr = Array.from(new Set([seededPick(hrPool, `${seed}:hr1`), seededPick(hrPool, `${seed}:hr2`), seededPick(generalPool, `${seed}:gen`)]));

  const skillForTechnical = input.missingSkills[0] ?? input.requiredSkills[0] ?? input.targetRole;
  const technicalQuestions = getTechnicalQuestions(skillForTechnical, locale).slice(0, 4);

  return {
    resumeRecommendations,
    skillsToImprove,
    hrQuestions: selectedHr,
    technicalQuestions,
    preparationPlan: PLAN_STEPS[locale],
  };
}
