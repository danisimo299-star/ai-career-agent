import type { MilestoneStatus } from "@prisma/client";

export interface TaskLike {
  completed: boolean;
}

export interface MilestoneLike {
  tasks: TaskLike[];
}

export interface ProgressResult {
  completed: number;
  total: number;
  percent: number;
}

function progressOf(tasks: TaskLike[]): ProgressResult {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

export function computeMilestoneProgress(milestone: MilestoneLike): ProgressResult {
  return progressOf(milestone.tasks);
}

export function computeRoadmapProgress(milestones: MilestoneLike[]): ProgressResult {
  return progressOf(milestones.flatMap((m) => m.tasks));
}

/** A presentational range, not a precise estimate — real timelines are ranges, not single numbers. */
export function estimateMonthsRange(totalWeeks: number): { min: number; max: number } {
  const min = Math.max(1, Math.round(totalWeeks / 4.33));
  return { min, max: min + 2 };
}

export function initialMilestoneStatuses(count: number): MilestoneStatus[] {
  return Array.from({ length: count }, (_, i) => (i === 0 ? "AVAILABLE" : "LOCKED"));
}

/** What a milestone's status should become right after one of its tasks is toggled. */
export function nextMilestoneStatusAfterTaskToggle(
  currentStatus: MilestoneStatus,
  tasks: TaskLike[]
): MilestoneStatus {
  const allCompleted = tasks.length > 0 && tasks.every((t) => t.completed);
  if (allCompleted) return "COMPLETED";
  if (currentStatus === "COMPLETED") return "IN_PROGRESS";
  if (currentStatus === "AVAILABLE") return "IN_PROGRESS";
  return currentStatus;
}
