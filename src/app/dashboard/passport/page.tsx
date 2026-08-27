import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { profileRepository } from "@/server/repositories/profile.repository";
import { careerScoreService } from "@/server/services/career-score.service";
import { careerAnalysisService } from "@/server/services/career-analysis.service";
import { missionsService } from "@/server/services/missions.service";
import { interviewAttemptRepository } from "@/server/repositories/interview-attempt.repository";
import { CareerPassportView } from "@/components/career/career-passport-view";

export default async function CareerPassportPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const [profile, scoreSnapshot, analysis, missions, interviewHistory] = await Promise.all([
    profileRepository.findByUserId(user.id),
    careerScoreService.getSnapshot(user.id),
    careerAnalysisService.getExisting(user.id),
    missionsService.sync(user.id),
    interviewAttemptRepository.listCompleted(user.id),
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
        skills: profile?.skills ?? [],
        strengths: profile?.strengths ?? [],
        preferredFormat: profile?.preferredFormat ?? null,
        salaryExpectation: profile?.salaryExpectation ?? null,
        languages: profile?.languages ?? [],
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
        hhSearchTitle: rec.hhSearchTitle,
        firstJobTitle: rec.firstJobTitle,
        marketDemand: rec.marketDemand,
        vacancyCountCity: rec.vacancyCountCity,
        vacancyCountRussia: rec.vacancyCountRussia,
        marketCheckedCity: rec.marketCheckedCity,
        hhProfessionalRoleId: rec.hhProfessionalRoleId,
        hhAreaId: rec.hhAreaId,
      }))}
      insights={analysis.insights}
      summary={analysis.summary}
      missions={missions.map((mission) => ({ id: mission.id, key: mission.key, status: mission.status }))}
      interviewHistory={interviewHistory.map((attempt) => ({
        id: attempt.id,
        completedAt: attempt.completedAt?.toISOString() ?? attempt.startedAt.toISOString(),
        topCareerTitle: attempt.topCareerTitle,
      }))}
    />
  );
}
