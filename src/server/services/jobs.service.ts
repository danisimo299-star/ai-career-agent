import type { Locale } from "@/lib/i18n/config";
import type { ExperienceLevel, JobSource, SavedJobStatus, WorkFormat } from "@prisma/client";
import { profileRepository } from "@/server/repositories/profile.repository";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import { resumeRepository } from "@/server/repositories/resume.repository";
import { careerRepository } from "@/server/repositories/career.repository";
import { careerScoreService } from "@/server/services/career-score.service";
import { jobRepository } from "@/server/repositories/job.repository";
import { jobPreferenceRepository } from "@/server/repositories/job-preference.repository";
import { savedJobRepository, type CreateSavedJobInput } from "@/server/repositories/saved-job.repository";
import { getJobsProvider } from "@/lib/jobs/provider";
import { buildHhSearchUrl } from "@/lib/jobs/hh-reference";
import type { JobSearchQuery } from "@/lib/jobs/types";
import { computeJobMatch, computeResumeVacancyMatch, experienceLevelToHhExperience, type JobMatchResult } from "@/lib/career/job-matching";
import { compareSkills } from "@/lib/career/skill-normalization";
import { getAICareerService } from "@/lib/ai/career/get-career-service";
import type { JobRecommendationDTO, ResumeContent } from "@/types";
import type { JobSearchFiltersInput, JobPreferencesInput, SaveJobInput } from "@/lib/validation/job.schema";
import { createTimer } from "@/lib/dev-timing";

export class JobAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobAccessError";
  }
}

const RECOMMENDED_COUNT = 6;

function providerNameToSource(name: string): JobSource {
  return name === "hh" ? "HH_RU" : "MOCK";
}

function parseSalaryExpectation(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const match = raw.replace(/\s/g, "").match(/\d{3,}/);
  return match ? Number(match[0]) : null;
}

interface MatchContext {
  userSkills: string[];
  roadmapSkills: string[];
  careerGoals: string[];
  experienceLevel: ExperienceLevel | null;
  city: string | null;
  preferredFormat: WorkFormat | null;
  salaryExpectation: number | null;
  careerScore: number | null;
  resumeSkills: string[];
  resumeText: string;
}

async function loadMatchContext(userId: string): Promise<MatchContext> {
  const [profile, roadmap, resumes, scoreSnapshot] = await Promise.all([
    profileRepository.findByUserId(userId),
    roadmapRepository.findByUser(userId),
    resumeRepository.listByUser(userId),
    careerScoreService.getSnapshot(userId),
  ]);

  const resumeContent = (resumes[0]?.content as unknown as ResumeContent | undefined) ?? null;
  const resumeSkills = resumeContent?.skills ?? [];
  const resumeText = resumeContent
    ? [resumeContent.summary, resumeContent.careerObjective, ...resumeContent.experience.flatMap((e) => e.bullets)].filter(Boolean).join(" ")
    : "";

  const currentMilestone = roadmap
    ? (roadmap.milestones.find((m) => m.status === "IN_PROGRESS") ?? roadmap.milestones.find((m) => m.status === "AVAILABLE") ?? null)
    : null;

  return {
    userSkills: [...(profile?.skills ?? []), ...resumeSkills],
    roadmapSkills: currentMilestone?.skills ?? [],
    careerGoals: profile?.goals ?? [],
    experienceLevel: profile?.experienceLevel ?? null,
    city: profile?.city ?? null,
    preferredFormat: profile?.preferredFormat ?? null,
    salaryExpectation: parseSalaryExpectation(profile?.salaryExpectation),
    careerScore: scoreSnapshot.score,
    resumeSkills,
    resumeText,
  };
}

export interface JobSearchResultItem {
  vacancy: JobRecommendationDTO;
  match: JobMatchResult;
}

export interface JobSearchResponse {
  results: JobSearchResultItem[];
  hhSearchUrl: string;
  providerName: string;
  /**
   * Only set when the primary (city-scoped) search returned zero results —
   * a same-query check of the wider market, so the empty state can say
   * something honest and specific ("nothing in Kazan, but 12 nationwide")
   * instead of a bare "nothing found" (item 25/33 of the market-reality
   * brief). Never silently substituted into `results` itself.
   */
  broaderMarket?: { nationwideCount: number; remoteCount: number };
}

