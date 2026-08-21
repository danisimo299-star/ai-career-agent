import type { Locale } from "@/lib/i18n/config";
import type { Prisma } from "@prisma/client";
import { profileRepository } from "@/server/repositories/profile.repository";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import { resumeRepository } from "@/server/repositories/resume.repository";
import { interviewRepository } from "@/server/repositories/interview.repository";
import { jobRepository } from "@/server/repositories/job.repository";
import { savedJobRepository } from "@/server/repositories/saved-job.repository";
import { careerRepository } from "@/server/repositories/career.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { coachRepository, coachMemoryRepository } from "@/server/repositories/coach.repository";
import { careerMissionService } from "@/server/services/career-mission.service";
import { jobsService } from "@/server/services/jobs.service";
import { getAICareerService } from "@/lib/ai/career/get-career-service";
import { toProfileSnapshot } from "@/lib/ai/career/profile-snapshot";
import { computeResumeScore } from "@/lib/career/resume-score";
import { computeTargetSkillGap, computeMarketSkillGap, findCatalogSkillsForRole, type SkillGapResult } from "@/lib/career/skill-gap";
import { computeCareerReadiness, computeApplicationProgressScore, type ReadinessBreakdown, type ReadinessResult } from "@/lib/career/readiness";
import { computeApplicationAnalytics, type ApplicationAnalyticsResult } from "@/lib/career/application-analytics";
import { computeCareerPlan, type CareerPlanResult } from "@/lib/career/career-plan";
import { compareCareerScenarios, type CareerScenarioResult } from "@/lib/career/career-scenarios";
import { professionCatalog } from "@/lib/ai/career/mock-data";
import { stripCoachDisplayMarkers } from "@/lib/ai/career/mock-coach";
import { findTopMissingSkillAcrossSavedJobs } from "@/lib/career/coach-insights";
import { isResumeContentMeaningful, type ResumeContent } from "@/types";
import type { CoachIntent, CoachContextSnapshot } from "@/lib/ai/career/types";

export interface CoachActionSuggestion {
  labelKey: string;
  href: string;
  count?: number;
}

function buildIntentActions(intent: CoachIntent, snapshot: CoachContextSnapshot): CoachActionSuggestion[] {
  switch (intent) {
    case "jobs":
      return [{ labelKey: snapshot.matchingJobsCount > 0 ? "viewMatchingJobs" : "openJobs", href: "/dashboard/jobs", count: snapshot.matchingJobsCount || undefined }];
    case "resume":
      return [{ labelKey: "openResume", href: "/dashboard/resume" }];
    case "interview":
      return [{ labelKey: "startInterview", href: "/dashboard/interview" }];
    case "skillGap":
      return [{ labelKey: "viewSkillGap", href: "/dashboard/coach?tab=skillGap" }];
    case "roadmap":
      return [{ labelKey: "openRoadmap", href: "/dashboard/roadmap" }];
    case "compareCareers":
      return [{ labelKey: "compareCareers", href: "/dashboard/coach?tab=compare" }];
    case "nextAction":
      return [{ labelKey: "viewNextAction", href: "/dashboard/coach?tab=overview" }];
    case "applications":
      return [{ labelKey: "openJobs", href: "/dashboard/jobs" }];
    case "general":
    default:
      return [];
  }
}

