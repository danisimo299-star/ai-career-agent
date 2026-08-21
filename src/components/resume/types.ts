import type { ResumeContent } from "@/types";

export type ResumeTemplateId = "MODERN" | "PROFESSIONAL" | "MINIMAL";

export interface ResumeData {
  id: string;
  title: string;
  content: ResumeContent;
  template: ResumeTemplateId;
  createdAt: string;
  updatedAt: string;
}
