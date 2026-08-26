import { userRepository } from "@/server/repositories/user.repository";
import { profileRepository } from "@/server/repositories/profile.repository";
import { resumeRepository } from "@/server/repositories/resume.repository";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import { careerRepository } from "@/server/repositories/career.repository";
import { coachRepository } from "@/server/repositories/coach.repository";
import { savedJobRepository } from "@/server/repositories/saved-job.repository";

/** Settings → Data & Privacy → "Export my data" — a real snapshot of what's actually stored, assembled fresh on every request rather than a background job, since the underlying tables are small per user. */
export const exportService = {
  async exportUserData(userId: string) {
    const [user, profile, resumes, roadmap, recommendations, coachMessages, savedJobs] = await Promise.all([
      userRepository.findById(userId),
      profileRepository.findByUserId(userId),
      resumeRepository.listByUser(userId),
      roadmapRepository.findByUser(userId),
      careerRepository.listByUser(userId),
      coachRepository.listByUser(userId),
      savedJobRepository.listByUser(userId),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      account: user ? { email: user.email, name: user.name } : null,
      profile,
      resumes,
      roadmap,
      careerRecommendations: recommendations,
      coachMessages,
      savedJobs,
    };
  },
};
