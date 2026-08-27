import type { Prisma, WorkFormat } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { chatRepository } from "@/server/repositories/chat.repository";
import { profileRepository } from "@/server/repositories/profile.repository";
import { interviewAttemptRepository } from "@/server/repositories/interview-attempt.repository";
import { toProfileSnapshot } from "@/lib/ai/career/profile-snapshot";
import { getAICareerService } from "@/lib/ai/career/get-career-service";
import { estimateCareerDna } from "@/lib/ai/career/dna-heuristic";
import type { CareerDnaScores } from "@/lib/ai/career/types";
import {
  pickNextQuestionId,
  estimateQuestionnaireLength,
  QUESTION_DEFINITIONS,
  type QuestionId,
  type QuestionnaireState,
} from "@/lib/ai/career/questionnaire";
import { resolveQuestionPrompt, resolveOptionLabel } from "@/lib/ai/career/questionnaire-copy";
import type { QuestionSpec } from "@/lib/ai/career/types";
import { createTimer } from "@/lib/dev-timing";

export interface QuestionnaireAnswerInput {
  content?: string;
  questionId?: QuestionId;
  selectedKeys?: string[];
  skipped?: boolean;
}

function mergeUnique(existing: string[], incoming: string[] | undefined): string[] {
  if (!incoming?.length) return existing;
  return Array.from(new Set([...existing, ...incoming]));
}

function splitList(text: string): string[] {
  return text
    .split(/[,;\n]|(?:\s+(?:and|и)\s+)/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 1)
    .slice(0, 6);
}

/** `covered` entries are either a bare `QuestionId` or `"id:value"` (see below) — normalize to bare ids for membership checks. */
function normalizeCovered(covered: string[]): QuestionId[] {
  return covered.map((c) => c.split(":")[0]) as QuestionId[];
}

function deriveState(covered: string[]): QuestionnaireState {
  const pickedEntry = covered.find((c) => c.startsWith("interestsPick:"));
  const experienceEntry = covered.find((c) => c.startsWith("experienceYesNo:"));
  return {
    covered: normalizeCovered(covered),
    pickedInterest: pickedEntry ? pickedEntry.split(":")[1] : null,
    hasExperience: experienceEntry ? experienceEntry.endsWith(":yes") : false,
    prioritizedSalary: false, // filled in by the caller from `profile.careerPriorities`
  };
}

/**
 * `total` is a live re-estimate, not a fixed constant — branches (see
 * `pickNextQuestionId`) can add or remove a step, so it can shift by one as
 * the interview proceeds. Exposed alongside the percent so the UI can show
 * a human "Step X of ~Y" instead of just a percentage.
 */
function computeProgress(snapshot: ReturnType<typeof toProfileSnapshot>, state: QuestionnaireState): { percent: number; step: number; total: number } {
  const total = estimateQuestionnaireLength(snapshot, state);
  if (total <= 0) return { percent: 100, step: state.covered.length, total: state.covered.length };
  return { percent: Math.min(100, Math.round((state.covered.length / total) * 100)), step: Math.min(state.covered.length + 1, total), total };
}

async function buildFirstQuestion(userId: string, locale: Locale) {
  const dict = getDictionary(locale);
  const profile = await profileRepository.findByUserId(userId);
  const snapshot = toProfileSnapshot(profile);
  const state = deriveState(profile?.interviewTopicsCovered ?? []);
  state.prioritizedSalary = (profile?.careerPriorities ?? []).includes("salary");
  const firstId = pickNextQuestionId(snapshot, state);
  const firstQuestion: QuestionSpec | null = firstId ? { id: firstId, prompt: resolveQuestionPrompt(firstId, dict, {}) } : null;
  return { dict, firstQuestion };
}

const ACKNOWLEDGEMENT_TIMEOUT_MS = 8000;
const ACKNOWLEDGEMENT_MAX_ATTEMPTS = 2;

function pickDeterministicAcknowledgement(dict: Dictionary, seed: number, isComplete: boolean): string {
  if (isComplete) return dict.questionnaire.readyReply;
  const pool = dict.questionnaire.acknowledgements;
  return pool[seed % pool.length];
}

