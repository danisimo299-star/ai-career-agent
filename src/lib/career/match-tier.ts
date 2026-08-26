export type MatchTier = "strong" | "good" | "possible";

/** Same thresholds a "match %" badge would read as strong/good/possible anywhere else in the app — kept in one place so the dashboard's tier labels never drift from the Career Analysis page's own framing. */
export function matchTierOf(matchScore: number): MatchTier {
  if (matchScore >= 80) return "strong";
  if (matchScore >= 60) return "good";
  return "possible";
}