const HH_EXPERIENCE_RANK: Record<string, number> = {
  noExperience: 0,
  between1And3: 1,
  between3And6: 2,
  moreThan6: 3,
};

function sortResults(items: JobSearchResultItem[], sort: JobSearchFiltersInput["sort"]): JobSearchResultItem[] {
  const sorted = [...items];
  switch (sort) {
    case "highestSalary":
      sorted.sort((a, b) => (b.vacancy.salaryMax ?? b.vacancy.salaryMin ?? 0) - (a.vacancy.salaryMax ?? a.vacancy.salaryMin ?? 0));
      break;
    case "lowestExperience":
      sorted.sort(
        (a, b) => (HH_EXPERIENCE_RANK[a.vacancy.experienceLevel ?? ""] ?? 99) - (HH_EXPERIENCE_RANK[b.vacancy.experienceLevel ?? ""] ?? 99)
      );
      break;
    case "newest":
      break;
    case "bestMatch":
    default:
      sorted.sort((a, b) => b.match.score - a.match.score);
  }
  return sorted;
}

async function performSearch(userId: string, query: JobSearchQuery, targetRole: string, sort: JobSearchFiltersInput["sort"]): Promise<JobSearchResponse> {
  const [matchContext, provider] = [await loadMatchContext(userId), getJobsProvider()];
  const vacancies = await provider.search(query);

  const results: JobSearchResultItem[] = vacancies.map((vacancy) => ({
    vacancy,
    match: computeJobMatch({
      userSkills: matchContext.userSkills,
      roadmapSkills: matchContext.roadmapSkills,
      targetRole,
      careerGoals: matchContext.careerGoals,
      experienceLevel: matchContext.experienceLevel,
      city: matchContext.city,
      preferredFormat: matchContext.preferredFormat,
      salaryExpectation: matchContext.salaryExpectation,
      careerScore: matchContext.careerScore,
      vacancy: {
        title: vacancy.title,
        location: vacancy.location,
        workFormat: vacancy.workFormat === "ANY" ? undefined : (vacancy.workFormat as WorkFormat | undefined),
        experienceLevel: vacancy.experienceLevel,
        requiredSkills: vacancy.requiredSkills,
        salaryMin: vacancy.salaryMin,
      },
    }),
  }));

  const hhSearchUrl = buildHhSearchUrl({
    text: targetRole,
    city: query.city,
    workFormat: query.workFormat,
    experience: query.experience,
    employmentTypes: query.employmentTypes,
    salaryMin: query.salaryMin,
    professionalRoleIds: query.professionalRoleIds,
  });

  let broaderMarket: JobSearchResponse["broaderMarket"];
  if (results.length === 0 && query.city) {
    const [nationwide, remote] = await Promise.all([
      provider.search({ ...query, city: undefined }),
      provider.search({ ...query, city: undefined, workFormat: "REMOTE" }),
    ]);
    broaderMarket = { nationwideCount: nationwide.length, remoteCount: remote.length };
  }

  return { results: sortResults(results, sort), hhSearchUrl, providerName: provider.name, broaderMarket };
}

