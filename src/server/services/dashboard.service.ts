import type { Locale } from "@/lib/i18n/config";
import { profileRepository } from "@/server/repositories/profile.repository";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import { careerRepository } from "@/server/repositories/career.repository";
import { careerScoreService } from "@/server/services/career-score.service";
import { roadmapService } from "@/server/services/roadmap.service";
import { interviewService } from "@/server/services/interview.service";
import { resumeService } from "@/server/services/resume.service";
import { coachService } from "@/server/services/coach.service";
import { careerMissionService } from "@/server/services/career-mission.service";
import { computeResumeScore } from "@/lib/career/resume-score";
import { computeRoadmapProgress, pickThisWeekTasks } from "@/lib/career/roadmap-progress";
import { isResumeContentMeaningful } from "@/types";
import type { ResumeContent } from "@/types";
import type { JourneyStageKey } from "@/lib/career/journey";

/** Everything the `/dashboard` page needs, gathered in one place so its data-fetching logic lives with the rest of the deterministic dashboard formulas rather than inline in the page component. Read-only — no AI calls happen here; every widget shows already-computed/stored state (`careerMissionService.getToday` reads today's already-generated missions, it never generates new ones). */
export async function getDashboardSummary(userId: string, locale: Locale) {
  const [profile, scoreSnapshot, roadmap, interviewSessions, resumes, coachContext, today] = await Promise.all([
    profileRepository.findByUserId(userId),
    careerScoreService.getSnapshot(userId),
    roadmapService.getForUser(userId),
    interviewService.listByUser(userId),
    resumeService.listByUser(userId),
    coachService.getContext(userId, locale),
    careerMissionService.getToday(userId, locale),
  ]);

  const completedInterviews = interviewSessions.filter((s) => s.status === "COMPLETED" && s.report);

  const latestResume = resumes[0] ?? null;
  const latestResumeContent = latestResume ? (latestResume.content as unknown as ResumeContent) : null;
  const hasResume = Boolean(latestResumeContent && isResumeContentMeaningful(latestResumeContent));
  const resumeScore = latestResumeContent ? computeResumeScore(latestResumeContent, latestResume!.title, locale).score : null;

  const journeyDone: Record<JourneyStageKey, boolean> = {
    discover: profile?.questionnaireCompleted ?? false,
    choose: coachContext.targetRole !== null,
    build: roadmap !== null,
    present: hasResume,
    practice: completedInterviews.length > 0,
    apply: coachContext.applications > 0,
    // "Grow" is deliberately never "done" — it's the open-ended stage once everything else is in place, not a checklist item.
    grow: false,
  };
  const journeyOrder: JourneyStageKey[] = ["discover", "choose", "build", "present", "practice", "apply", "grow"];
  // Strictly sequential on purpose: this is a connected PATH, not an independent checklist —
  // a later stage never counts as "next" while an earlier one hasn't happened yet, even if its
  // own signal happens to be true (e.g. a roadmap generated without going through the Career
  // Interview first). The one stage the dashboard hero surfaces IS this first not-done stage.
  const nextStepKey = journeyOrder[journeyOrder.findIndex((key) => !journeyDone[key])] ?? "grow";
  const upcomingStageKeys = journeyOrder.filter((key) => !journeyDone[key]).slice(0, 3);
  if (upcomingStageKeys.length === 0) upcomingStageKeys.push("grow");

  const interviewScores = completedInterviews
    .map((s) => (s.report as unknown as { overallScore: number } | null)?.overallScore)
    .filter((score): score is number => score !== undefined);
  const interviewAvgScore = interviewScores.length > 0 ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length) : null;

  const planPercent = roadmap ? computeRoadmapProgress(roadmap.milestones).percent : null;
  const thisWeek = roadmap ? pickThisWeekTasks(roadmap.milestones) : null;

  return {
    nextStepKey,
    upcomingStageKeys,
    profilePercent: scoreSnapshot.score,
    strengths: scoreSnapshot.strengths,
    missing: scoreSnapshot.missing,
    planPercent,
    resumeScore: hasResume ? resumeScore : null,
    interviewCount: completedInterviews.length,
    interviewAvgScore,
    proactiveInsight: coachContext.proactiveInsight,
    targetRole: coachContext.targetRole,
    tasks: today.missions.slice(0, 4).map((m) => ({ id: m.id, title: m.title, status: m.status, estimatedMinutes: m.estimatedMinutes })),
    thisWeekMilestoneTitle: thisWeek?.milestoneTitle ?? null,
    thisWeekTasks: thisWeek?.tasks ?? [],
    thisWeekPercent: thisWeek?.percent ?? null,
  };
}

/**
 * Just the career goal label — for the sidebar's account panel, which
 * renders on every dashboard route and shouldn't pay for the full
 * `getDashboardSummary` aggregation just to show one line of secondary
 * text. Same "roadmap title, else top recommendation" resolution the
 * heavier services already use.
 */
export async function getUserTargetRole(userId: string): Promise<string | null> {
  const [roadmap, recommendations] = await Promise.all([roadmapRepository.findByUser(userId), careerRepository.listByUser(userId)]);
  return roadmap?.careerTitle ?? recommendations[0]?.title ?? null;
}

/**
 * The topbar notification bell's content — real, already-computed signals
 * only (today's still-open missions, the same proactive skill/job insight
 * shown elsewhere), never a fabricated count. Read-only, no AI calls,
 * cheap enough to run on every dashboard route the way `getUserTargetRole`
 * already does.
 */
export async function getTopbarNotifications(userId: string, locale: Locale) {
  const [today, coachContext] = await Promise.all([careerMissionService.getToday(userId, locale), coachService.getContext(userId, locale)]);
  const pendingMissionsCount = today.missions.filter((m) => m.status === "AVAILABLE" || m.status === "IN_PROGRESS").length;
  return { pendingMissionsCount, proactiveInsight: coachContext.proactiveInsight };
}
