import type { QuestionId } from "@/lib/ai/career/questionnaire";

export interface QuestionSpecData {
  id: QuestionId;
  prompt: string;
}

export interface QuestionnaireMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  questionSpec?: QuestionSpecData | null;
}
