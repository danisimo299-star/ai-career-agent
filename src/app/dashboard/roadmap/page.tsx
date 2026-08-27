import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { roadmapService } from "@/server/services/roadmap.service";
import { careerRepository } from "@/server/repositories/career.repository";
import { careerScoreService } from "@/server/services/career-score.service";
import { RoadmapView } from "@/components/roadmap/roadmap-view";
import type { RoadmapData } from "@/components/roadmap/types";

export default async function RoadmapPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const [roadmap, recommendations, scoreSnapshot] = await Promise.all([
    roadmapService.getForUser(user.id),
    careerRepository.listByUser(user.id),
    careerScoreService.getSnapshot(user.id),
  ]);

  return (
    <RoadmapView
      initialRoadmap={roadmap as RoadmapData | null}
      careerScore={scoreSnapshot.score}
      suggestedCareerTitle={recommendations[0]?.title ?? null}
      recommendedCareers={recommendations.map((rec) => rec.title)}
    />
  );
}
