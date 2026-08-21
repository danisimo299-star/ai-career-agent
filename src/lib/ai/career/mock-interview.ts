import { seededPick } from "@/lib/career/seeded-random";
import {
  generalQuestions,
  behavioralQuestions,
  hrQuestions,
  getTechnicalQuestions,
  resumeBasedQuestionTemplates,
} from "@/lib/career/interview-bank";
import { scoreMockAnswer, buildMockInterviewReport as buildReport } from "@/lib/career/interview-scoring";
import { findProfessionByTitle } from "./mock-data";
import type {
  InterviewQuestionContext,
  InterviewQuestionResult,
  InterviewAnswerContext,
  InterviewAnswerEvaluationResult,
  InterviewReportContext,
  InterviewReportResult,
  InterviewType,
} from "./types";

const rotationOrder: Exclude<InterviewType, "MIXED">[] = ["TECHNICAL", "BEHAVIORAL", "GENERAL", "HR"];
const rotationOrderWithResume: Exclude<InterviewType, "MIXED">[] = ["TECHNICAL", "RESUME_BASED", "BEHAVIORAL", "GENERAL", "HR"];

function resolveType(input: InterviewQuestionContext): Exclude<InterviewType, "MIXED"> {
  const hasHighlights = input.resumeHighlights.length > 0;
  if (input.interviewType === "RESUME_BASED") return hasHighlights ? "RESUME_BASED" : "GENERAL";
  if (input.interviewType !== "MIXED") return input.interviewType;

  const askedCount = input.history.filter((t) => !t.isFollowUp).length;
  const order = hasHighlights ? rotationOrderWithResume : rotationOrder;
  return order[askedCount % order.length];
}

function pickSkill(input: InterviewQuestionContext): string {
  const askedCount = input.history.filter((t) => !t.isFollowUp).length;
  const profession = findProfessionByTitle(input.targetRole, input.locale);
  const pool =
    input.roadmapSkills.length > 0
      ? input.roadmapSkills
      : input.profile.skills.length > 0
        ? input.profile.skills
        : (profession?.skills[input.locale] ?? []);
  // A brand-new profile has no listed skills and no roadmap yet — falling
  // back to the target role itself (rather than a real skill from the
  // profession catalog) would make every technical question generic and,
  // worse, collapse the final report's strongest/weakest-area labels into
  // the same string. `professionCatalog` already has real skills per role.
  if (pool.length > 0) return pool[askedCount % pool.length];
  return input.targetRole;
}

function pickUnasked(pool: string[], askedQuestions: Set<string>, seed: string): string {
  const unused = pool.filter((q) => !askedQuestions.has(q));
  return seededPick(unused.length > 0 ? unused : pool, seed);
}

export function buildMockInterviewQuestion(input: InterviewQuestionContext): InterviewQuestionResult {
  const type = resolveType(input);
  const askedQuestions = new Set(input.history.map((t) => t.question));
  const seed = `${input.targetRole}:${input.history.length}`;

  if (type === "TECHNICAL") {
    const skill = pickSkill(input);
    const pool = getTechnicalQuestions(skill, input.locale);
    return { question: pickUnasked(pool, askedQuestions, seed), type, skill };
  }

  if (type === "RESUME_BASED") {
    const askedHighlights = new Set(input.history.filter((t) => t.type === "RESUME_BASED").map((t) => t.question));
    const unusedHighlights = input.resumeHighlights.filter((h) => !askedHighlights.has(h));
    const highlight = seededPick(unusedHighlights.length > 0 ? unusedHighlights : input.resumeHighlights, seed);
    const template = seededPick(resumeBasedQuestionTemplates[input.locale], seed);
    return { question: template.replace("{highlight}", highlight), type, skill: null };
  }

  const pool = type === "BEHAVIORAL" ? behavioralQuestions : type === "HR" ? hrQuestions : generalQuestions;
  return { question: pickUnasked(pool[input.locale], askedQuestions, seed), type, skill: null };
}

export function evaluateMockInterviewAnswer(input: InterviewAnswerContext): InterviewAnswerEvaluationResult {
  const askedBefore = input.history.filter((t) => !t.isFollowUp).length;
  const askedCount = askedBefore + (input.currentQuestion.isFollowUp ? 0 : 1);
  const result = scoreMockAnswer(input.answer, input.locale, askedCount, input.targetQuestionCount);
  return result;
}

export function generateMockInterviewReport(input: InterviewReportContext): InterviewReportResult {
  return buildReport(input.turns, input.locale);
}
