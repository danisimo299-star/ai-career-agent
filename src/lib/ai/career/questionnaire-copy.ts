import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  QUESTION_DEFINITIONS,
  type QuestionId,
  type OptionSource,
  INTEREST_DIMENSION_KEYS,
  STRENGTH_KEYS,
  WORK_STYLE_KEYS,
  PRIORITY_KEYS,
  SALARY_RANGE_KEYS,
  WORK_FORMAT_KEYS,
} from "./questionnaire";

/**
 * Every question id's prompt text and option labels are fixed, dictionary-
 * driven copy — never AI-generated — so the Questionnaire never depends on
 * a model to invent correctly-shaped, correctly-translated UI chrome. The
 * AI's only contribution is the conversational acknowledgement sentence
 * (see `UserAnalysisResult.reply`).
 */

export function resolveQuestionPrompt(id: QuestionId, dict: Dictionary, context: Record<string, string>): string {
  const template = dict.questionnaire.prompts[id];
  return template.replace(/\{(\w+)\}/g, (_, token: string) => context[token] ?? "");
}

export function optionKeysFor(source: OptionSource, interests: string[]): readonly string[] {
  switch (source) {
    case "interests":
      return interests;
    case "interestDimension":
      return INTEREST_DIMENSION_KEYS;
    case "strengths":
      return STRENGTH_KEYS;
    case "workStyle":
      return WORK_STYLE_KEYS;
    case "priorities":
      return PRIORITY_KEYS;
    case "salaryRange":
      return SALARY_RANGE_KEYS;
    case "workFormat":
      return WORK_FORMAT_KEYS;
  }
}

export function resolveOptionLabel(source: OptionSource, key: string, dict: Dictionary): string {
  if (source === "interests") return dict.onboarding.steps.interests.options[key as keyof typeof dict.onboarding.steps.interests.options] ?? key;
  if (source === "workFormat") return dict.dashboard.jobsPage.filters.workFormat[key as keyof typeof dict.dashboard.jobsPage.filters.workFormat] ?? key;
  const catalog = dict.questionnaire.options[source as Exclude<OptionSource, "interests" | "workFormat">];
  return (catalog as Record<string, string>)[key] ?? key;
}

export function resolveOptionLabels(id: QuestionId, dict: Dictionary, interests: string[]): { key: string; label: string }[] {
  const def = QUESTION_DEFINITIONS[id];
  if (!def.optionSource) return [];
  return optionKeysFor(def.optionSource, interests).map((key) => ({ key, label: resolveOptionLabel(def.optionSource!, key, dict) }));
}
