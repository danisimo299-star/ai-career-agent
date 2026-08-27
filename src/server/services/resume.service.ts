import type { Locale } from "@/lib/i18n/config";
import type { ResumeSectionKind } from "@/lib/ai/career/types";
import { profileRepository } from "@/server/repositories/profile.repository";
import { resumeRepository, type UpdateResumeInput } from "@/server/repositories/resume.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { careerRepository } from "@/server/repositories/career.repository";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import { toProfileSnapshot } from "@/lib/ai/career/profile-snapshot";
import { getAICareerService } from "@/lib/ai/career/get-career-service";
import { careerScoreService } from "@/server/services/career-score.service";
import { missionsService } from "@/server/services/missions.service";
import { emptyResumeContent, type ResumeContent } from "@/types";
import type { ResumeSectionContext } from "@/lib/ai/career/types";
import { createTimer } from "@/lib/dev-timing";

export class ResumeAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeAccessError";
  }
}

async function loadGenerationContext(userId: string, targetRole: string, locale: Locale) {
  const [profile, scoreSnapshot, recommendations, roadmap] = await Promise.all([
    profileRepository.findByUserId(userId),
    careerScoreService.getSnapshot(userId),
    careerRepository.listByUser(userId),
    roadmapRepository.findByUser(userId),
  ]);

  const currentMilestone = roadmap
    ? (roadmap.milestones.find((m) => m.status === "IN_PROGRESS") ?? roadmap.milestones.find((m) => m.status === "AVAILABLE") ?? null)
    : null;

  return {
    locale,
    profile: toProfileSnapshot(profile),
    targetRole,
    dna: scoreSnapshot.dna,
    careerScore: profile?.careerScore ?? null,
    topRecommendationTitle: recommendations[0]?.title ?? null,
    roadmapSkills: currentMilestone?.skills ?? [],
  };
}

export const resumeService = {
  listByUser(userId: string) {
    return resumeRepository.listByUser(userId);
  },

  /**
   * The user's working resume — most recently updated one if they have any,
   * otherwise a fresh blank one seeded with their real account name/email
   * (never AI-invented contact info) so the editor always has something to
   * open immediately, no AI call or target-role prompt required first.
   */
  async getCurrent(userId: string) {
    const resumes = await resumeRepository.listByUser(userId);
    if (resumes.length > 0) return resumes[0];

    const user = await userRepository.findById(userId);
    const content = emptyResumeContent(user?.name ?? "", user?.email ?? "");
    return resumeRepository.create(userId, "", content);
  },

  async getById(userId: string, resumeId: string) {
    const resume = await resumeRepository.findById(resumeId);
    if (!resume || resume.userId !== userId) throw new ResumeAccessError("not_found");
    return resume;
  },

  async update(userId: string, resumeId: string, data: UpdateResumeInput) {
    await resumeService.getById(userId, resumeId);
    const updated = await resumeRepository.update(resumeId, data);
    await Promise.all([missionsService.sync(userId), careerScoreService.getSnapshot(userId)]);
    return updated;
  },

  /** Suggested draft (career objective, summary, skills) for a mostly-empty resume — never saved automatically, the caller merges it into the edit form for the user to review. */
  async generateDraft(userId: string, targetRole: string, locale: Locale) {
    const timer = createTimer("resume.generateDraft");
    const context = await loadGenerationContext(userId, targetRole, locale);
    timer.mark("read+context");
    const draft = await getAICareerService().generateResume(context);
    timer.mark("ai");
    timer.done();
    return draft;
  },

  async generateSection(
    userId: string,
    resumeId: string,
    section: ResumeSectionKind,
    sectionInput: ResumeSectionContext["sectionInput"],
    locale: Locale,
    targetRole?: string
  ) {
    const resume = await resumeService.getById(userId, resumeId);
    const profile = await profileRepository.findByUserId(userId);
    return getAICareerService().generateResumeSection({
      locale,
      // The client's currently-typed role (may not be saved yet) always
      // wins over the persisted title, so a suggestion never falls back to
      // a stale or empty role just because the user hasn't hit Save.
      targetRole: targetRole || resume.title || "",
      profile: toProfileSnapshot(profile),
      section,
      sectionInput,
    });
  },

  async exportPdf(userId: string, resumeId: string) {
    return resumeService.getById(userId, resumeId);
  },

  /** "Проверить резюме" — reviews the resume's actual current content, not just the profile. */
  async review(userId: string, resumeId: string, targetRole: string, locale: Locale) {
    const resume = await resumeService.getById(userId, resumeId);
    return getAICareerService().reviewResume({
      locale,
      targetRole,
      content: resume.content as unknown as ResumeContent,
    });
  },
};
