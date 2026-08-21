export const missionKeys = [
  "startInterview",
  "viewCareerAnalysis",
  "addSkills",
  "buildRoadmap",
  "createResume",
  "completeMockInterview",
] as const;

export type MissionKey = (typeof missionKeys)[number];

export interface MissionSignals {
  interviewReady: boolean;
  hasCareerAnalysis: boolean;
  hasSkills: boolean;
  hasRoadmap: boolean;
  hasResume: boolean;
  hasCompletedInterview: boolean;
}

/** Weekly missions are just the concrete-next-action gaps, in a fixed, sensible order. Order here is the order they render in. */
export function computeMissionCompletion(signals: MissionSignals): Record<MissionKey, boolean> {
  return {
    startInterview: signals.interviewReady,
    viewCareerAnalysis: signals.hasCareerAnalysis,
    addSkills: signals.hasSkills,
    buildRoadmap: signals.hasRoadmap,
    createResume: signals.hasResume,
    completeMockInterview: signals.hasCompletedInterview,
  };
}
