export type ScenarioLabel = "strongestFit" | "strongestLongTerm" | "easiestTransition";

export interface CareerScenarioInput {
  title: string;
  /** How well the user's current profile/interests fit this profession — reuses the same scoring `generateCareerRecommendations` already produces. */
  fitPercent: number;
  skillGapPercent: number;
  /** Count of real search results for this role (mock demo listings or real HH.ru results, whichever provider is active) — never fabricated. */
  jobCount: number;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  growthPotential: "LOW" | "MEDIUM" | "HIGH";
}

export interface CareerScenarioResult extends CareerScenarioInput {
  label: ScenarioLabel | null;
}

const GROWTH_RANK: Record<CareerScenarioInput["growthPotential"], number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

/**
 * The AI never forces one "correct" profession — this module only ranks
 * and labels candidates the caller already scored deterministically
 * elsewhere (Career Analysis' fit score, this module's own skill-gap
 * input, a real job-search count). Labels are assigned by simple,
 * explainable rules, not a hidden weighted formula: highest fit wins
 * "strongest current fit"; among the rest, lowest skill gap wins "easiest
 * transition"; among what's left, highest growth potential wins
 * "strongest long-term fit" (only if it's actually higher than the
 * others — ties get no label rather than a coin-flip).
 */
export function compareCareerScenarios(candidates: CareerScenarioInput[]): CareerScenarioResult[] {
  const results: CareerScenarioResult[] = candidates.map((c) => ({ ...c, label: null }));
  if (results.length === 0) return results;

  const byFitDesc = [...results].sort((a, b) => b.fitPercent - a.fitPercent);
  const strongestFit = byFitDesc[0];
  strongestFit.label = "strongestFit";

  const remaining1 = results.filter((r) => r !== strongestFit);
  if (remaining1.length > 0) {
    const byGapAsc = [...remaining1].sort((a, b) => a.skillGapPercent - b.skillGapPercent);
    const easiestTransition = byGapAsc[0];
    easiestTransition.label = "easiestTransition";

    const remaining2 = remaining1.filter((r) => r !== easiestTransition);
    if (remaining2.length > 0) {
      const byGrowthDesc = [...remaining2].sort((a, b) => GROWTH_RANK[b.growthPotential] - GROWTH_RANK[a.growthPotential]);
      const top = byGrowthDesc[0];
      const isUnique = byGrowthDesc.length === 1 || GROWTH_RANK[top.growthPotential] > GROWTH_RANK[byGrowthDesc[1].growthPotential];
      if (isUnique) top.label = "strongestLongTerm";
    }
  }

  return results.sort((a, b) => b.fitPercent - a.fitPercent);
}
