import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { profileRepository } from "@/server/repositories/profile.repository";
import { careerAnalysisService } from "@/server/services/career-analysis.service";
import { CareerAnalysisView } from "@/components/career/career-analysis-view";

export default async function CareerAnalysisPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const [profile, { recommendations, insights, summary, status }] = await Promise.all([
    profileRepository.findByUserId(user.id),
    careerAnalysisService.getExisting(user.id),
  ]);

  const readyForAnalysis = profile?.questionnaireCompleted ?? false;

  return (
    <CareerAnalysisView
      initialRecommendations={recommendations.map((rec) => ({
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
      initialInsights={insights}
      initialSummary={summary}
      initialStatus={status}
      readyForAnalysis={readyForAnalysis}
    />
  );
}
