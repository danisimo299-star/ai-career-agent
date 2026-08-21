import type { Locale } from "@/lib/i18n/config";
import { seededRandom, seededPick } from "@/lib/career/seeded-random";
import type { InterviewScoreBreakdown, InterviewTurn } from "@/lib/ai/career/types";
import { followUpTemplates } from "@/lib/career/interview-bank";

const feedbackPool: Record<Locale, { good: string[]; improve: string[] }> = {
  en: {
    good: [
      "Clear and well-structured — easy to follow your reasoning.",
      "Good use of a concrete example to back up your point.",
      "You addressed the question directly, which works well here.",
      "Confident, specific answer — that comes across well.",
    ],
    improve: [
      "Try to add a concrete example next time — it makes the answer more convincing.",
      "A bit more structure (situation → action → result) would strengthen this.",
      "Consider quantifying the outcome where possible.",
      "Could be more concise — lead with the key point first.",
    ],
  },
  ru: {
    good: [
      "Чётко и структурированно — легко следить за твоей логикой.",
      "Хорошо, что ты подкрепил(а) мысль конкретным примером.",
      "Ты ответил(а) прямо на вопрос — это здесь хорошо работает.",
      "Уверенный, конкретный ответ — это чувствуется.",
    ],
    improve: [
      "В следующий раз добавь конкретный пример — это делает ответ убедительнее.",
      "Больше структуры (ситуация → действие → результат) усилило бы ответ.",
      "Постарайся, где возможно, оцифровать результат.",
      "Можно короче — начни сразу с главной мысли.",
    ],
  },
};

