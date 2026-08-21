import type { Prisma, WorkFormat } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { chatRepository } from "@/server/repositories/chat.repository";
import { profileRepository } from "@/server/repositories/profile.repository";
import { toProfileSnapshot } from "@/lib/ai/career/profile-snapshot";
import { getAICareerService } from "@/lib/ai/career/get-career-service";
import {
  pickNextQuestionId,
  estimateQuestionnaireLength,
  QUESTION_DEFINITIONS,
  type QuestionId,
  type QuestionnaireState,
} from "@/lib/ai/career/questionnaire";
import { resolveQuestionPrompt, resolveOptionLabel } from "@/lib/ai/career/questionnaire-copy";
import type { QuestionSpec } from "@/lib/ai/career/types";

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

function computeProgressPercent(snapshot: ReturnType<typeof toProfileSnapshot>, state: QuestionnaireState): number {
  const total = estimateQuestionnaireLength(snapshot, state);
  if (total <= 0) return 100;
  return Math.min(100, Math.round((state.covered.length / total) * 100));
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

export const chatService = {
  async getConversation(userId: string, locale: Locale) {
    const existing = await chatRepository.listByUser(userId);
    if (existing.length > 0) return existing;

    const { dict, firstQuestion } = await buildFirstQuestion(userId, locale);
    await chatRepository.append(userId, "ASSISTANT", dict.questionnaire.intro, firstQuestion as unknown as Prisma.InputJsonValue | null);
    return chatRepository.listByUser(userId);
  },

  async getProgress(userId: string) {
    const profile = await profileRepository.findByUserId(userId);
    const snapshot = toProfileSnapshot(profile);
    const state = deriveState(profile?.interviewTopicsCovered ?? []);
    state.prioritizedSalary = (profile?.careerPriorities ?? []).includes("salary");
    return { percent: computeProgressPercent(snapshot, state), isComplete: profile?.questionnaireCompleted ?? false };
  },

  async sendMessage(userId: string, locale: Locale, answer: QuestionnaireAnswerInput) {
    const dict = getDictionary(locale);
    const [history, profile] = await Promise.all([chatRepository.listByUser(userId), profileRepository.findByUserId(userId)]);

    const coveredRaw = profile?.interviewTopicsCovered ?? [];
    const state = deriveState(coveredRaw);
    state.prioritizedSalary = (profile?.careerPriorities ?? []).includes("salary");

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

    await chatRepository.append(userId, "USER", displayText || otherText || "…");

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

    const analysis = await getAICareerService().analyzeUser({
      locale,
      profile: snapshotAfter,
      history: history.map((m) => ({ role: m.role === "USER" ? ("user" as const) : ("assistant" as const), content: m.content })),
      latestUserMessage: displayText || otherText,
      justAnsweredCategory: def?.category ?? null,
      nextQuestionCategory,
      context,
    });

    const nextQuestion: QuestionSpec | null = nextId ? { id: nextId, prompt: resolveQuestionPrompt(nextId, dict, context) } : null;
    await chatRepository.append(userId, "ASSISTANT", analysis.reply, nextQuestion as unknown as Prisma.InputJsonValue | null);

    profileUpdate.interviewTopicsCovered = newCovered;
    if (analysis.dna) profileUpdate.careerDna = analysis.dna as unknown as Prisma.InputJsonValue;
    if (isComplete) profileUpdate.questionnaireCompleted = true;
    await profileRepository.upsert(userId, profileUpdate);

    const percent = computeProgressPercent(snapshotAfter, { ...state, covered: normalizeCovered(newCovered) });
    return { reply: analysis.reply, nextQuestion, isComplete, progressPercent: percent };
  },
};
