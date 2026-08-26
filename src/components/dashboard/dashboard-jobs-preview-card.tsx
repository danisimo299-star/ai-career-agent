"use client";

import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WidgetHeader } from "./widget-header";
import { WidgetEmptyState } from "./widget-empty-state";
import { useLocale } from "@/lib/i18n/locale-provider";
import { formatSalary } from "@/lib/career/salary-format";
import { isSafeExternalUrl } from "@/lib/security/url-safety";

export interface DashboardJobPreviewItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  sourceUrl: string;
}

interface DashboardJobsPreviewCardProps {
  jobs: DashboardJobPreviewItem[];
}

const AVATAR_TONES = ["bg-tool-profile-solid text-white", "bg-tool-tasks-solid text-white", "bg-tool-resume-solid text-white"];

/** "Подходящие вакансии" — the same JobRecommendation rows the Jobs page already stores (a plain read, no live search triggered from the dashboard), as compact rows rather than the Jobs page's full detailed cards. */
export function DashboardJobsPreviewCard({ jobs }: DashboardJobsPreviewCardProps) {
  const { locale, dict } = useLocale();
  const j = dict.dashboard.jobsPreview;
  const salaryDict = dict.dashboard.jobsPage.card.salary;

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3 py-5">
        <div className="flex items-center justify-between">
          <WidgetHeader icon={Briefcase} title={j.title} />
          <Link href="/dashboard/jobs" className="text-muted-foreground hover:text-foreground text-xs font-medium">
            {j.viewAllCta}
          </Link>
        </div>

        {jobs.length === 0 ? (
          <WidgetEmptyState icon={Briefcase} title={j.emptyTitle} description={j.emptyDescription} cta={{ label: j.viewAllCta, href: "/dashboard/jobs" }} />
        ) : (
          <div className="flex flex-1 flex-col gap-1">
            {jobs.map((job, i) => {
              const salary = formatSalary(job.salaryMin ?? undefined, job.salaryMax ?? undefined, job.currency ?? undefined, locale);
              const salaryLabel =
                salary.kind === "range"
                  ? salaryDict.range.replace("{min}", salary.min!).replace("{max}", salary.max!).replace("{currency}", salary.currencySymbol ?? "")
                  : salary.kind === "from"
                    ? salaryDict.from.replace("{min}", salary.min!).replace("{currency}", salary.currencySymbol ?? "")
                    : salary.kind === "to"
                      ? salaryDict.to.replace("{max}", salary.max!).replace("{currency}", salary.currencySymbol ?? "")
                      : salaryDict.undisclosed;
              const canOpen = isSafeExternalUrl(job.sourceUrl);
              const Row = (
                <span className="hover:bg-accent -mx-1.5 flex items-center gap-2.5 rounded-md px-1.5 py-2 transition-colors duration-150">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}>
                    {job.company.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{job.title}</span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""}
                    </span>
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">{salaryLabel}</span>
                </span>
              );
              return canOpen ? (
                <a key={job.id} href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {Row}
                </a>
              ) : (
                <Link key={job.id} href="/dashboard/jobs">
                  {Row}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
