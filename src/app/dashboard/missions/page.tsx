import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { careerMissionService } from "@/server/services/career-mission.service";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import { careerScoreService } from "@/server/services/career-score.service";
import { computeRoadmapProgress } from "@/lib/career/roadmap-progress";
import { MissionsView } from "@/components/missions/missions-view";
import type { CareerMissionData } from "@/components/missions/types";
import type { MissionHistoryEntry } from "@/components/missions/mission-history";

export default async function MissionsPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const locale = await getLocale();

  const [today, historyRaw, roadmap, scoreSnapshot] = await Promise.all([
    careerMissionService.getToday(user.id, locale),
    careerMissionService.getHistory(user.id),
    roadmapRepository.findByUser(user.id),
    careerScoreService.getSnapshot(user.id),
  ]);

  const currentMilestone = roadmap
    ? (roadmap.milestones.find((m) => m.status === "IN_PROGRESS") ?? roadmap.milestones.find((m) => m.status === "AVAILABLE") ?? null)
    : null;

  const history: MissionHistoryEntry[] = historyRaw.map((m) => ({
    ...(m as unknown as CareerMissionData),
    missionDate: m.missionDate.toISOString(),
  }));

  return (
    <MissionsView
      initialMissions={today.missions as unknown as CareerMissionData[]}
      initialInsight={today.insight}
      hasRoadmap={today.hasRoadmap}
      careerTitle={roadmap?.careerTitle ?? null}
      initialCareerScore={scoreSnapshot.score}
      roadmapProgressPercent={roadmap ? computeRoadmapProgress(roadmap.milestones).percent : 0}
      currentMilestoneTitle={currentMilestone?.title ?? null}
      history={history}
    />
  );
}
