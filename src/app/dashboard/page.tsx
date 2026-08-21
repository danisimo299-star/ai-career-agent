import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { profileRepository } from "@/server/repositories/profile.repository";
import { careerScoreService } from "@/server/services/career-score.service";
import { roadmapService } from "@/server/services/roadmap.service";
import { careerMissionService } from "@/server/services/career-mission.service";
import { interviewService } from "@/server/services/interview.service";
import { resumeService } from "@/server/services/resume.service";
import { jobsService } from "@/server/services/jobs.service";
import { coachService } from "@/server/services/coach.service";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import type { JourneyStageKey } from "@/components/dashboard/career-journey";
import { computeResumeScore } from "@/lib/career/resume-score";
import { isResumeContentMeaningful } from "@/types";
import type { CareerDnaScores } from "@/lib/ai/career/types";
import type { RoadmapData } from "@/components/roadmap/types";
import type { CareerMissionData } from "@/components/missions/types";
import type { ResumeContent } from "@/types";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user?.id) return null;

  const locale = await getLocale();

  const [profile, scoreSnapshot, roadmap, todayMissions, streak, interviewSessions, resumes, jobs, coachContext] = await Promise.all([
    profileRepository.findByUserId(user.id),
    careerScoreService.getSnapshot(user.id),
    roadmapService.getForUser(user.id),
    careerMissionService.getToday(user.id, locale),
    careerMissionService.getStreak(user.id),
    interviewService.listByUser(user.id),
    resumeService.listByUser(user.id),
    jobsService.recommend(user.id),
    coachService.getContext(user.id, locale),
  ]);

  const missions = todayMissions.missions as unknown as CareerMissionData[];
  const nextMission = missions.find((m) => m.status === "AVAILABLE" || m.status === "IN_PROGRESS") ?? null;

  const completedInterviews = interviewSessions.filter((s) => s.status === "COMPLETED" && s.report);
  const latestInterview = completedInterviews[0] ?? null;
  const latestReport = latestInterview?.report as { overallScore: number; nextSteps: string[] } | null;

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
  const firstNotDoneIndex = journeyOrder.findIndex((key) => !journeyDone[key]);
  // Strictly sequential on purpose: this is a connected PATH, not an independent checklist —
  // a later stage never shows "done" while an earlier one hasn't, even if its own signal
  // happens to be true (e.g. a roadmap generated without going through the Questionnaire first).
  const journey = journeyOrder.map((key, i) => ({
    key,
    status: i < firstNotDoneIndex ? ("done" as const) : i === firstNotDoneIndex ? ("current" as const) : ("todo" as const),
  }));

  return (
    <DashboardOverview
      userName={user.name}
      dna={(profile?.careerDna as CareerDnaScores | null) ?? null}
      score={scoreSnapshot.score}
      strengths={scoreSnapshot.strengths}
      missing={scoreSnapshot.missing}
      hasChatted={(profile?.interviewTopicsCovered.length ?? 0) > 0}
      roadmap={roadmap as RoadmapData | null}
      todayMission={nextMission}
      hasActiveMissions={missions.length > 0}
      missionStreak={streak}
      interviewCompletedCount={completedInterviews.length}
      interviewLastScore={latestReport?.overallScore ?? null}
      interviewRecommendation={latestReport?.nextSteps?.[0] ?? null}
      hasResume={hasResume}
      resumeScore={hasResume ? resumeScore : null}
      resumeUpdatedAt={hasResume ? (latestResume!.updatedAt.toISOString()) : null}
      jobTopMatches={jobs.map((job) => ({ title: job.title, matchScore: job.matchScore }))}
      targetRole={coachContext.targetRole}
      readiness={coachContext.careerReadiness}
      nextActionTitle={coachContext.nextActionTitle}
      nextActionWhy={nextMission?.whyItMatters ?? null}
      journey={journey}
      proactiveInsight={coachContext.proactiveInsight}
    />
  );
}
