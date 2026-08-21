import type { Locale } from "@/lib/i18n/config";
import { findProfessionByTitle } from "./mock-data";
import { getTasksForSkill } from "@/lib/career/skill-tasks";
import type { RoadmapMilestoneResult, RoadmapTaskResult } from "./types";

function toTasks(titles: readonly string[]): RoadmapTaskResult[] {
  return titles.map((title) => ({ title, resources: [] }));
}

const copy = {
  ru: {
    foundationTitle: "Основы карьеры",
    foundationDescription: (career: string) => `Разберись, что включает роль «${career}», и наметь план обучения.`,
    foundationWhy: "Чёткое понимание роли не даёт свернуть не туда на старте.",
    foundationResult: "Ты понимаешь, что входит в роль, и у тебя есть план на ближайшие недели.",
    foundationTasks: (career: string) => [
      `Изучить, что делает специалист «${career}» день за днём`,
      "Определить, каких навыков не хватает",
      "Составить план обучения по неделям",
    ],
    skillDescription: (skill: string, career: string) => `Освой «${skill}» — один из ключевых навыков для роли «${career}».`,
    skillWhy: (skill: string, career: string) => `Без «${skill}» сложно претендовать на позицию «${career}».`,
    skillResult: (skill: string) => `Ты уверенно применяешь «${skill}» в небольших задачах.`,
    portfolioTitle: "Портфолио",
    portfolioDescription: "Собери 2-3 проекта, которые показывают твои навыки на практике.",
    portfolioWhy: "Портфолио — доказательство навыков, которое работодатель видит раньше резюме.",
    portfolioResult: "У тебя есть 2-3 готовых проекта, которые можно показать.",
    portfolioTasks: ["Выбрать 2-3 идеи для проектов", "Реализовать первый проект", "Реализовать второй проект", "Оформить проекты с описанием"],
    resumeTitle: "Резюме",
    resumeDescription: (career: string) => `Подготовь резюме, ориентированное на роль «${career}».`,
    resumeWhy: "Резюме — первый фильтр, через который проходит отклик.",
    resumeResult: "У тебя есть резюме, готовое к отправке.",
    resumeTasks: ["Собрать ключевые достижения", "Составить черновик резюме", "Получить обратную связь", "Доработать резюме"],
    interviewTitle: "Подготовка к интервью",
    interviewDescription: (career: string) => `Потренируйся отвечать на типовые вопросы для роли «${career}».`,
    interviewWhy: "Уверенность на собеседовании часто решает исход не меньше, чем навыки.",
    interviewResult: "Ты уверенно проходишь тренировочное собеседование.",
    interviewTasks: ["Изучить частые вопросы для роли", "Пройти тренировочное собеседование", "Подготовить вопросы работодателю"],
    applyTitle: "Отклики на вакансии",
    applyDescription: "Начни откликаться на подходящие вакансии.",
    applyWhy: "Больше качественных откликов — больше шансов на приглашение.",
    applyResult: "Ты откликнулся на подходящие вакансии и отслеживаешь отклики.",
    applyTasks: ["Составить список подходящих компаний", "Откликнуться на 10+ вакансий", "Отслеживать статус откликов"],
    firstJobTitle: "Первая работа",
    firstJobDescription: "Выйди на первую позицию и успешно пройди начальный период.",
    firstJobWhy: "Первые месяцы формируют твою репутацию и уверенность в роли.",
    firstJobResult: "Ты успешно прошёл(ла) испытательный срок.",
    firstJobTasks: ["Обсудить оффер", "Подготовиться к первому дню", "Поставить цели на 30/60/90 дней"],
  },
  en: {
    foundationTitle: "Career Foundation",
    foundationDescription: (career: string) => `Understand what the "${career}" role actually involves and map out a learning plan.`,
    foundationWhy: "A clear picture of the role keeps you from wasting time on the wrong things early on.",
    foundationResult: "You understand what the role involves and have a plan for the coming weeks.",
    foundationTasks: (career: string) => [
      `Learn what a "${career}" does day to day`,
      "Identify which skills you're missing",
      "Sketch a week-by-week learning plan",
    ],
    skillDescription: (skill: string, career: string) => `Learn "${skill}" — one of the core skills for a "${career}" role.`,
    skillWhy: (skill: string, career: string) => `It's hard to be competitive for a "${career}" role without "${skill}".`,
    skillResult: (skill: string) => `You can confidently apply "${skill}" to small tasks.`,
    portfolioTitle: "Portfolio",
    portfolioDescription: "Put together 2-3 projects that show your skills in practice.",
    portfolioWhy: "A portfolio is proof of skill that employers see before your resume.",
    portfolioResult: "You have 2-3 finished projects you can show.",
    portfolioTasks: ["Pick 2-3 project ideas", "Build the first project", "Build the second project", "Write up the projects with descriptions"],
    resumeTitle: "Resume",
    resumeDescription: (career: string) => `Prepare a resume targeted at the "${career}" role.`,
    resumeWhy: "Your resume is the first filter an application has to pass.",
    resumeResult: "You have a resume ready to send out.",
    resumeTasks: ["Gather key achievements", "Draft the resume", "Get feedback", "Refine the resume"],
    interviewTitle: "Interview Preparation",
    interviewDescription: (career: string) => `Practice answering common questions for a "${career}" role.`,
    interviewWhy: "Confidence in an interview often matters as much as the underlying skill.",
    interviewResult: "You can confidently get through a mock interview.",
    interviewTasks: ["Research common questions for the role", "Do a mock interview", "Prepare questions to ask the employer"],
    applyTitle: "Job Applications",
    applyDescription: "Start applying to roles that match.",
    applyWhy: "More quality applications means more chances at an interview.",
    applyResult: "You've applied to matching roles and are tracking responses.",
    applyTasks: ["Build a list of target companies", "Apply to 10+ roles", "Track application status"],
    firstJobTitle: "First Job",
    firstJobDescription: "Start the role and get through the initial ramp-up period successfully.",
    firstJobWhy: "The first few months shape your reputation and confidence in the role.",
    firstJobResult: "You've successfully completed your probation period.",
    firstJobTasks: ["Negotiate the offer", "Prepare for day one", "Set 30/60/90 day goals"],
  },
} as const;

