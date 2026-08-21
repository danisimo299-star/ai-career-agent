export type SavedJobStatusLike = "SAVED" | "PREPARING" | "APPLIED" | "INTERVIEW" | "REJECTED" | "OFFER";

export interface ApplicationAnalyticsResult {
  applications: number;
  interviews: number;
  offers: number;
  /** null (not 0) when there isn't enough data — 0% would misleadingly read as "you got zero responses" rather than "not enough data yet." */
  responseRate: number | null;
  interviewRate: number | null;
  offerRate: number | null;
  hasEnoughData: boolean;
  /** True only when there's enough of a sample AND the interview rate is meaningfully low — the caller uses this to decide whether to show a cautious "interview prep may be the weaker stage" note, never a strong statistical claim from a handful of data points. */
  lowInterviewConversion: boolean;
}

const MIN_APPLICATIONS_FOR_RATES = 5;
const LOW_INTERVIEW_RATE_THRESHOLD = 15;

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Counts every status past "just saved" as an application (APPLIED/
 * INTERVIEW/REJECTED/OFFER all imply the user actually applied), and
 * INTERVIEW/OFFER as having reached an interview stage — all from real
 * `SavedJob.status` values the user set themselves, nothing inferred from
 * an external ATS this product doesn't integrate with.
 */
export function computeApplicationAnalytics(statuses: SavedJobStatusLike[]): ApplicationAnalyticsResult {
  const applications = statuses.filter((s) => s !== "SAVED" && s !== "PREPARING").length;
  const interviews = statuses.filter((s) => s === "INTERVIEW" || s === "OFFER").length;
  const offers = statuses.filter((s) => s === "OFFER").length;

  const hasEnoughData = applications >= MIN_APPLICATIONS_FOR_RATES;

  const responseRate = hasEnoughData ? clamp((interviews / applications) * 100) : null;
  const interviewRate = hasEnoughData ? clamp((interviews / applications) * 100) : null;
  const offerRate = hasEnoughData ? clamp((offers / applications) * 100) : null;

  return {
    applications,
    interviews,
    offers,
    responseRate,
    interviewRate,
    offerRate,
    hasEnoughData,
    lowInterviewConversion: hasEnoughData && (interviewRate ?? 0) < LOW_INTERVIEW_RATE_THRESHOLD,
  };
}
