"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ReadinessResultData, ApplicationAnalyticsData, CoachContextSnapshotData } from "./types";

interface OverviewPanelProps {
  readiness: ReadinessResultData | null;
  applicationAnalytics: ApplicationAnalyticsData | null;
  nextActions: string[];
  context: CoachContextSnapshotData | null;
}

const DIMENSIONS = ["careerFit", "skillReadiness", "resumeQuality", "interviewReadiness", "jobMatch", "applicationProgress"] as const;

export function OverviewPanel({ readiness, applicationAnalytics, nextActions, context }: OverviewPanelProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.coachPage.overview;

  const insights: string[] = [];
  if (context?.skillGapPercent !== null && context?.skillGapPercent !== undefined && context.topMissingSkills.length > 0) {
    insights.push(`${dict.dashboard.coachPage.skillGap.missingLabel}: ${context.topMissingSkills.slice(0, 3).join(", ")} (${dict.dashboard.coachPage.skillGap.gapLabel.toLowerCase()} ${context.skillGapPercent}%)`);
  }
  if (context?.resumeScore !== null && context !== null && context.resumeScore! < 70) {
    insights.push(`${dict.dashboard.jobsPage.prepare.resumeMatchTitle}: ${context!.resumeScore}/100`);
  }
  if (applicationAnalytics?.lowInterviewConversion) {
    insights.push(page.lowConversionNote);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{page.readinessTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-xs">{page.readinessCaption}</p>
          {readiness ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{readiness.overall}%</span>
                <Progress value={readiness.overall} className="flex-1" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {DIMENSIONS.map((dim) => {
                  const value = readiness.breakdown[dim];
                  return (
                    <div key={dim} className="space-y-1">
                      <p className="text-muted-foreground text-xs">{page.breakdown[dim]}</p>
                      <p className="text-sm font-semibold">{value !== null ? `${value}%` : page.notEnoughData}</p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">{page.notEnoughData}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{page.nextActionTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {nextActions.length === 0 ? (
            <p className="text-muted-foreground text-sm">{page.nextActionEmpty}</p>
          ) : (
            <ol className="list-decimal space-y-1.5 pl-4 text-sm">
              {nextActions.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {applicationAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>{page.applicationsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold">{applicationAnalytics.applications}</p>
                <p className="text-muted-foreground text-xs">{page.applications}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{applicationAnalytics.interviews}</p>
                <p className="text-muted-foreground text-xs">{page.interviews}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{applicationAnalytics.offers}</p>
                <p className="text-muted-foreground text-xs">{page.offers}</p>
              </div>
            </div>
            {applicationAnalytics.hasEnoughData ? (
              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span>
                  {page.interviewRate}: {applicationAnalytics.interviewRate}%
                </span>
                <span>
                  {page.offerRate}: {applicationAnalytics.offerRate}%
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">{page.notEnoughApplicationData}</p>
            )}
          </CardContent>
        </Card>
      )}

      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{page.insightsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-4 text-sm">
              {insights.map((insight, i) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <Link href="/dashboard/jobs">
            {dict.dashboard.jobsCard.viewAllCta}
            <ArrowRight />
          </Link>
        }
      />
    </div>
  );
}
