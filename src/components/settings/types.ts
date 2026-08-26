import type { EducationStage, ExperienceLevel, AiReplyStyle } from "@prisma/client";

export interface SettingsProfileData {
  age: number | null;
  city: string | null;
  educationStage: EducationStage | null;
  experienceLevel: ExperienceLevel | null;
  aiUseProfileContext: boolean;
  aiRememberHistory: boolean;
  aiReplyStyle: AiReplyStyle;
}
