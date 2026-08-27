import type { Locale } from "@/lib/i18n/config";
import type { ExperienceLevel } from "@prisma/client";
import { profileRepository } from "@/server/repositories/profile.repository";
import { careerRepository } from "@/server/repositories/career.repository";
import { interviewAttemptRepository } from "@/server/repositories/interview-attempt.repository";
import { toProfileSnapshot } from "@/lib/ai/career/profile-snapshot";
import { getAICareerService } from "@/lib/ai/career/get-career-service";
import { missionsService } from "@/server/services/missions.service";
import { careerScoreService } from "@/server/services/career-score.service";
import { validateCareerMarketBatch, type MarketValidation } from "@/server/services/career-market.service";
import type { CareerRecommendationResult, ProfileSnapshot } from "@/lib/ai/career/types";
import type { JobExperienceLevel } from "@/lib/jobs/types";
import { env } from "@/lib/env";
import { createTimer } from "@/lib/dev-timing";

/** No dedicated "years of experience" field exists on `Profile` — derived from what's actually there, biased toward the honest default (`noExperience`) for young/unspecified profiles rather than assuming expertise nobody confirmed. */
function deriveJobExperience(profile: { age: number | null; experienceLevel: ExperienceLevel | null }): JobExperienceLevel | undefined {
  switch (profile.experienceLevel) {
    case "STUDENT":
    case "GRADUATE":
      return "noExperience";
    case "JUNIOR":
    case "CAREER_CHANGER":
      return "between1And3";
    case "MID":
      return "between3And6";
    case "SENIOR":
      return "moreThan6";
    default:
      return profile.age !== null && profile.age <= 21 ? "noExperience" : undefined;
  }
}

const MIN_ACCEPTED_RECOMMENDATIONS = 3;
/**
 * Bounded, but realistic for what a single call actually asks for (5 full
 * recommendations + insights + summary, ~1000-1500 output tokens). Live
 * `ollama ps`/API timing against this deployment's actual local model
 * measured ~30 tokens/sec generation (a 4B model, no GPU) — that alone is
 * ~40-50s of real compute for this response size, independent of anything
 * this app does; 25s and 45s were both firing on ordinary successful runs,
 * not genuine hangs. This still protects against a truly stuck/crashed
 * Ollama process, it just doesn't fight the local model's real throughput.
 * On a faster host or a hosted provider (OpenAI/Anthropic), the exact same
 * pipeline finishes in a few seconds — see the final report's timing
 * breakdown. The persisted `PROCESSING` status + client-side polling (see
 * `career-analysis-view.tsx`) is what actually keeps this from feeling like
 * a hang either way — the user sees a real loading state throughout and the
 * result appears on its own, never requiring a manual refresh.
 */
const AI_CALL_TIMEOUT_MS = 90_000;

type ValidatedCandidate = CareerRecommendationResult & Omit<MarketValidation, "accepted">;

