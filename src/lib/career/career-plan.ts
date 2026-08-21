const WEEKS_PER_MONTH = 4.345;

export interface CareerPlanMilestoneInput {
  title: string;
  estimatedWeeks: number;
  status: "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";
}

export interface CareerPlanMonth {
  monthIndex: number;
  milestoneTitles: string[];
  allCompleted: boolean;
}

export interface CareerPlanResult {
  months: CareerPlanMonth[];
  totalMonths: number;
}

/**
 * "My Career Plan" is deliberately not a new AI-generated artifact or a new
 * persisted model — it's a deterministic month-by-month reprojection of the
 * user's *existing* Roadmap milestones (same data `/dashboard/roadmap`
 * already shows as a sequential list), grouped by cumulative estimated
 * duration. Editing the roadmap is still the one source of truth; this is
 * just a different, calendar-shaped view of it.
 */
export function computeCareerPlan(milestones: CareerPlanMilestoneInput[]): CareerPlanResult {
  const months: CareerPlanMonth[] = [];
  let cumulativeWeeks = 0;

  for (const milestone of milestones) {
    const monthIndex = Math.floor(cumulativeWeeks / WEEKS_PER_MONTH);
    if (!months[monthIndex]) {
      months[monthIndex] = { monthIndex: monthIndex + 1, milestoneTitles: [], allCompleted: true };
    }
    months[monthIndex].milestoneTitles.push(milestone.title);
    if (milestone.status !== "COMPLETED") months[monthIndex].allCompleted = false;
    cumulativeWeeks += milestone.estimatedWeeks;
  }

  const compactMonths = months.filter(Boolean);
  return { months: compactMonths, totalMonths: compactMonths.length };
}