async function loadRawData(userId: string, locale: Locale) {
  const [user, profile, roadmap, recommendations, resumes, interviewSessions, jobRecs, savedJobs, todayMissions, memoryFacts] = await Promise.all([
    userRepository.findById(userId),
    profileRepository.findByUserId(userId),
    roadmapRepository.findByUser(userId),
    careerRepository.listByUser(userId),
    resumeRepository.listByUser(userId),
    interviewRepository.listByUser(userId),
    jobRepository.listByUser(userId),
    savedJobRepository.listByUser(userId),
    careerMissionService.getToday(userId, locale).catch(() => null),
    coachMemoryRepository.recentByUser(userId, 5),
  ]);

  const targetRole = roadmap?.careerTitle ?? recommendations[0]?.title ?? null;

  const latestResumeContent = resumes[0] ? (resumes[0].content as unknown as ResumeContent) : null;
  const hasMeaningfulResume = Boolean(latestResumeContent && isResumeContentMeaningful(latestResumeContent));
  const resumeScore = hasMeaningfulResume
    ? computeResumeScore(latestResumeContent as ResumeContent, resumes[0]?.title || targetRole || "", locale).score
    : null;

  const completedInterviews = interviewSessions.filter((s) => s.status === "COMPLETED" && s.report);
  const interviewScores = completedInterviews.map((s) => (s.report as unknown as { overallScore: number }).overallScore);
  const interviewAverageScore = interviewScores.length > 0 ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length) : null;

  const userSkills = [...(profile?.skills ?? []), ...(latestResumeContent?.skills ?? [])];
  const targetSkillGap = targetRole ? computeTargetSkillGap(userSkills, targetRole, locale) : null;

  const applicationAnalytics = computeApplicationAnalytics(savedJobs.map((j) => j.status));

  const primaryMission = todayMissions?.missions.find((m) => m.status === "AVAILABLE" || m.status === "IN_PROGRESS") ?? null;
  const secondaryMissions = todayMissions?.missions.filter((m) => m.id !== primaryMission?.id && (m.status === "AVAILABLE" || m.status === "IN_PROGRESS")) ?? [];

  const jobMatchScores = jobRecs.map((j) => j.matchScore).filter((s): s is number => s !== null);
  const jobMatchAverage = jobMatchScores.length > 0 ? Math.round(jobMatchScores.reduce((a, b) => a + b, 0) / jobMatchScores.length) : null;

  return {
    user,
    profile,
    roadmap,
    recommendations,
    resumes,
    interviewSessions,
    jobRecs,
    savedJobs,
    memoryFacts,
    targetRole,
    userSkills,
    resumeScore,
    interviewAverageScore,
    targetSkillGap,
    applicationAnalytics,
    primaryMission,
    secondaryMissions,
    jobMatchAverage,
  };
}

function toContextSnapshot(data: Awaited<ReturnType<typeof loadRawData>>): CoachContextSnapshot {
  return {
    name: data.user?.name ?? null,
    age: data.profile?.age ?? null,
    targetRole: data.targetRole,
    city: data.profile?.city ?? null,
    experienceLevel: data.profile?.experienceLevel ?? null,
    educationStage: data.profile?.educationStage ?? null,
    salaryExpectation: data.profile?.salaryExpectation ?? null,
    careerReadiness: computeReadinessFromRawData(data).overall,
    skillGapPercent: data.targetSkillGap?.gapPercent ?? null,
    topMissingSkills: data.targetSkillGap ? data.targetSkillGap.missing.slice(0, 5).map((m) => m.skill) : [],
    matchedSkills: data.targetSkillGap ? data.targetSkillGap.matched.slice(0, 5) : [],
    resumeScore: data.resumeScore,
    interviewAverageScore: data.interviewAverageScore,
    applications: data.applicationAnalytics.applications,
    interviews: data.applicationAnalytics.interviews,
    offers: data.applicationAnalytics.offers,
    savedJobsCount: data.savedJobs.length,
    matchingJobsCount: data.jobRecs.length,
    nextActionTitle: data.primaryMission?.title ?? null,
    careerPreferences: data.memoryFacts.map((f) => f.fact),
    careerPriorities: data.profile?.careerPriorities ?? [],
    proactiveInsight: findTopMissingSkillAcrossSavedJobs(data.savedJobs, data.userSkills),
  };
}

function computeReadinessFromRawData(data: Awaited<ReturnType<typeof loadRawData>>): ReadinessResult {
  const matchingRecommendation = data.recommendations.find((r) => r.title === data.targetRole);

  const breakdown: ReadinessBreakdown = {
    careerFit: matchingRecommendation?.matchScore ?? null,
    skillReadiness: data.targetSkillGap ? 100 - data.targetSkillGap.gapPercent : null,
    resumeQuality: data.resumeScore,
    interviewReadiness: data.interviewAverageScore,
    jobMatch: data.jobMatchAverage,
    applicationProgress: computeApplicationProgressScore(data.applicationAnalytics),
  };

  return computeCareerReadiness(breakdown);
}

