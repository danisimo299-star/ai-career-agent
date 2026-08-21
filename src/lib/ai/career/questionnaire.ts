import type { ProfileSnapshot } from "./types";

/**
 * The Questionnaire's entire question *sequence and structure* is decided
 * here, deterministically — never by the AI. This mirrors the "AI reasons,
 * code acts" split already used for Coach suggested-actions and the Jobs
 * search assistant: the AI's only job (see `analyzeUser`) is to phrase two
 * sentences (an acknowledgement + the next question's prompt) for whatever
 * question id this module already picked. That keeps every state
 * transition testable and immune to a model inventing an invalid shape.
 */

export const QUESTION_CATEGORIES = ["interests", "strengths", "background", "workStyle", "priorities", "goals", "location"] as const;
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

export const QUESTION_IDS = [
  "interestsPick",
  "interestsFollowup",
  "strengths",
  "weaknesses",
  "experienceYesNo",
  "experienceDetail",
  "workStyle",
  "priorities",
  "prioritiesSalaryRange",
  "location",
] as const;
export type QuestionId = (typeof QUESTION_IDS)[number];

export type QuestionType = "single" | "multi" | "yesNo" | "text";

export type OptionSource = "interests" | "interestDimension" | "strengths" | "workStyle" | "priorities" | "salaryRange" | "workFormat";

interface QuestionDefinition {
  category: QuestionCategory;
  type: QuestionType;
  optionSource?: OptionSource;
  maxSelect?: number;
  allowOther?: boolean;
  /** Text questions the user may leave blank without it being an error. */
  skippable?: boolean;
}

export const QUESTION_DEFINITIONS: Record<QuestionId, QuestionDefinition> = {
  interestsPick: { category: "interests", type: "single", optionSource: "interests" },
  interestsFollowup: { category: "interests", type: "single", optionSource: "interestDimension" },
  strengths: { category: "strengths", type: "multi", optionSource: "strengths", maxSelect: 3, allowOther: true },
  weaknesses: { category: "strengths", type: "text", skippable: true },
  experienceYesNo: { category: "background", type: "yesNo" },
  experienceDetail: { category: "background", type: "text", skippable: true },
  workStyle: { category: "workStyle", type: "single", optionSource: "workStyle" },
  priorities: { category: "priorities", type: "multi", optionSource: "priorities", maxSelect: 3 },
  prioritiesSalaryRange: { category: "priorities", type: "single", optionSource: "salaryRange" },
  location: { category: "location", type: "single", optionSource: "workFormat" },
} as const;

export const INTEREST_DIMENSION_KEYS = ["problems", "products", "data", "people"] as const;
export const STRENGTH_KEYS = ["analyticalThinking", "communication", "creativity", "organization", "problemSolving", "leadership", "attentionToDetail"] as const;
export const WORK_STYLE_KEYS = ["independent", "teamOriented", "structured", "flexible", "fastPaced", "researchOriented"] as const;
export const PRIORITY_KEYS = ["salary", "stability", "growth", "interestingWork", "flexibility", "remoteWork", "socialImpact"] as const;
export const SALARY_RANGE_KEYS = ["entryLevel", "midRange", "aboveMarket", "notSure"] as const;
export const WORK_FORMAT_KEYS = ["REMOTE", "HYBRID", "ONSITE", "ANY"] as const;

export interface QuestionSpec {
  id: QuestionId;
  /** AI/mock-authored, locale-aware question sentence — the only free-text part of the spec. */
  prompt: string;
}

export interface QuestionnaireState {
  covered: QuestionId[];
  /** The interest key picked in `interestsPick`, needed to phrase `interestsFollowup` and to know which single interest to explore when the user only has one. */
  pickedInterest: string | null;
  /** Whether "salary" was among the picks in `priorities`, gating `prioritiesSalaryRange`. */
  prioritizedSalary: boolean;
  /** Whether `experienceYesNo` was answered "yes", gating `experienceDetail`. */
  hasExperience: boolean;
}

export function initialQuestionnaireState(): QuestionnaireState {
  return { covered: [], pickedInterest: null, prioritizedSalary: false, hasExperience: false };
}

/**
 * Deterministically decides the next question id, skipping anything the
 * app already knows (a single known interest skips `interestsPick`
 * entirely; `location` is skipped if `preferredFormat` is already set) or
 * that a branch condition rules out (`experienceDetail` only after a "yes",
 * `prioritiesSalaryRange` only if "salary" was actually picked).
 * Returns `null` once every applicable question has been covered.
 */
export function pickNextQuestionId(profile: ProfileSnapshot, state: QuestionnaireState): QuestionId | null {
  const isCovered = (id: QuestionId) => state.covered.includes(id);
  const knownInterests = profile.interests ?? [];

  if (!isCovered("interestsPick")) {
    if (knownInterests.length > 1) return "interestsPick";
    // Zero or one known interest — nothing to choose between, skip straight to the follow-up.
  }
  if (!isCovered("interestsFollowup")) return "interestsFollowup";
  if (!isCovered("strengths")) return "strengths";
  if (!isCovered("weaknesses")) return "weaknesses";
  if (!isCovered("experienceYesNo")) return "experienceYesNo";
  if (state.hasExperience && !isCovered("experienceDetail")) return "experienceDetail";
  if (!isCovered("workStyle")) return "workStyle";
  if (!isCovered("priorities")) return "priorities";
  if (state.prioritizedSalary && !isCovered("prioritiesSalaryRange")) return "prioritiesSalaryRange";
  if (!isCovered("location") && !profile.preferredFormat) return "location";

  return null;
}

/** Total applicable steps for the CURRENT profile/state, for the progress bar — recomputed every turn since branches can add/remove steps. */
export function estimateQuestionnaireLength(profile: ProfileSnapshot, state: QuestionnaireState): number {
  let total = QUESTION_IDS.length;
  if ((profile.interests ?? []).length <= 1) total -= 1; // interestsPick skipped
  if (!state.hasExperience && !state.covered.includes("experienceDetail")) total -= 1; // experienceDetail likely skipped
  if (!state.prioritizedSalary && !state.covered.includes("prioritiesSalaryRange")) total -= 1; // prioritiesSalaryRange likely skipped
  if (profile.preferredFormat) total -= 1; // location skipped
  return Math.max(total, state.covered.length);
}
