import { seededRandom } from "@/lib/career/seeded-random";
import type { CareerDnaScores } from "./types";

const traitKeys: (keyof CareerDnaScores)[] = [
  "leadership",
  "communication",
  "analyticalThinking",
  "creativity",
  "responsibility",
  "problemSolving",
  "learningSpeed",
];

/**
 * Deterministically derives plausible-looking Career DNA percentages from
 * the user's accumulated free-text answers, without any real NLP — same
 * transcript always produces the same numbers, different users land on
 * different (and gradually shifting, as they say more) profiles.
 */
export function estimateCareerDna(answerText: string): CareerDnaScores {
  const random = seededRandom(answerText);

  const scores = {} as CareerDnaScores;
  for (const key of traitKeys) {
    scores[key] = Math.round(45 + random() * 50); // 45-95, reads as plausible rather than random
  }
  return scores;
}