export const coachService = {
  async getContext(userId: string, locale: Locale): Promise<CoachContextSnapshot> {
    const data = await loadRawData(userId, locale);
    return toContextSnapshot(data);
  },

  async getReadiness(userId: string, locale: Locale): Promise<ReadinessResult> {
    const data = await loadRawData(userId, locale);
    return computeReadinessFromRawData(data);
  },

  async getApplicationAnalytics(userId: string): Promise<ApplicationAnalyticsResult> {
    const savedJobs = await savedJobRepository.listByUser(userId);
    return computeApplicationAnalytics(savedJobs.map((j) => j.status));
  },

  async getCareerPlan(userId: string): Promise<CareerPlanResult | null> {
    const roadmap = await roadmapRepository.findByUser(userId);
    if (!roadmap) return null;
    return computeCareerPlan(roadmap.milestones.map((m) => ({ title: m.title, estimatedWeeks: m.estimatedWeeks, status: m.status })));
  },

  async getSkillGap(userId: string, locale: Locale, targetRoleOverride?: string, city?: string) {
    const data = await loadRawData(userId, locale);
    const targetRole = targetRoleOverride || data.targetRole;
    if (!targetRole) return null;

    const targetGap = computeTargetSkillGap(data.userSkills, targetRole, locale);

    const searchResult = await jobsService.search(userId, { targetRole, city, sort: "bestMatch" });
    const vacancyRequiredSkills = searchResult.results.map((r) => r.vacancy.requiredSkills);
    const marketGap = computeMarketSkillGap(data.userSkills, vacancyRequiredSkills);

    return { targetRole, targetGap, marketGap };
  },

  async getNextActions(userId: string, locale: Locale): Promise<string[]> {
    const data = await loadRawData(userId, locale);
    if (data.primaryMission) {
      return [data.primaryMission.title, ...data.secondaryMissions.slice(0, 3).map((m) => m.title)];
    }

    const fallback: string[] = [];
    if (data.targetSkillGap && data.targetSkillGap.missing.length > 0) fallback.push(data.targetSkillGap.missing[0].skill);
    if (!data.resumeScore) fallback.push("resume");
    if (data.interviewAverageScore === null) fallback.push("interview");
    if (data.applicationAnalytics.applications < 3) fallback.push("applications");
    return fallback;
  },

  async compareScenarios(userId: string, locale: Locale, roleTitles: string[]): Promise<CareerScenarioResult[]> {
    const data = await loadRawData(userId, locale);
    const interests = data.profile?.interests ?? [];

    const inputs = await Promise.all(
      roleTitles.slice(0, 4).map(async (title) => {
        const catalogEntry = professionCatalog.find((p) => p.title[locale].toLowerCase() === title.trim().toLowerCase() || p.title.en.toLowerCase() === title.trim().toLowerCase() || p.title.ru.toLowerCase() === title.trim().toLowerCase());
        const matchingRecommendation = data.recommendations.find((r) => r.title.toLowerCase() === title.trim().toLowerCase());

        const overlap = catalogEntry ? catalogEntry.interestTags.filter((t) => interests.includes(t)).length : 0;
        const fitPercent = matchingRecommendation?.matchScore ?? (catalogEntry ? Math.min(97, overlap > 0 ? 60 + Math.round((overlap / catalogEntry.interestTags.length) * 35) : 45) : 45);

        const catalogSkills = findCatalogSkillsForRole(title, locale) ?? catalogEntry?.skillKeys ?? [];
        const gap: SkillGapResult | null = catalogSkills.length > 0 ? computeTargetSkillGap(data.userSkills, title, locale) : null;

        const searchResult = await jobsService.search(userId, { targetRole: title, sort: "bestMatch" });

        return {
          title,
          fitPercent,
          skillGapPercent: gap?.gapPercent ?? 100,
          jobCount: searchResult.results.length,
          difficultyLevel: catalogEntry?.difficultyLevel ?? "MEDIUM",
          growthPotential: catalogEntry?.growthPotential ?? "MEDIUM",
        } as const;
      })
    );

    return compareCareerScenarios([...inputs]);
  },

  async listMessages(userId: string) {
    return coachRepository.listByUser(userId);
  },

  async sendMessage(userId: string, locale: Locale, message: string) {
    const [data, recentHistory] = await Promise.all([loadRawData(userId, locale), coachRepository.recentByUser(userId, 10)]);
    const snapshot = toContextSnapshot(data);

    await coachRepository.append(userId, "USER", message);

    const history = recentHistory.map((m) => ({ role: m.role === "USER" ? ("user" as const) : ("assistant" as const), content: m.content }));

    const profileSnapshot = { ...toProfileSnapshot(data.profile), skills: data.userSkills };
    const result = await getAICareerService().generateCoachReply({ locale, profile: profileSnapshot, snapshot, history, message });

    const suggestedActions = buildIntentActions(result.intent, snapshot);
    await coachRepository.append(userId, "ASSISTANT", result.reply, suggestedActions as unknown as Prisma.InputJsonValue);

    let memoryNoted = false;
    if (result.memoryFact) {
      const stored = await coachMemoryRepository.append(userId, result.memoryFact);
      memoryNoted = stored !== null;
    }

    return { reply: stripCoachDisplayMarkers(result.reply), intent: result.intent, suggestedActions, memoryNoted };
  },
};
