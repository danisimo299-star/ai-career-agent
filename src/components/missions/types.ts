export type CareerMissionStatus = "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "EXPIRED";
export type MissionDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface MissionResourceData {
  id: string;
  title: string;
  type: "YOUTUBE" | "DOCUMENTATION" | "COURSE" | "BOOK" | "ARTICLE";
  provider: string | null;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  language: string | null;
  url: string | null;
  verified: boolean;
}

export interface CareerMissionData {
  id: string;
  title: string;
  description: string;
  goal: string;
  instructions: string[];
  whyItMatters: string;
  expectedResult: string;
  estimatedMinutes: number;
  difficulty: MissionDifficulty;
  skill: string | null;
  priority: number;
  status: CareerMissionStatus;
  milestoneId: string | null;
  resources: MissionResourceData[];
}