const idealAnswerPool: Record<Locale, string[]> = {
  en: [
    "One strong approach: state the situation briefly, explain your specific action, and close with a measurable result.",
    "One strong approach: lead with the direct answer, then support it with one concrete example.",
    "One strong approach: acknowledge the trade-off you faced, then explain the reasoning behind your choice.",
  ],
  ru: [
    "Один из сильных вариантов: кратко описать ситуацию, объяснить конкретное действие и завершить измеримым результатом.",
    "Один из сильных вариантов: начать с прямого ответа, а затем подкрепить его конкретным примером.",
    "Один из сильных вариантов: обозначить компромисс, с которым ты столкнулся(лась), и объяснить логику своего выбора.",
  ],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export interface MockAnswerEvaluation {
  scoreBreakdown: InterviewScoreBreakdown;
  score: number;
  feedback: string;
  strengths: string;
  improvements: string;
  idealAnswerNotes: string;
  followUpQuestion: string | null;
}

/**
 * Deterministic stand-in for real answer evaluation: no NLP, but grounded in
 * observable signal (answer length, seeded per-answer variety) so repeated
 * runs against the same transcript always produce the same scores.
 */
export function scoreMockAnswer(
  answer: string,
  locale: Locale,
  askedCount: number,
  targetQuestionCount: number
): MockAnswerEvaluation {
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const random = seededRandom(answer || "empty");
  const lengthFactor = clamp((wordCount / 45) * 100, 15, 100) / 100;
  const base = 50 + lengthFactor * 35 + random() * 10;

  const jitter = () => (random() - 0.5) * 12;
  const scoreBreakdown: InterviewScoreBreakdown = {
    relevance: clamp(base + jitter(), 10, 100),
    correctness: clamp(base + jitter(), 10, 100),
    clarity: clamp(base + jitter(), 10, 100),
    confidence: clamp(base + jitter(), 10, 100),
    technicalDepth: clamp(base - 5 + jitter(), 10, 100),
    communication: clamp(base + jitter(), 10, 100),
    completeness: clamp(base - (wordCount < 15 ? 15 : 0) + jitter(), 10, 100),
  };
  const values = Object.values(scoreBreakdown);
  const score = clamp(values.reduce((sum, v) => sum + v, 0) / values.length, 0, 100);

  const pool = feedbackPool[locale];
  const isGood = score >= 65;
  const feedback = isGood ? seededPick(pool.good, `${answer}:good`) : seededPick(pool.improve, `${answer}:improve`);
  const strengths = seededPick(pool.good, `${answer}:strengths`);
  const improvements = seededPick(pool.improve, `${answer}:improvements`);
  const idealAnswerNotes = seededPick(idealAnswerPool[locale], `${answer}:ideal`);

  const eligibleForFollowUp = askedCount < targetQuestionCount && wordCount > 5;
  const followUpQuestion =
    eligibleForFollowUp && random() > 0.5 ? seededPick(followUpTemplates[locale], `${answer}:followup`) : null;

  return { scoreBreakdown, score, feedback, strengths, improvements, idealAnswerNotes, followUpQuestion };
}

export interface MockInterviewReport {
  overallScore: number;
  categoryScores: {
    technicalKnowledge: number;
    communication: number;
    answerQuality: number;
    problemSolving: number;
    confidence: number;
  };
  overallResult: string;
  strongestAreas: string[];
  areasToImprove: string[];
  nextSteps: string[];
}

const resultTemplates: Record<Locale, { high: string; mid: string; low: string }> = {
  en: {
    high: "Strong candidate — you're well-prepared, keep refining your weaker areas below.",
    mid: "Good candidate — solid foundation, with clear room to sharpen specific areas.",
    low: "Early-stage candidate — focus practice on the areas below before your next real interview.",
  },
  ru: {
    high: "Сильный кандидат — ты хорошо подготовлен(а), продолжай прорабатывать слабые места ниже.",
    mid: "Хороший кандидат — крепкая база, но есть чёткие точки роста.",
    low: "Начальный уровень — сосредоточься на практике по темам ниже перед следующим реальным собеседованием.",
  },
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function buildMockInterviewReport(
  turns: (InterviewTurn & { score: number | null })[],
  locale: Locale
): MockInterviewReport {
  const answered = turns.filter((t) => t.score !== null) as (InterviewTurn & { score: number })[];
  const overallScore = average(answered.map((t) => t.score));

  const technicalScores = answered.filter((t) => t.type === "TECHNICAL").map((t) => t.score);
  const behavioralHrScores = answered.filter((t) => t.type === "BEHAVIORAL" || t.type === "HR").map((t) => t.score);

  const categoryScores = {
    technicalKnowledge: technicalScores.length > 0 ? average(technicalScores) : overallScore,
    communication: behavioralHrScores.length > 0 ? average(behavioralHrScores) : overallScore,
    answerQuality: overallScore,
    problemSolving: average([...technicalScores, ...behavioralHrScores]) || overallScore,
    confidence: clamp(overallScore + (seededRandom(`confidence:${overallScore}`)() - 0.5) * 10, 0, 100),
  };

  const bucket = overallScore >= 75 ? "high" : overallScore >= 55 ? "mid" : "low";
  const overallResult = resultTemplates[locale][bucket];

  // Rank by each label's *average* score, not individual questions — a
  // skill asked more than once can have both a high- and a low-scoring
  // answer, and ranking per-question would let the same label land in
  // both "strongest" and "needs improvement" simultaneously.
  const scoresByLabel = new Map<string, number[]>();
  for (const t of answered) {
    const label = t.skill ?? t.type;
    const list = scoresByLabel.get(label) ?? [];
    list.push(t.score);
    scoresByLabel.set(label, list);
  }
  const labelAverages = Array.from(scoresByLabel.entries())
    .map(([label, scores]) => ({ label, avg: average(scores) }))
    .sort((a, b) => b.avg - a.avg);

  const strongestAreas = labelAverages.slice(0, 3).map((l) => l.label);
  const strongestSet = new Set(strongestAreas);
  const areasToImprove = [...labelAverages]
    .reverse()
    .filter((l) => !strongestSet.has(l.label))
    .slice(0, 3)
    .map((l) => l.label);

  const nextStepsPool: Record<Locale, string[]> = {
    en: [
      "Practice structuring behavioral answers with the STAR method (Situation, Task, Action, Result).",
      "Redo a technical interview focused on your weaker skill areas above.",
      "Practice giving more concise, direct answers before adding supporting detail.",
      "Review the ideal-answer notes from this session and rehearse those specific answers out loud.",
    ],
    ru: [
      "Потренируйся структурировать поведенческие ответы по методу STAR (Ситуация, Задача, Действие, Результат).",
      "Повтори техническое собеседование с фокусом на слабые области выше.",
      "Потренируйся давать более краткие, прямые ответы, прежде чем добавлять детали.",
      "Просмотри заметки об идеальном ответе из этой сессии и проговори эти ответы вслух.",
    ],
  };
  const nextSteps = nextStepsPool[locale].slice(0, 3);

  return { overallScore, categoryScores, overallResult, strongestAreas, areasToImprove, nextSteps };
}
