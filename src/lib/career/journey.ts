export type JourneyStageKey = "discover" | "choose" | "build" | "present" | "practice" | "apply" | "grow";
export type JourneyStageStatus = "done" | "current" | "todo";

export interface JourneyStage {
  key: JourneyStageKey;
  status: JourneyStageStatus;
}

/** Where each journey stage's primary action lives — the one shared source for every "go do the next step" link (Hero, Recommendation card, Sidebar status widget, ...). */
export const JOURNEY_STAGE_HREF: Record<JourneyStageKey, string> = {
  discover: "/dashboard/questionnaire",
  choose: "/dashboard/career-analysis",
  build: "/dashboard/roadmap",
  present: "/dashboard/resume",
  practice: "/dashboard/interview",
  apply: "/dashboard/jobs",
  grow: "/dashboard/coach",
};
