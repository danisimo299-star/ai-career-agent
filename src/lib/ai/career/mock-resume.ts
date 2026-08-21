import { findProfessionByTitle } from "./mock-data";
import type { ResumeGenerationContext, ResumeDraftResult, ResumeSectionContext, ResumeSectionSuggestion } from "./types";

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