export function buildMockRoadmap(careerTitle: string, locale: Locale): RoadmapMilestoneResult[] {
  const c = copy[locale];
  const profession = findProfessionByTitle(careerTitle, locale) ?? findProfessionByTitle(careerTitle, locale === "ru" ? "en" : "ru");

  const skillEntries = profession
    ? profession.skillKeys.map((key, i) => ({ key, label: profession.skills[locale][i] ?? profession.skills.en[i] ?? key }))
    : [];

  const milestones: RoadmapMilestoneResult[] = [
    {
      title: c.foundationTitle,
      description: c.foundationDescription(careerTitle),
      whyItMatters: c.foundationWhy,
      expectedResult: c.foundationResult,
      estimatedWeeks: 1,
      skills: [],
      tasks: toTasks(c.foundationTasks(careerTitle)),
    },
  ];

  for (const { key, label } of skillEntries) {
    milestones.push({
      title: label,
      description: c.skillDescription(label, careerTitle),
      whyItMatters: c.skillWhy(label, careerTitle),
      expectedResult: c.skillResult(label),
      estimatedWeeks: 3,
      skills: [label],
      tasks: toTasks(getTasksForSkill(key, locale)),
    });
  }

  milestones.push(
    {
      title: c.portfolioTitle,
      description: c.portfolioDescription,
      whyItMatters: c.portfolioWhy,
      expectedResult: c.portfolioResult,
      estimatedWeeks: 3,
      skills: [],
      tasks: toTasks(c.portfolioTasks),
    },
    {
      title: c.resumeTitle,
      description: c.resumeDescription(careerTitle),
      whyItMatters: c.resumeWhy,
      expectedResult: c.resumeResult,
      estimatedWeeks: 1,
      skills: [],
      tasks: toTasks(c.resumeTasks),
    },
    {
      title: c.interviewTitle,
      description: c.interviewDescription(careerTitle),
      whyItMatters: c.interviewWhy,
      expectedResult: c.interviewResult,
      estimatedWeeks: 2,
      skills: [],
      tasks: toTasks(c.interviewTasks),
    },
    {
      title: c.applyTitle,
      description: c.applyDescription,
      whyItMatters: c.applyWhy,
      expectedResult: c.applyResult,
      estimatedWeeks: 4,
      skills: [],
      tasks: toTasks(c.applyTasks),
    },
    {
      title: c.firstJobTitle,
      description: c.firstJobDescription,
      whyItMatters: c.firstJobWhy,
      expectedResult: c.firstJobResult,
      estimatedWeeks: 4,
      skills: [],
      tasks: toTasks(c.firstJobTasks),
    }
  );

  return milestones;
}
