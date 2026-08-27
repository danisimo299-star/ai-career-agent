import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { jobsService } from "@/server/services/jobs.service";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import { careerRepository } from "@/server/repositories/career.repository";
import { profileRepository } from "@/server/repositories/profile.repository";
import { JobsView } from "@/components/jobs/jobs-view";
import type { JobSearchResultItemData, SavedJobData } from "@/components/jobs/types";

interface JobsPageProps {
  searchParams: Promise<{ role?: string; city?: string; roleId?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const [roadmap, recommendations, profile, savedJobs, params] = await Promise.all([
    roadmapRepository.findByUser(user.id),
    careerRepository.listByUser(user.id),
    profileRepository.findByUserId(user.id),
    jobsService.listSaved(user.id),
    searchParams,
  ]);

  // `profile.goals` deliberately isn't used as a fallback — it holds fixed
  // onboarding motivation keys (e.g. "findFirstJob"), never a profession title.
  const defaultTargetRole = params.role || roadmap?.careerTitle || recommendations[0]?.title || "";
  const defaultCity = params.city || profile?.city || undefined;
  // A validated recommendation already resolved to a real HH professional
  // role (see `career-market.service.ts`) — reuse that id here so Jobs opens
  // the exact same, already-checked market entity instead of re-guessing
  // from free text (item 18/39 of the market-reality brief).
  const matchingRecommendation = recommendations.find((rec) => rec.title === defaultTargetRole);
  const defaultRoleId = params.roleId ? Number(params.roleId) : (matchingRecommendation?.hhProfessionalRoleId ?? undefined);

  const initial = defaultTargetRole
    ? await jobsService.search(user.id, {
        targetRole: defaultTargetRole,
        city: defaultCity,
        professionalRoleIds: defaultRoleId ? [defaultRoleId] : undefined,
        sort: "bestMatch",
      })
    : { results: [], hhSearchUrl: "", providerName: "mock" };

  return (
    <JobsView
      initialResults={initial.results as unknown as JobSearchResultItemData[]}
      initialHhSearchUrl={initial.hhSearchUrl}
      initialProviderName={initial.providerName}
      initialBroaderMarket={initial.broaderMarket ?? null}
      initialSavedJobs={
        savedJobs.map((job) => ({
          ...job,
          savedAt: job.savedAt.toISOString(),
          statusUpdatedAt: job.statusUpdatedAt.toISOString(),
          matchBreakdown: job.matchBreakdown as unknown as SavedJobData["matchBreakdown"],
        })) as SavedJobData[]
      }
      defaultTargetRole={defaultTargetRole}
      defaultCity={defaultCity}
    />
  );
}