export const jobsService = {
  async search(userId: string, filters: JobSearchFiltersInput): Promise<JobSearchResponse> {
    return performSearch(
      userId,
      {
        targetRole: filters.targetRole,
        city: filters.city,
        workFormat: filters.workFormat,
        skills: filters.skills,
        experience: filters.experience,
        employmentTypes: filters.employmentTypes,
        salaryMin: filters.salaryMin,
        internshipOnly: filters.internshipOnly,
        professionalRoleIds: filters.professionalRoleIds,
        page: filters.page,
      },
      filters.targetRole,
      filters.sort
    );
  },

  /** Drives the dashboard "Recommended Jobs" widget and `GET /api/jobs` — uses stored preferences/profile, never an explicit user-typed query. */
  async recommend(userId: string) {
    const [profile, preferences, roadmap, recommendations] = await Promise.all([
      profileRepository.findByUserId(userId),
      jobPreferenceRepository.findByUserId(userId),
      roadmapRepository.findByUser(userId),
      careerRepository.listByUser(userId),
    ]);

    // `profile.goals` is deliberately NOT used here — it holds fixed
    // motivation keys from onboarding (e.g. "findFirstJob"), never a
    // profession title, so it can't stand in for one.
    const targetRole = roadmap?.careerTitle ?? recommendations[0]?.title ?? null;
    if (!targetRole) {
      await jobRepository.replaceForUser(userId, [], "MOCK");
      return jobRepository.listByUser(userId);
    }

    const experienceLevel = preferences?.experienceLevel ?? profile?.experienceLevel ?? null;
    const { results } = await performSearch(
      userId,
      {
        targetRole,
        city: preferences?.city ?? profile?.city ?? undefined,
        workFormat: preferences?.workFormat ?? profile?.preferredFormat ?? undefined,
        skills: preferences?.skills,
        experience: experienceLevelToHhExperience(experienceLevel),
        employmentTypes: (preferences?.employmentTypes as JobSearchQuery["employmentTypes"]) ?? undefined,
        salaryMin: preferences?.salaryExpectationMin ?? undefined,
        internshipOnly: preferences?.openToInternship ?? false,
      },
      targetRole,
      "bestMatch"
    );

    const top = results.slice(0, RECOMMENDED_COUNT);
    const provider = getJobsProvider();
    await jobRepository.replaceForUser(
      userId,
      top.map(({ vacancy, match }) => ({ ...vacancy, matchScore: match.score, matchBreakdown: match.breakdown })),
      providerNameToSource(provider.name)
    );

    return jobRepository.listByUser(userId);
  },

  getPreferences(userId: string) {
    return jobPreferenceRepository.findByUserId(userId);
  },

  updatePreferences(userId: string, data: JobPreferencesInput) {
    return jobPreferenceRepository.upsert(userId, data);
  },

  listSaved(userId: string) {
    return savedJobRepository.listByUser(userId);
  },

  saveJob(userId: string, data: SaveJobInput) {
    return savedJobRepository.create(userId, data as CreateSavedJobInput);
  },

  async updateSavedJobStatus(userId: string, savedJobId: string, status: SavedJobStatus, notes?: string) {
    const savedJob = await savedJobRepository.findById(savedJobId);
    if (!savedJob || savedJob.userId !== userId) throw new JobAccessError("not_found");
    return savedJobRepository.updateStatus(savedJobId, status, notes);
  },

  async deleteSavedJob(userId: string, savedJobId: string) {
    const savedJob = await savedJobRepository.findById(savedJobId);
    if (!savedJob || savedJob.userId !== userId) throw new JobAccessError("not_found");
    return savedJobRepository.delete(savedJobId);
  },

  async prepareForJob(userId: string, locale: Locale, vacancy: { title: string; company: string; requiredSkills: string[] }) {
    const timer = createTimer("jobs.prepareForJob");
    const [profile, roadmap, resumes] = await Promise.all([
      profileRepository.findByUserId(userId),
      roadmapRepository.findByUser(userId),
      resumeRepository.listByUser(userId),
    ]);
    timer.mark("read");

    const resumeContent = (resumes[0]?.content as unknown as ResumeContent | undefined) ?? null;
    const userSkills = [...(profile?.skills ?? []), ...(resumeContent?.skills ?? [])];
    const { matched, missing } = compareSkills(userSkills, vacancy.requiredSkills);

    const plan = await getAICareerService().generateJobPreparationPlan({
      locale,
      targetRole: roadmap?.careerTitle ?? vacancy.title,
      vacancyTitle: vacancy.title,
      company: vacancy.company,
      requiredSkills: vacancy.requiredSkills,
      matchedSkills: matched,
      missingSkills: missing,
      resumeSummary: resumeContent?.summary?.trim() || null,
    });
    timer.mark("ai");

    const resumeMatch = resumeContent
      ? computeResumeVacancyMatch(
          resumeContent.skills,
          [resumeContent.summary, resumeContent.careerObjective, ...resumeContent.experience.flatMap((e) => e.bullets)].filter(Boolean).join(" "),
          vacancy.requiredSkills
        )
      : null;
    timer.done();

    return { plan, matchedSkills: matched, missingSkills: missing, resumeMatch };
  },

  async parseSearchAssistantQuery(locale: Locale, freeText: string) {
    return getAICareerService().parseJobSearchQuery({ locale, freeText });
  },
};
