import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { careerMissionService } from "@/server/services/career-mission.service";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import { careerScoreService } from "@/server/services/career-score.service";
import { computeRoadmapProgress } from "@/lib/career/roadmap-progress";
import { RoadmapView } from "@/components/roadmap/roadmap-view";
import { careerRepository } from "@/server/repositories/career.repository";
import type { RoadmapData } from "@/components/roadmap/types";
import { MissionsView } from "@/components/missions/missions-view";
import type { CareerMissionData } from "@/components/missions/types";
import type { MissionHistoryEntry } from "@/components/missions/mission-history";

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view = (await searchParams).view === "all" ? "all" : "today";
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const locale = await getLocale();

  // Expire yesterday’s missions before reading history. No new plan or missions are generated on a visit.
  const today = await careerMissionService.getToday(user.id, locale);
  const [historyRaw, roadmap, scoreSnapshot, streak, recommendations] = await Promise.all([
    careerMissionService.getHistory(user.id),
    roadmapRepository.findByUser(user.id),
    careerScoreService.getSnapshot(user.id),
    careerMissionService.getStreak(user.id),
    careerRepository.listByUser(user.id),
  ]);

  const currentMilestone = roadmap
    ? (roadmap.milestones.find((m) => m.status === "IN_PROGRESS") ?? roadmap.milestones.find((m) => m.status === "AVAILABLE") ?? null)
    : null;

  const history: MissionHistoryEntry[] = historyRaw.map((m) => ({
    ...(m as unknown as CareerMissionData),
    missionDate: m.missionDate.toISOString(),
  }));

  return (
    <RoadmapView
      initialRoadmap={roadmap as RoadmapData | null}
      careerScore={scoreSnapshot.score}
      suggestedCareerTitle={recommendations[0]?.title ?? null}
      recommendedCareers={recommendations.map((rec) => rec.title)}
      view={view}
      today={
        <MissionsView
          key="today"
          embedded
          initialMissions={today.missions as unknown as CareerMissionData[]}
          initialInsight={today.insight}
          hasRoadmap={today.hasRoadmap}
          careerTitle={roadmap?.careerTitle ?? null}
          initialCareerScore={scoreSnapshot.score}
          roadmapProgressPercent={roadmap ? computeRoadmapProgress(roadmap.milestones).percent : 0}
          currentMilestoneTitle={currentMilestone?.title ?? null}
          history={history}
          initialStreak={streak}
        />
      }
    />
  );
}
