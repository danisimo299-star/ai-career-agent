import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { profileRepository } from "@/server/repositories/profile.repository";
import { careerScoreService } from "@/server/services/career-score.service";
import { careerAnalysisService } from "@/server/services/career-analysis.service";
import { missionsService } from "@/server/services/missions.service";
import { CareerPassportView } from "@/components/career/career-passport-view";

export default async function CareerPassportPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const [profile, scoreSnapshot, analysis, missions] = await Promise.all([
    profileRepository.findByUserId(user.id),
    careerScoreService.getSnapshot(user.id),
    careerAnalysisService.getExisting(user.id),
    missionsService.sync(user.id),
  ]);

  return (
    <CareerPassportView
      userName={user.name ?? null}
      profile={{
        age: profile?.age ?? null,
        city: profile?.city ?? null,
        educationStage: profile?.educationStage ?? null,
        interests: profile?.interests ?? [],
        goals: profile?.goals ?? [],
      }}
      dna={scoreSnapshot.dna}
      score={scoreSnapshot.score}
      strengths={scoreSnapshot.strengths}
      missing={scoreSnapshot.missing}
      recommendations={analysis.recommendations.slice(0, 3).map((rec) => ({
        id: rec.id,
        title: rec.title,
        matchScore: rec.matchScore,
        reasoning: rec.reasoning,
        requiredSkills: rec.requiredSkills,
        learningTimeMonths: rec.learningTimeMonths,
        growthPotential: rec.growthPotential,
        difficultyLevel: rec.difficultyLevel,
      }))}
      insights={analysis.insights}
      missions={missions.map((mission) => ({ id: mission.id, key: mission.key, status: mission.status }))}
    />
  );
}