async function generateAndValidate(
  locale: Locale,
  snapshot: ProfileSnapshot,
  city: string | null,
  experience: JobExperienceLevel | undefined,
  timer: ReturnType<typeof createTimer>,
  /** Titles to steer away from from the very first attempt — used by "Показать ещё варианты" so it never repeats what's already on screen (not just what got rejected mid-loop). */
  seedExcludeTitles: string[] = [],
  targetCount = 5
): Promise<{ recommendations: ValidatedCandidate[]; summary: string; insights: string[] }> {
  const service = getAICareerService();
  const accepted: ValidatedCandidate[] = [];
  const rejectedTitles: string[] = [...seedExcludeTitles];
  let summary = "";
  let insights: string[] = [];

  // Bounded: the initial AI call, plus at most one retry asking for
  // different directions if too few candidates survive HH validation — never
  // an unbounded loop (item 44 of the market-reality brief: this is a real
  // validation pipeline with a hard stop, not the model endlessly guessing
  // until something sticks).
  for (let attempt = 0; attempt < 2 && accepted.length < Math.min(MIN_ACCEPTED_RECOMMENDATIONS, targetCount); attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_CALL_TIMEOUT_MS);
    let analysis;
    try {
      analysis = await service.generateCareerAnalysis({
        locale,
        profile: snapshot,
        excludeTitles: rejectedTitles.length > 0 ? rejectedTitles : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    timer.mark(`ai (attempt ${attempt + 1})`);
    summary = analysis.summary;
    insights = analysis.insights;

    const stillNeeded = analysis.recommendations.filter(
      (c) => !accepted.some((a) => a.title === c.title) && !seedExcludeTitles.includes(c.title)
    );
    const validations = await validateCareerMarketBatch(stillNeeded, city, experience);
    timer.mark(`hh-validation (attempt ${attempt + 1})`);

    for (let i = 0; i < stillNeeded.length; i++) {
      const { accepted: isAccepted, ...market } = validations[i];
      if (isAccepted) accepted.push({ ...stillNeeded[i], ...market });
      else rejectedTitles.push(stillNeeded[i].title);
    }
  }

  return { recommendations: accepted.slice(0, targetCount), summary, insights };
}

/**
 * Ranks validated candidates: a confirmed 0-vacancy-in-city result (and the
 * user hasn't said they're open to remote/relocating) is never ranked above
 * a candidate with real local demand — see item 9 of the market-reality
 * brief. AI `matchScore` still breaks ties among equally-realistic options.
 */
function rankCandidates(candidates: ValidatedCandidate[], openToRemote: boolean): ValidatedCandidate[] {
  const tier = (c: ValidatedCandidate): number => {
    if (c.vacancyCountCity === null) return openToRemote ? 1 : 2; // unknown/no-city-filter — treat as mid-tier, not penalized like a confirmed zero
    if (c.vacancyCountCity === 0 && !openToRemote) return 3;
    if (c.vacancyCountCity < env.MIN_CITY_VACANCIES_FOR_PRIMARY_CAREER) return 1;
    return 0;
  };
  return [...candidates].sort((a, b) => tier(a) - tier(b) || b.matchScore - a.matchScore);
}

export const careerAnalysisService = {
  async analyze(userId: string, locale: Locale) {
    const timer = createTimer("careerAnalysis.analyze");
    // Persisted status (item 29 of the performance brief) — a page refresh
    // mid-generation reads this instead of getting nothing, and never needs
    // to depend on the original fetch ever reaching the tab that started it.
    await profileRepository.upsert(userId, { careerAnalysisStatus: "PROCESSING", careerAnalysisStartedAt: new Date(), careerAnalysisError: null });

    try {
      const profile = await profileRepository.findByUserId(userId);
      const snapshot = toProfileSnapshot(profile);
      const city = profile?.city ?? null;
      const experience = deriveJobExperience({ age: profile?.age ?? null, experienceLevel: profile?.experienceLevel ?? null });
      const openToRemote = profile?.preferredFormat === "REMOTE" || profile?.preferredFormat === "ANY";
      timer.mark("read");

      const { recommendations: validated, summary, insights } = await generateAndValidate(locale, snapshot, city, experience, timer);
      const recommendations = rankCandidates(validated, openToRemote);

      await Promise.all([
        careerRepository.replaceForUser(userId, recommendations),
        profileRepository.upsert(userId, {
          careerInsights: insights,
          careerSummary: summary,
          careerAnalysisStatus: "COMPLETED",
        }),
      ]);
      timer.mark("save");

      await Promise.all([missionsService.sync(userId), careerScoreService.getSnapshot(userId)]);
      timer.mark("missions+score");

      // Denormalized snapshot for the simple "previous results" history list
      // (item 18) — set once, on whichever attempt most recently completed.
      if (recommendations[0]) {
        const lastCompleted = await interviewAttemptRepository.findMostRecentCompleted(userId);
        if (lastCompleted && !lastCompleted.topCareerTitle) {
          await interviewAttemptRepository.setTopCareerTitle(lastCompleted.id, recommendations[0].title);
        }
      }

      timer.done();
      return { recommendations, insights, summary };
    } catch (error) {
      await profileRepository
        .upsert(userId, { careerAnalysisStatus: "FAILED", careerAnalysisError: error instanceof Error ? error.message.slice(0, 500) : "unknown error" })
        .catch(() => {});
      throw error;
    }
  },

  /**
   * "Показать ещё варианты" — unlike `analyze()` (full Regenerate, replaces
   * everything), this ADDS a few more validated professions alongside
   * whatever's already shown, steering the AI away from the existing titles
   * so it doesn't just repeat them. Same market validation, same honest
   * rejection of anything that doesn't resolve to a real HH category.
   */
  async findMore(userId: string, locale: Locale) {
    const timer = createTimer("careerAnalysis.findMore");
    await profileRepository.upsert(userId, { careerAnalysisStatus: "PROCESSING", careerAnalysisStartedAt: new Date(), careerAnalysisError: null });

    try {
      const [profile, existing] = await Promise.all([profileRepository.findByUserId(userId), careerRepository.listByUser(userId)]);
      const snapshot = toProfileSnapshot(profile);
      const city = profile?.city ?? null;
      const experience = deriveJobExperience({ age: profile?.age ?? null, experienceLevel: profile?.experienceLevel ?? null });
      const openToRemote = profile?.preferredFormat === "REMOTE" || profile?.preferredFormat === "ANY";
      const existingTitles = existing.map((r) => r.title);
      timer.mark("read");

      const { recommendations: validated } = await generateAndValidate(locale, snapshot, city, experience, timer, existingTitles, 3);
      const newRecommendations = rankCandidates(validated, openToRemote);

      await Promise.all([
        newRecommendations.length > 0 ? careerRepository.appendForUser(userId, newRecommendations) : Promise.resolve(),
        profileRepository.upsert(userId, { careerAnalysisStatus: "COMPLETED" }),
      ]);
      timer.mark("save");
      timer.done();

      return { newRecommendations, allRecommendations: await careerRepository.listByUser(userId) };
    } catch (error) {
      await profileRepository
        .upsert(userId, { careerAnalysisStatus: "FAILED", careerAnalysisError: error instanceof Error ? error.message.slice(0, 500) : "unknown error" })
        .catch(() => {});
      throw error;
    }
  },

  async getExisting(userId: string) {
    const [recommendations, profile] = await Promise.all([
      careerRepository.listByUser(userId),
      profileRepository.findByUserId(userId),
    ]);

    return {
      recommendations,
      insights: profile?.careerInsights ?? [],
      summary: profile?.careerSummary ?? null,
      status: profile?.careerAnalysisStatus ?? "IDLE",
      error: profile?.careerAnalysisError ?? null,
    };
  },
};
