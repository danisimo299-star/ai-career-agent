import { profileRepository } from "@/server/repositories/profile.repository";
import { resumeRepository } from "@/server/repositories/resume.repository";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import { interviewRepository } from "@/server/repositories/interview.repository";
import { toProfileSnapshot } from "@/lib/ai/career/profile-snapshot";
import { computeCareerScore, type CareerScoreResult } from "@/lib/career/score";
import type { CareerDnaScores } from "@/lib/ai/career/types";
import { isResumeContentMeaningful, type ResumeContent } from "@/types";

export const careerScoreService = {
  async getSnapshot(userId: string): Promise<CareerScoreResult & { dna: CareerDnaScores | null }> {
    const [profile, resumes, roadmap, interviewSessions] = await Promise.all([
      profileRepository.findByUserId(userId),
      resumeRepository.listByUser(userId),
      roadmapRepository.findByUser(userId),
      interviewRepository.listByUser(userId),
    ]);

    const dna = (profile?.careerDna as CareerDnaScores | null) ?? null;

    const result = computeCareerScore({
      profile: toProfileSnapshot(profile),
      dna,
      hasResume: resumes.some((r) => isResumeContentMeaningful(r.content as unknown as ResumeContent)),
      hasRoadmap: Boolean(roadmap),
      hasCompletedInterview: interviewSessions.some((session) => session.status === "COMPLETED"),
    });

    if (profile && profile.careerScore !== result.score) {
      await profileRepository.upsert(userId, { careerScore: result.score });
    }

    return { ...result, dna };
  },
};
