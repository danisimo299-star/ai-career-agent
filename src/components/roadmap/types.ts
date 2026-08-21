export type MilestoneStatus = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";
export type ResourceType = "YOUTUBE" | "DOCUMENTATION" | "COURSE" | "BOOK" | "ARTICLE";
export type ResourceDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface ResourceData {
  id: string;
  title: string;
  type: ResourceType;
  provider: string | null;
  difficulty: ResourceDifficulty | null;
  language: string | null;
  url: string | null;
  verified: boolean;
}

export interface TaskData {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskWithResourcesData extends TaskData {
  resources: ResourceData[];
}

export interface MilestoneListData {
  id: string;
  order: number;
  title: string;
  description: string;
  whyItMatters: string;
  expectedResult: string;
  estimatedWeeks: number;
  skills: string[];
  status: MilestoneStatus;
  tasks: TaskWithResourcesData[];
}

export interface RoadmapData {
  id: string;
  careerTitle: string;
  milestones: MilestoneListData[];
}
