import type { Locale } from "@/lib/i18n/config";
import { profileRepository } from "@/server/repositories/profile.repository";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import {
  careerMissionRepository,
  type CreateCareerMissionInput,
} from "@/server/repositories/career-mission.repository";
import { toProfileSnapshot } from "@/lib/ai/career/profile-snapshot";
import { getAICareerService } from "@/lib/ai/career/get-career-service";
import type { CareerMissionResult, IncompleteRoadmapTask } from "@/lib/ai/career/types";
import { roadmapService } from "@/server/services/roadmap.service";
import { careerScoreService } from "@/server/services/career-score.service";
import { missionsService } from "@/server/services/missions.service";
import { enrichResources } from "@/lib/career/resource-enrichment";
import { computeFallbackMissionInsight } from "@/lib/career/mission-insight";
import { computeMissionStreak } from "@/lib/career/mission-streak";

export class CareerMissionAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CareerMissionAccessError";
  }
}

const MISSIONS_PER_DAY = 5;
const HISTORY_DAYS = 7;
const STREAK_LOOKBACK_DAYS = 60;
const AI_CALL_TIMEOUT_MS = 120_000;

/**
 * Server-side "today," date-only, UTC. This project has no per-user
 * timezone preference stored anywhere yet, so UTC midnight is the one
 * deliberate simplification here — documented rather than faked; see
 * ARCHITECTURE.md's "Career Missions" section.
 */
function getServerToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function daysAgo(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

async function loadRoadmapContext(userId: string) {
  const roadmap = await roadmapRepository.findByUser(userId);
  if (!roadmap) return null;

  const currentMilestone =
    roadmap.milestones.find((m) => m.status === "IN_PROGRESS") ??
    roadmap.milestones.find((m) => m.status === "AVAILABLE") ??
    null;

  const incompleteTasks: IncompleteRoadmapTask[] = roadmap.milestones
    .filter((m) => m.status !== "LOCKED")
    .flatMap((m) => m.tasks.filter((t) => !t.completed).map((t) => ({ title: t.title, milestoneTitle: m.title })))
    .slice(0, 20);

  const taskByTitle = new Map<string, { id: string; milestoneId: string }>();
  for (const milestone of roadmap.milestones) {
    for (const task of milestone.tasks) {
      if (!taskByTitle.has(task.title)) taskByTitle.set(task.title, { id: task.id, milestoneId: milestone.id });
    }
  }

  return { roadmap, currentMilestone, incompleteTasks, taskByTitle };
}

function toCreateInput(
  mission: CareerMissionResult,
  roadmapId: string,
  currentMilestoneId: string | null,
  currentMilestoneSkills: string[],
  taskByTitle: Map<string, { id: string; milestoneId: string }>,
  missionDate: Date
): CreateCareerMissionInput {
  // Never trust the AI's `relatedTaskTitle` as an ID — resolve it by exact
  // title match against this user's own roadmap tasks, loaded server-side,
  // or drop the linkage entirely.
  const matchedTask = mission.relatedTaskTitle ? taskByTitle.get(mission.relatedTaskTitle) : undefined;

  return {
    roadmapId,
    milestoneId: matchedTask?.milestoneId ?? currentMilestoneId ?? undefined,
    roadmapTaskId: matchedTask?.id,
    title: mission.title,
    description: mission.description,
    goal: mission.goal,
    instructions: mission.instructions,
    whyItMatters: mission.whyItMatters,
    expectedResult: mission.expectedResult,
    estimatedMinutes: mission.estimatedMinutes,
    difficulty: mission.difficulty,
    skill: mission.skill ?? undefined,
    priority: mission.priority,
    missionDate,
    resources: enrichResources(mission.resources, mission.skill ? [mission.skill] : currentMilestoneSkills),
  };
}

export const careerMissionService = {
  async getToday(userId: string, locale: Locale) {
    const today = getServerToday();
    await careerMissionRepository.expireStale(userId, today);

    const missions = await careerMissionRepository.listByUserAndDate(userId, today);
    const context = await loadRoadmapContext(userId);

    const insight = computeFallbackMissionInsight(
      {
        careerTitle: context?.roadmap.careerTitle ?? "",
        currentMilestoneTitle: context?.currentMilestone?.title ?? null,
        focusSkill: missions.find((m) => m.skill)?.skill ?? context?.currentMilestone?.skills[0] ?? null,
      },
      locale
    );

    return { missions, insight: context ? insight : null, hasRoadmap: context !== null };
  },

  async generateToday(userId: string, locale: Locale) {
    const today = getServerToday();
    await careerMissionRepository.expireStale(userId, today);

    const existing = await careerMissionRepository.listByUserAndDate(userId, today);
    const hasActive = existing.some((m) => m.status === "AVAILABLE" || m.status === "IN_PROGRESS");
    if (hasActive) {
      // Idempotency: never pile on more missions while today's set still has active ones.
      return { missions: existing, insight: null };
    }

    const context = await loadRoadmapContext(userId);
    if (!context) throw new CareerMissionAccessError("no_roadmap");

    const [profile, scoreSnapshot, recentMissions] = await Promise.all([
      profileRepository.findByUserId(userId),
      careerScoreService.getSnapshot(userId),
      careerMissionRepository.listRecentByUser(userId, daysAgo(today, HISTORY_DAYS)),
    ]);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_CALL_TIMEOUT_MS);
    let generation;
    try {
      generation = await getAICareerService().generateCareerMissions({
        locale,
        profile: toProfileSnapshot(profile),
        dna: scoreSnapshot.dna,
        careerScore: profile?.careerScore ?? null,
        careerTitle: context.roadmap.careerTitle,
        currentMilestone: context.currentMilestone
          ? {
              title: context.currentMilestone.title,
              description: context.currentMilestone.description,
              skills: context.currentMilestone.skills,
            }
          : null,
        incompleteTasks: context.incompleteTasks,
        completedMissionTitles: recentMissions.filter((m) => m.status === "COMPLETED").map((m) => m.title),
        skippedMissionTitles: recentMissions.filter((m) => m.status === "SKIPPED").map((m) => m.title),
        count: MISSIONS_PER_DAY,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const missionsInput = generation.missions.map((mission) =>
      toCreateInput(
        mission,
        context.roadmap.id,
        context.currentMilestone?.id ?? null,
        context.currentMilestone?.skills ?? [],
        context.taskByTitle,
        today
      )
    );

    const created = await careerMissionRepository.createManyForUser(userId, missionsInput);
    await missionsService.sync(userId);

    return { missions: created, insight: generation.insight };
  },

  async startMission(userId: string, missionId: string) {
    const mission = await careerMissionRepository.findById(missionId);
    if (!mission || mission.userId !== userId) throw new CareerMissionAccessError("not_found");

    if (mission.status === "AVAILABLE") {
      return careerMissionRepository.updateStatus(missionId, "IN_PROGRESS", { startedAt: new Date() });
    }
    return mission;
  },

  async completeMission(userId: string, missionId: string) {
    const mission = await careerMissionRepository.findById(missionId);
    if (!mission || mission.userId !== userId) throw new CareerMissionAccessError("not_found");
    if (mission.status === "COMPLETED") return mission;

    const updated = await careerMissionRepository.updateStatus(missionId, "COMPLETED", { completedAt: new Date() });

    if (mission.roadmapTaskId) {
      try {
        // Reuses the roadmap's own task-completion logic wholesale (which
        // already recomputes milestone/roadmap progress and refreshes the
        // Career Score) instead of duplicating any of that here.
        await roadmapService.toggleTask(userId, mission.roadmapTaskId, true);
      } catch {
        // The linked roadmap task may no longer exist or be reachable
        // (e.g. the roadmap was regenerated since this mission was
        // created) — the mission itself still completes normally.
      }
    } else {
      await Promise.all([missionsService.sync(userId), careerScoreService.getSnapshot(userId)]);
    }

    return updated;
  },

  async skipMission(userId: string, missionId: string) {
    const mission = await careerMissionRepository.findById(missionId);
    if (!mission || mission.userId !== userId) throw new CareerMissionAccessError("not_found");

    return careerMissionRepository.updateStatus(missionId, "SKIPPED", { skippedAt: new Date() });
  },

  async regenerateMission(userId: string, missionId: string, locale: Locale) {
    const mission = await careerMissionRepository.findById(missionId);
    if (!mission || mission.userId !== userId) throw new CareerMissionAccessError("not_found");

    await careerMissionRepository.updateStatus(missionId, "SKIPPED", { skippedAt: new Date() });

    const context = await loadRoadmapContext(userId);
    if (!context) throw new CareerMissionAccessError("no_roadmap");

    const [profile, scoreSnapshot, recentMissions] = await Promise.all([
      profileRepository.findByUserId(userId),
      careerScoreService.getSnapshot(userId),
      careerMissionRepository.listRecentByUser(userId, daysAgo(mission.missionDate, HISTORY_DAYS)),
    ]);

    const generation = await getAICareerService().generateCareerMissions({
      locale,
      profile: toProfileSnapshot(profile),
      dna: scoreSnapshot.dna,
      careerScore: profile?.careerScore ?? null,
      careerTitle: context.roadmap.careerTitle,
      currentMilestone: context.currentMilestone
        ? {
            title: context.currentMilestone.title,
            description: context.currentMilestone.description,
            skills: context.currentMilestone.skills,
          }
        : null,
      incompleteTasks: context.incompleteTasks,
      completedMissionTitles: recentMissions.filter((m) => m.status === "COMPLETED").map((m) => m.title),
      skippedMissionTitles: [...recentMissions.filter((m) => m.status === "SKIPPED").map((m) => m.title), mission.title],
      count: 1,
    });

    const replacement = generation.missions[0];
    if (!replacement) throw new Error("regeneration_failed");

    await careerMissionRepository.createOneForUser(
      userId,
      toCreateInput(
        { ...replacement, priority: mission.priority },
        context.roadmap.id,
        context.currentMilestone?.id ?? null,
        context.currentMilestone?.skills ?? [],
        context.taskByTitle,
        mission.missionDate
      )
    );

    return careerMissionRepository.listByUserAndDate(userId, mission.missionDate);
  },

  async getHistory(userId: string) {
    const today = getServerToday();
    const missions = await careerMissionRepository.listRecentByUser(userId, daysAgo(today, HISTORY_DAYS));
    return missions.filter((m) => m.missionDate.getTime() !== today.getTime());
  },

  async getStreak(userId: string) {
    const today = getServerToday();
    const completedDates = await careerMissionRepository.listCompletedDates(userId, daysAgo(today, STREAK_LOOKBACK_DAYS));
    return computeMissionStreak(completedDates, today);
  },
};