/**
 * The Questionnaire's own state machine (`pickNextQuestionId`,
 * `resolveQuestionPrompt`) is 100% deterministic — the AI's only role each
 * turn is a decorative one-sentence acknowledgement (+ a Career DNA nudge).
 * That's real value for a genuinely free-text answer, but it must never be
 * allowed to block a plain multiple-choice click: a single slow/cold local
 * Ollama call turning "Continue" into a failed submit is exactly the bug
 * this function exists to prevent (see the interview-reliability brief).
 *
 * - Structured answers (single/multi/yesNo/skipped-text): skip the AI call
 *   entirely, use a deterministic rotating acknowledgement + the same
 *   heuristic DNA estimate `MockCareerService` already uses.
 * - Genuine free text: try the AI, with a hard per-attempt timeout and one
 *   short retry for a transient failure — but ALWAYS resolve to *something*
 *   usable rather than throwing, falling back to the same deterministic
 *   path on total failure. The answer is saved either way.
 */
async function resolveAcknowledgement(params: {
  needsAi: boolean;
  dict: Dictionary;
  seed: number;
  isComplete: boolean;
  combinedTextForDna: string;
  aiInput: Parameters<ReturnType<typeof getAICareerService>["analyzeUser"]>[0];
  timer: ReturnType<typeof createTimer>;
}): Promise<{ reply: string; dna: CareerDnaScores | null }> {
  const fallback = () => ({
    reply: pickDeterministicAcknowledgement(params.dict, params.seed, params.isComplete),
    dna: estimateCareerDna(params.combinedTextForDna),
  });

  if (!params.needsAi) {
    params.timer.mark("acknowledgement:deterministic");
    return fallback();
  }

  for (let attempt = 1; attempt <= ACKNOWLEDGEMENT_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ACKNOWLEDGEMENT_TIMEOUT_MS);
    try {
      const result = await getAICareerService().analyzeUser({ ...params.aiInput, signal: controller.signal });
      params.timer.mark(`acknowledgement:ai (attempt ${attempt})`);
      return { reply: result.reply, dna: result.dna ?? estimateCareerDna(params.combinedTextForDna) };
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[chat.service] analyzeUser attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  params.timer.mark("acknowledgement:ai-failed-fallback");
  return fallback();
}

export const chatService = {
  async getConversation(userId: string, locale: Locale) {
    const attempt = await interviewAttemptRepository.getOrCreateActive(userId);
    const existing = await chatRepository.listByAttempt(attempt.id);
    if (existing.length > 0) return existing;

    const { dict, firstQuestion } = await buildFirstQuestion(userId, locale);
    await chatRepository.append(userId, "ASSISTANT", dict.questionnaire.intro, attempt.id, firstQuestion as unknown as Prisma.InputJsonValue | null);
    return chatRepository.listByAttempt(attempt.id);
  },

  async getProgress(userId: string) {
    const profile = await profileRepository.findByUserId(userId);
    const snapshot = toProfileSnapshot(profile);
    const state = deriveState(profile?.interviewTopicsCovered ?? []);
    state.prioritizedSalary = (profile?.careerPriorities ?? []).includes("salary");
    return { ...computeProgress(snapshot, state), isComplete: profile?.questionnaireCompleted ?? false };
  },

  async sendMessage(userId: string, locale: Locale, answer: QuestionnaireAnswerInput) {
    const timer = createTimer("interview.sendMessage");
    const dict = getDictionary(locale);
    const attempt = await interviewAttemptRepository.getOrCreateActive(userId);
    const [history, profile] = await Promise.all([chatRepository.listByAttempt(attempt.id), profileRepository.findByUserId(userId)]);
    timer.mark("read");

    const coveredRaw = profile?.interviewTopicsCovered ?? [];
    const state = deriveState(coveredRaw);
    state.prioritizedSalary = (profile?.careerPriorities ?? []).includes("salary");
    const expectedVersion = profile?.interviewVersion ?? 0;

    const snapshotBefore = toProfileSnapshot(profile);
    const answeredId = answer.questionId ?? pickNextQuestionId(snapshotBefore, state);
    const def = answeredId ? QUESTION_DEFINITIONS[answeredId] : null;
    const selectedKeys = answer.selectedKeys ?? [];
    const otherText = (answer.content ?? "").trim();

    // ---- Deterministic extraction: what this specific answer writes into Profile, and how the state advances ----
    const profileUpdate: Prisma.ProfileUncheckedUpdateInput = {};
    const newCovered = [...coveredRaw];
    let displayText = otherText;

    if (answeredId === "interestsPick") {
      const key = selectedKeys[0] ?? profile?.interests[0] ?? "";
      newCovered.push(`interestsPick:${key}`);
      state.pickedInterest = key;
      displayText = displayText || resolveOptionLabel("interests", key, dict);
    } else if (answeredId === "interestsFollowup") {
      newCovered.push("interestsFollowup");
      const interestKey = state.pickedInterest ?? profile?.interests[0] ?? null;
      const dimensionKey = selectedKeys[0];
      if (interestKey && dimensionKey) {
        const interestLabel = resolveOptionLabel("interests", interestKey, dict);
        const dimensionLabel = resolveOptionLabel("interestDimension", dimensionKey, dict);
        displayText = displayText || dimensionLabel;
        const line = `${interestLabel}: ${dimensionLabel}`;
        profileUpdate.personalitySummary = [profile?.personalitySummary, line].filter(Boolean).join("\n");
      }
    } else if (answeredId === "strengths") {
      newCovered.push("strengths");
      const labels = selectedKeys.map((k) => resolveOptionLabel("strengths", k, dict));
      const extra = otherText ? splitList(otherText) : [];
      profileUpdate.strengths = mergeUnique(profile?.strengths ?? [], [...labels, ...extra]);
      displayText = displayText || labels.join(", ");
    } else if (answeredId === "weaknesses") {
      newCovered.push("weaknesses");
      if (!answer.skipped && otherText) {
        profileUpdate.weaknesses = mergeUnique(profile?.weaknesses ?? [], splitList(otherText));
      }
      displayText = answer.skipped ? dict.questionnaire.skipCta : otherText;
    } else if (answeredId === "experienceYesNo") {
      const yes = selectedKeys[0] === "yes";
      newCovered.push(`experienceYesNo:${yes ? "yes" : "no"}`);
      state.hasExperience = yes;
      displayText = displayText || dict.questionnaire.yesNo[yes ? "yes" : "no"];
    } else if (answeredId === "experienceDetail") {
      newCovered.push("experienceDetail");
      if (!answer.skipped && otherText) {
        const line = `${dict.questionnaire.prompts.experienceDetail} ${otherText}`;
        profileUpdate.personalitySummary = [profile?.personalitySummary, line].filter(Boolean).join("\n");
      }
      displayText = answer.skipped ? dict.questionnaire.skipCta : otherText;
    } else if (answeredId === "workStyle") {
      newCovered.push("workStyle");
      const key = selectedKeys[0];
      if (key) {
        const label = resolveOptionLabel("workStyle", key, dict);
        displayText = displayText || label;
        const line = `${dict.questionnaire.prompts.workStyle} ${label}`;
        profileUpdate.personalitySummary = [profile?.personalitySummary, line].filter(Boolean).join("\n");
      }
    } else if (answeredId === "priorities") {
      newCovered.push("priorities");
      profileUpdate.careerPriorities = selectedKeys;
      state.prioritizedSalary = selectedKeys.includes("salary");
      displayText = displayText || selectedKeys.map((k) => resolveOptionLabel("priorities", k, dict)).join(", ");
    } else if (answeredId === "prioritiesSalaryRange") {
      newCovered.push("prioritiesSalaryRange");
      const key = selectedKeys[0];
      if (key) {
        const label = resolveOptionLabel("salaryRange", key, dict);
        profileUpdate.salaryExpectation = label;
        displayText = displayText || label;
      }
    } else if (answeredId === "location") {
      newCovered.push("location");
      const key = selectedKeys[0];
      if (key) {
        profileUpdate.preferredFormat = key as WorkFormat;
        displayText = displayText || resolveOptionLabel("workFormat", key, dict);
      }
    }

    // ---- Decide what's next, purely from the updated state ----
    const snapshotAfter = toProfileSnapshot(profile);
    if (typeof profileUpdate.preferredFormat === "string") snapshotAfter.preferredFormat = profileUpdate.preferredFormat;
    if (Array.isArray(profileUpdate.careerPriorities)) snapshotAfter.careerPriorities = profileUpdate.careerPriorities as string[];
    const nextId = pickNextQuestionId(snapshotAfter, { ...state, covered: normalizeCovered(newCovered) });
    const isComplete = nextId === null;
    const nextQuestionCategory = nextId ? QUESTION_DEFINITIONS[nextId].category : null;

    const context: Record<string, string> = {};
    if (nextId === "interestsFollowup") {
      const interestKey = state.pickedInterest ?? profile?.interests[0];
      if (interestKey) context.interest = resolveOptionLabel("interests", interestKey, dict);
    }

    // Only a genuinely free-text, non-skipped answer benefits from AI
    // nuance — every structured question type is answered from a fixed,
    // already-translated option set the acknowledgement can't meaningfully
    // react to beyond restating it (see `resolveAcknowledgement`'s doc comment).
    const needsAi = def?.type === "text" && !answer.skipped && Boolean(otherText);
    const userMessageText = displayText || otherText || "…";

    const { reply, dna } = await resolveAcknowledgement({
      needsAi,
      dict,
      seed: newCovered.length,
      isComplete,
      combinedTextForDna: [profile?.personalitySummary, userMessageText].filter(Boolean).join(" "),
      aiInput: {
        locale,
        profile: snapshotAfter,
        history: history.map((m) => ({ role: m.role === "USER" ? ("user" as const) : ("assistant" as const), content: m.content })),
        latestUserMessage: userMessageText,
        justAnsweredCategory: def?.category ?? null,
        nextQuestionCategory,
        context,
      },
      timer,
    });

    const nextQuestion: QuestionSpec | null = nextId ? { id: nextId, prompt: resolveQuestionPrompt(nextId, dict, context) } : null;

    profileUpdate.interviewTopicsCovered = newCovered;
    if (dna) profileUpdate.careerDna = dna as unknown as Prisma.InputJsonValue;
    if (isComplete) profileUpdate.questionnaireCompleted = true;

    await chatRepository.appendTurnAndUpdateProfile({
      userId,
      attemptId: attempt.id,
      userContent: userMessageText,
      assistantContent: reply,
      assistantQuestionSpec: nextQuestion as unknown as Prisma.InputJsonValue | null,
      expectedVersion,
      profileUpdate,
    });
    timer.mark("write");

    if (isComplete) await interviewAttemptRepository.complete(attempt.id);

    const progress = computeProgress(snapshotAfter, { ...state, covered: normalizeCovered(newCovered) });
    timer.done();
    return { reply, nextQuestion, isComplete, progressPercent: progress.percent, step: progress.step, totalSteps: progress.total };
  },

  /**
   * "Пройти интервью заново" (item 8 of the reliability brief) — closes out
   * the current attempt (if any) as ABANDONED unless it's already COMPLETED
   * (a completed attempt's history is worth keeping as-is), starts a fresh
   * `InterviewAttempt`, and resets only the interview-progress fields on
   * `Profile` — `careerInsights`/`careerSummary`/`CareerRecommendation`/
   * `Roadmap`/`Resume` are deliberately untouched here: the OLD career
   * profile stays fully active and usable until the NEW attempt actually
   * completes (item 14), at which point the existing Career Analysis
   * generation flow naturally replaces recommendations for whatever the new
   * answers produce.
   */
  async restartInterview(userId: string) {
    const active = await interviewAttemptRepository.findActive(userId);
    if (active) await interviewAttemptRepository.abandon(active.id);

    await interviewAttemptRepository.create(userId);
    await profileRepository.upsert(userId, {
      interviewTopicsCovered: [],
      questionnaireCompleted: false,
      careerPriorities: [],
    });
  },
};
