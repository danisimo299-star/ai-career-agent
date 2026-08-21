import { profileRepository } from "@/server/repositories/profile.repository";
import { careerRepository } from "@/server/repositories/career.repository";
import { resumeRepository } from "@/server/repositories/resume.repository";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import { interviewRepository } from "@/server/repositories/interview.repository";
import { missionRepository } from "@/server/repositories/mission.repository";
import { computeMissionCompletion, missionKeys } from "@/lib/career/missions";
import { isResumeContentMeaningful, type ResumeContent } from "@/types";

export const missionsService = {
  async sync(userId: string) {
    const [profile, recommendations, resumes, roadmap, interviewSessions] = await Promise.all([
      profileRepository.findByUserId(userId),
      careerRepository.listByUser(userId),
      resumeRepository.listByUser(userId),
      roadmapRepository.findByUser(userId),
      interviewRepository.listByUser(userId),
    ]);

    const completion = computeMissionCompletion({
      interviewReady: profile?.questionnaireCompleted ?? false,
      hasCareerAnalysis: recommendations.length > 0,
      hasSkills: (profile?.skills.length ?? 0) > 0,
      hasRoadmap: Boolean(roadmap),
      hasResume: resumes.some((r) => isResumeContentMeaningful(r.content as unknown as ResumeContent)),
      hasCompletedInterview: interviewSessions.some((session) => session.status === "COMPLETED"),
    });

    await Promise.all(
      missionKeys.map((key) => missionRepository.upsertStatus(userId, key, completion[key] ? "COMPLETED" : "PENDING"))
    );

    return missionRepository.listByUser(userId);
  },
};
