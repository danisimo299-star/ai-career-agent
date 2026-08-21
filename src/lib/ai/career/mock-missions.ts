import type { Locale } from "@/lib/i18n/config";
import { seededPick } from "@/lib/career/seeded-random";
import {
  getSkillMissionTemplate,
  getMilestoneCategoryTemplates,
  detectMilestoneCategory,
  type MissionTemplate,
} from "@/lib/career/mission-templates";
import { computeFallbackMissionInsight } from "@/lib/career/mission-insight";
import type { CareerMissionsContext, CareerMissionResult, CareerMissionsGenerationResult, IncompleteRoadmapTask } from "./types";

const allCategories = ["foundation", "portfolio", "resume", "interview", "apply", "firstJob"] as const;

function interpolate(text: string, careerTitle: string): string {
  return text.replace(/\{career\}/g, careerTitle);
}

function pickUnused(templates: MissionTemplate[], usedTitles: Set<string>, seed: string): MissionTemplate {
  const unused = templates.filter((t) => !usedTitles.has(t.title));
  return seededPick(unused.length > 0 ? unused : templates, seed);
}

function toMissionResult(
  template: MissionTemplate,
  careerTitle: string,
  priority: number,
  skill: string | null,
  relatedTaskTitle: string | null
): CareerMissionResult {
  return {
    title: interpolate(template.title, careerTitle),
    description: interpolate(template.description, careerTitle),
    goal: interpolate(template.goal, careerTitle),
    instructions: template.instructions.map((i) => interpolate(i, careerTitle)),
    whyItMatters: interpolate(template.whyItMatters, careerTitle),
    expectedResult: interpolate(template.expectedResult, careerTitle),
    estimatedMinutes: template.estimatedMinutes,
    difficulty: template.difficulty,
    skill,
    relatedTaskTitle,
    priority,
    resources: [],
  };
}

function genericTaskMission(task: IncompleteRoadmapTask, locale: Locale, priority: number): CareerMissionResult {
  const isRu = locale === "ru";
  return {
    title: isRu ? `Практика: ${task.title}` : `Practice: ${task.title}`,
    description: isRu
      ? `Сфокусированная практика по теме «${task.title}» из этапа «${task.milestoneTitle}».`
      : `A focused practice session on "${task.title}", part of your "${task.milestoneTitle}" milestone.`,
    goal: isRu ? `Закрепить тему «${task.title}» на практике.` : `Apply "${task.title}" hands-on.`,
    instructions: isRu
      ? [`Найди 3-5 коротких примеров по теме «${task.title}».`, "Реши их самостоятельно.", "Запиши 2 предложения о том, что усвоил(а)."]
      : [`Find 3-5 short exercises on "${task.title}".`, "Work through them yourself.", "Write 2 sentences on what you learned."],
    whyItMatters: isRu
      ? `«${task.title}» — часть этапа «${task.milestoneTitle}» на твоём карьерном пути.`
      : `"${task.title}" is part of your "${task.milestoneTitle}" milestone on your career path.`,
    expectedResult: isRu ? "3-5 решённых примеров и краткие заметки." : "3-5 completed exercises and short notes.",
    estimatedMinutes: 30,
    difficulty: "MEDIUM",
    skill: null,
    relatedTaskTitle: task.title,
    priority,
    resources: [],
  };
}

function buildInsight(input: CareerMissionsContext, missions: CareerMissionResult[]): string {
  const focusSkill = missions.find((m) => m.skill)?.skill ?? input.currentMilestone?.skills[0] ?? null;
  return computeFallbackMissionInsight(
    { careerTitle: input.careerTitle, currentMilestoneTitle: input.currentMilestone?.title ?? null, focusSkill },
    input.locale
  );
}

export function buildMockCareerMissions(input: CareerMissionsContext): CareerMissionsGenerationResult {
  const usedTitles = new Set([...input.completedMissionTitles, ...input.skippedMissionTitles]);
  const seed = `${input.careerTitle}:${input.currentMilestone?.title ?? "none"}:${input.completedMissionTitles.length}`;
  const missions: CareerMissionResult[] = [];
  let usedTaskTitle: string | null = null;

  if (input.currentMilestone) {
    const category = detectMilestoneCategory(input.currentMilestone.title);
    const relatedTask = input.incompleteTasks.find((t) => t.milestoneTitle === input.currentMilestone?.title);
    usedTaskTitle = relatedTask?.title ?? null;
    if (category) {
      const template = pickUnused(getMilestoneCategoryTemplates(category, input.locale), usedTitles, seed);
      missions.push(toMissionResult(template, input.careerTitle, 10, null, usedTaskTitle));
    } else if (input.currentMilestone.skills[0]) {
      const skill = input.currentMilestone.skills[0];
      const template = getSkillMissionTemplate(skill, input.locale);
      missions.push(toMissionResult(template, input.careerTitle, 10, skill, usedTaskTitle));
    }
  }

  const remainingTasks = input.incompleteTasks.filter((t) => t.title !== usedTaskTitle).slice(0, 2);
  for (const task of remainingTasks) {
    if (missions.length >= input.count) break;
    missions.push(genericTaskMission(task, input.locale, 7));
  }

  const currentCategory = input.currentMilestone ? detectMilestoneCategory(input.currentMilestone.title) : null;
  for (const category of allCategories) {
    if (missions.length >= input.count) break;
    if (category === currentCategory) continue;

    const templates = getMilestoneCategoryTemplates(category, input.locale);
    const template = pickUnused(templates, usedTitles, `${seed}:${category}`);
    if (!missions.some((m) => m.title === interpolate(template.title, input.careerTitle))) {
      missions.push(toMissionResult(template, input.careerTitle, 3, null, null));
    }
  }

  missions.sort((a, b) => b.priority - a.priority);
  const finalMissions = missions.slice(0, input.count);

  return { missions: finalMissions, insight: buildInsight(input, finalMissions) };
}
