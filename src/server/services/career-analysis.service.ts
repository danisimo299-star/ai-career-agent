import type { Locale } from "@/lib/i18n/config";
import { profileRepository } from "@/server/repositories/profile.repository";
import { careerRepository } from "@/server/repositories/career.repository";
import { toProfileSnapshot } from "@/lib/ai/career/profile-snapshot";
import { getAICareerService } from "@/lib/ai/career/get-career-service";
import { missionsService } from "@/server/services/missions.service";
import { careerScoreService } from "@/server/services/career-score.service";

export const careerAnalysisService = {
  async analyze(userId: string, locale: Locale) {
    const profile = await profileRepository.findByUserId(userId);
    const snapshot = toProfileSnapshot(profile);
    const service = getAICareerService();

    const [recommendations, insights] = await Promise.all([
      service.generateCareerRecommendations({ locale, profile: snapshot }),
      service.generateCareerInsights({ locale, profile: snapshot }),
    ]);

    await Promise.all([
      careerRepository.replaceForUser(userId, recommendations),
      profileRepository.upsert(userId, { careerInsights: insights }),
    ]);

    await Promise.all([missionsService.sync(userId), careerScoreService.getSnapshot(userId)]);

    return { recommendations, insights };
  },

  async getExisting(userId: string) {
    const [recommendations, profile] = await Promise.all([
      careerRepository.listByUser(userId),
      profileRepository.findByUserId(userId),
    ]);

    return { recommendations, insights: profile?.careerInsights ?? [] };
  },
};
