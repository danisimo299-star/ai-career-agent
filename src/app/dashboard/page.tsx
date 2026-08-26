import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDashboardSummary } from "@/server/services/dashboard.service";
import { jobRepository } from "@/server/repositories/job.repository";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user?.id) return null;

  const locale = await getLocale();
  const [summary, jobs] = await Promise.all([getDashboardSummary(user.id, locale), jobRepository.listByUser(user.id)]);

  return (
    <DashboardOverview
      userName={user.name}
      {...summary}
      jobs={jobs.slice(0, 3).map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        currency: j.currency,
        sourceUrl: j.sourceUrl,
      }))}
    />
  );
}
