import type { Locale } from "@/lib/i18n/config";
import { profileRepository } from "@/server/repositories/profile.repository";
import { roadmapRepository, type CreateMilestoneInput } from "@/server/repositories/roadmap.repository";
import { toProfileSnapshot } from "@/lib/ai/career/profile-snapshot";
import { getAICareerService } from "@/lib/ai/career/get-career-service";
import type { RoadmapMilestoneResult } from "@/lib/ai/career/types";
import { missionsService } from "@/server/services/missions.service";
import { careerScoreService } from "@/server/services/career-score.service";
import { initialMilestoneStatuses, nextMilestoneStatusAfterTaskToggle } from "@/lib/career/roadmap-progress";
import { enrichResources } from "@/lib/career/resource-enrichment";

class RoadmapAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoadmapAccessError";
  }
}

function toMilestoneInputs(milestones: RoadmapMilestoneResult[]): CreateMilestoneInput[] {
  const statuses = initialMilestoneStatuses(milestones.length);

  return milestones.map((milestone, index) => ({
    title: milestone.title,
    description: milestone.description,
    whyItMatters: milestone.whyItMatters,
    expectedResult: milestone.expectedResult,
    estimatedWeeks: milestone.estimatedWeeks,
    skills: milestone.skills,
    status: statuses[index],
    tasks: milestone.tasks.map((task) => ({
      title: task.title,
      // Only the first task of a milestone carries the milestone's one
      // trusted resource (if any) — attaching it to every task would be
      // repetitive and imply more verified coverage than actually exists.
      resources: task === milestone.tasks[0] ? enrichResources(task.resources, milestone.skills) : [],
    })),
  }));
}

export const roadmapService = {
  async generate(userId: string, careerTitle: string, locale: Locale, careerRecommendationId?: string) {
    const [profile, scoreSnapshot] = await Promise.all([
      profileRepository.findByUserId(userId),
      careerScoreService.getSnapshot(userId),
    ]);

    const milestoneResults = await getAICareerService().generateRoadmap({
      locale,
      careerTitle,
      profile: toProfileSnapshot(profile),
      dna: scoreSnapshot.dna,
      careerScore: profile?.careerScore ?? null,
    });

    const roadmap = await roadmapRepository.replaceForUser(
      userId,
      careerTitle,
      toMilestoneInputs(milestoneResults),
      careerRecommendationId
    );

    await Promise.all([missionsService.sync(userId), careerScoreService.getSnapshot(userId)]);

    return roadmap;
  },

  getForUser(userId: string) {
    return roadmapRepository.findByUser(userId);
  },

  async startMilestone(userId: string, milestoneId: string) {
    const milestone = await roadmapRepository.findMilestoneById(milestoneId);
    if (!milestone || milestone.roadmap.userId !== userId) throw new RoadmapAccessError("not_found");

    if (milestone.status === "AVAILABLE") {
      await roadmapRepository.updateMilestoneStatus(milestoneId, "IN_PROGRESS");
    }

    return roadmapRepository.findByUser(userId);
  },

  async toggleTask(userId: string, taskId: string, completed: boolean) {
    const task = await roadmapRepository.findTaskById(taskId);
    if (!task || task.milestone.roadmap.userId !== userId) throw new RoadmapAccessError("not_found");
    if (task.milestone.status === "LOCKED") throw new RoadmapAccessError("locked");

    await roadmapRepository.updateTaskCompleted(taskId, completed);

    const updatedTasks = task.milestone.tasks.map((t) => (t.id === taskId ? { ...t, completed } : t));
    const newStatus = nextMilestoneStatusAfterTaskToggle(task.milestone.status, updatedTasks);

    if (newStatus !== task.milestone.status) {
      await roadmapRepository.updateMilestoneStatus(task.milestone.id, newStatus);

      if (newStatus === "COMPLETED") {
        const roadmap = await roadmapRepository.findByUser(userId);
        const currentIndex = roadmap?.milestones.findIndex((m) => m.id === task.milestone.id) ?? -1;
        const next = roadmap?.milestones[currentIndex + 1];
        if (next && next.status === "LOCKED") {
          await roadmapRepository.updateMilestoneStatus(next.id, "AVAILABLE");
        }
      }
    }

    await Promise.all([missionsService.sync(userId), careerScoreService.getSnapshot(userId)]);

    return roadmapRepository.findByUser(userId);
  },
};

export { RoadmapAccessError };
