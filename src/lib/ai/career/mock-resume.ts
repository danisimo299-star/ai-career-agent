import { findProfessionByTitle } from "./mock-data";
import { computeResumeScore, type ResumeRecommendationKey } from "@/lib/career/resume-score";
import type { ResumeGenerationContext, ResumeDraftResult, ResumeSectionContext, ResumeSectionSuggestion, ResumeReviewContext, ResumeReviewResult } from "./types";

export function buildMockResumeDraft(input: ResumeGenerationContext): ResumeDraftResult {
  const isRu = input.locale === "ru";
  const profession = findProfessionByTitle(input.targetRole, input.locale);
  const catalogSkills = profession?.skills[input.locale] ?? [];
  const skills = input.profile.skills.length > 0 ? input.profile.skills : catalogSkills.length > 0 ? catalogSkills : isRu ? ["Коммуникация", "Решение проблем"] : ["Communication", "Problem solving"];

  const summary = isRu
    ? `Кандидат, ориентированный на роль «${input.targetRole}»${input.topRecommendationTitle ? `, по данным анализа карьеры также хорошо подходит для роли «${input.topRecommendationTitle}»` : ""}. Интересы: ${input.profile.interests.join(", ") || "разные направления"}.`
    : `Candidate targeting a "${input.targetRole}" role${input.topRecommendationTitle ? `, also a strong Career Analysis match for "${input.topRecommendationTitle}"` : ""}. Interests: ${input.profile.interests.join(", ") || "several fields"}.`;

  const careerObjective = isRu
    ? `Ищу позицию «${input.targetRole}», где смогу применить и развить: ${skills.slice(0, 3).join(", ")}.`
    : `Seeking a "${input.targetRole}" role where I can apply and grow: ${skills.slice(0, 3).join(", ")}.`;

  return { careerObjective, summary, skills: skills.slice(0, 8) };
}

const bulletTemplates: Record<string, string[]> = {
  en: [
    "Contributed to {role}-related work at {company}, collaborating with a cross-functional team.",
    "Took ownership of key tasks at {company}, delivering results on schedule.",
    "Improved existing processes at {company} through hands-on problem solving.",
  ],
  ru: [
    "Участвовал(а) в задачах, связанных с ролью «{role}», в компании {company}, работая в кросс-функциональной команде.",
    "Взял(а) на себя ответственность за ключевые задачи в {company}, выполняя их в срок.",
    "Улучшил(а) существующие процессы в {company} через практическое решение задач.",
  ],
};

export function buildMockResumeSection(input: ResumeSectionContext): ResumeSectionSuggestion {
  const isRu = input.locale === "ru";

  switch (input.section) {
    case "summary": {
      const skills = input.sectionInput.existingSkills ?? [];
      const text = isRu
        ? `Специалист, нацеленный на роль «${input.targetRole}»${skills.length > 0 ? `, с опытом в: ${skills.slice(0, 4).join(", ")}` : ""}.`
        : `Professional targeting a "${input.targetRole}" role${skills.length > 0 ? `, with experience in: ${skills.slice(0, 4).join(", ")}` : ""}.`;
      return { text };
    }
    case "careerObjective": {
      const text = isRu
        ? `Развиваю карьеру в направлении «${input.targetRole}», стремясь приносить измеримую пользу команде.`
        : `Building a career toward "${input.targetRole}", aiming to deliver measurable value to the team.`;
      return { text };
    }
    case "experienceBullets": {
      const role = input.sectionInput.role || input.targetRole;
      const company = input.sectionInput.company || (isRu ? "компании" : "the company");
      const pool = bulletTemplates[input.locale];
      const bullets = pool.map((template) => template.replace("{role}", role).replace("{company}", company));
      return { bullets: [...(input.sectionInput.existingBullets ?? []), ...bullets].slice(0, 4) };
    }
    case "projectDescription": {
      const name = input.sectionInput.projectName || (isRu ? "проект" : "project");
      const tech = (input.sectionInput.technologies ?? []).join(", ");
      const text = isRu
        ? `Реализовал(а) «${name}»${tech ? ` с использованием ${tech}` : ""}, решая конкретную практическую задачу.`
        : `Built "${name}"${tech ? ` using ${tech}` : ""}, solving a concrete practical problem.`;
      return { text };
    }
    case "skills": {
      const profession = findProfessionByTitle(input.targetRole, input.locale);
      const catalogSkills = profession?.skills[input.locale] ?? [];
      const existing = new Set(input.sectionInput.existingSkills ?? []);
      const suggestions = catalogSkills.filter((s) => !existing.has(s));
      const fallback = isRu ? ["Коммуникация", "Управление временем", "Работа в команде"] : ["Communication", "Time management", "Teamwork"];
      const pool = suggestions.length > 0 ? suggestions : fallback.filter((s) => !existing.has(s));
      return { skills: pool.slice(0, 6) };
    }
  }
}

