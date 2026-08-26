import type { MilestoneStatus } from "@prisma/client";

export interface TaskLike {
  completed: boolean;
}

export interface MilestoneLike {
  tasks: TaskLike[];
}

export interface NamedTaskLike extends TaskLike {
  id: string;
  title: string;
}

export interface NamedMilestoneLike {
  title: string;
  status: MilestoneStatus;
  tasks: NamedTaskLike[];
}

export interface ProgressResult {
  completed: number;
  total: number;
  percent: number;
}

export interface ThisWeekResult {
  milestoneTitle: string;
  tasks: NamedTaskLike[];
  /** The current milestone's own completion — not the whole roadmap's — so a "35%" badge next to "this week" means what it says. */
  percent: number;
}

function progressOf(tasks: TaskLike[]): ProgressResult {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

/**
 * "This week" is deliberately scoped to ONE milestone (the current
 * IN_PROGRESS one, or the first AVAILABLE one if nothing is in progress
 * yet) rather than pooling incomplete tasks across the whole roadmap —
 * that keeps the dashboard's weekly view focused on what's actually
 * next, not a flattened backlog.
 */
export function pickThisWeekTasks(milestones: NamedMilestoneLike[], limit = 3): ThisWeekResult | null {
  const current =
    milestones.find((m) => m.status === "IN_PROGRESS") ?? milestones.find((m) => m.status === "AVAILABLE");
  if (!current) return null;

  const tasks = current.tasks.filter((t) => !t.completed).slice(0, limit);
  if (tasks.length === 0) return null;

  return { milestoneTitle: current.title, tasks, percent: progressOf(current.tasks).percent };
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
