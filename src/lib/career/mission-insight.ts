import type { Locale } from "@/lib/i18n/config";

export interface MissionInsightContext {
  careerTitle: string;
  currentMilestoneTitle: string | null;
  focusSkill: string | null;
}

/**
 * A deterministic, always-available fallback insight computed from real
 * current state (current milestone + focus skill) — used whenever missions
 * are just being *read*, not freshly generated, so the page always has a
 * grounded insight to show without an extra AI call on every view. Right
 * after generation, the AI's own fresh `insight` text is used instead (see
 * `career-mission.service.ts`).
 */
export function computeFallbackMissionInsight(context: MissionInsightContext, locale: Locale): string {
  const milestoneTitle = context.currentMilestoneTitle ?? context.careerTitle;

  if (!context.focusSkill) {
    return locale === "ru"
      ? `Сейчас твой основной фокус — этап «${milestoneTitle}». Заверши сегодняшние задания, чтобы двигаться дальше к цели «${context.careerTitle}».`
      : `Right now your main focus is the "${milestoneTitle}" milestone. Complete today's missions to keep moving toward ${context.careerTitle}.`;
  }

  return locale === "ru"
    ? `Сейчас ты продвигаешься по этапу «${milestoneTitle}». Судя по профилю, «${context.focusSkill}» — твой главный текущий пробел, поэтому сегодняшние задания сфокусированы именно на нём.`
    : `You're currently making progress on "${milestoneTitle}". Based on your profile, ${context.focusSkill} is your biggest current gap, so today's missions focus heavily on it.`;
}