const recommendationText: Record<ResumeRecommendationKey, { ru: string; en: string }> = {
  addPersonalInfo: { ru: "Добавь полное имя и email, чтобы с тобой могли связаться.", en: "Add your full name and email so recruiters can reach you." },
  addSummary: { ru: "Добавь короткое профессиональное резюме о себе.", en: "Add a short professional summary about yourself." },
  addExperienceOrProjects: { ru: "Добавь хотя бы один опыт работы или проект.", en: "Add at least one experience entry or project." },
  addEducation: { ru: "Добавь информацию об образовании.", en: "Add your education." },
  addExperienceBullets: {
    ru: "Добавь 2-3 пункта о своих обязанностях и результатах к каждому месту работы.",
    en: "Add 2-3 bullet points about your responsibilities and results to each role.",
  },
  addMeasurableResults: { ru: "Добавь измеримые результаты в описания опыта — цифры, %, итоги.", en: "Add measurable results to your experience bullets — numbers, %, outcomes." },
  addMoreSkills: { ru: "Добавь ещё несколько релевантных навыков.", en: "Add a few more relevant skills." },
  addKeywords: { ru: "Упомяни больше терминов, релевантных целевой позиции.", en: "Mention more keywords relevant to the target role." },
  shortenLongBullets: { ru: "Сократи самые длинные пункты опыта для лучшей читаемости.", en: "Shorten the longest experience bullets for better readability." },
};

/**
 * Deterministic, zero-network — reuses `computeResumeScore` (the same
 * function the Resume Readiness panel already uses) so the mock review
 * never contradicts what the user sees there, and never invents a fact
 * about the resume beyond what the score's own real checks found.
 */
export function buildMockResumeReview(input: ResumeReviewContext): ResumeReviewResult {
  const isRu = input.locale === "ru";
  const score = computeResumeScore(input.content, input.targetRole, input.locale);

  const strengths: string[] = [];
  if (score.breakdown.structure >= 70) strengths.push(isRu ? "Структура резюме выстроена логично." : "The resume's structure is well organized.");
  if (score.breakdown.achievements >= 60) strengths.push(isRu ? "В опыте есть измеримые результаты." : "Your experience includes measurable results.");
  if (input.content.skills.length >= 5) strengths.push(isRu ? "Указан хороший набор навыков." : "A solid set of skills is listed.");
  if (score.breakdown.summaryQuality >= 60) strengths.push(isRu ? "Профессиональное резюме звучит конкретно." : "The professional summary reads as specific, not generic.");
  if (strengths.length === 0) strengths.push(isRu ? "Уже есть базовая структура — есть с чем работать." : "There's already a basic structure to build on.");

  const improvements = score.recommendations.slice(0, 3).map((key) => recommendationText[key][isRu ? "ru" : "en"]);

  const missing: string[] = [];
  if (input.content.experience.length === 0 && input.content.projects.length === 0) missing.push(isRu ? "Опыт работы или проекты" : "Work experience or projects");
  if (input.content.education.length === 0) missing.push(isRu ? "Образование" : "Education");
  if (input.content.languages.length === 0) missing.push(isRu ? "Владение языками (если применимо)" : "Language skills (if relevant)");

  const fitNote = isRu
    ? `Совпадение с ключевыми словами для «${input.targetRole}»: ${score.breakdown.keywords}%. ${score.breakdown.keywords >= 60 ? "Резюме уже хорошо отражает требования этой роли." : "Стоит явнее упомянуть навыки, типичные для этой роли."}`
    : `Keyword match for "${input.targetRole}": ${score.breakdown.keywords}%. ${score.breakdown.keywords >= 60 ? "The resume already reflects this role's requirements well." : "Worth naming the skills typical for this role more explicitly."}`;

  const nextStep =
    improvements[0] ?? (isRu ? "Резюме выглядит хорошо — можно переходить к отклику на вакансии." : "The resume looks solid — you're ready to start applying.");

  return { strengths: strengths.slice(0, 3), improvements, missing: missing.slice(0, 3), fitNote, nextStep };
}
