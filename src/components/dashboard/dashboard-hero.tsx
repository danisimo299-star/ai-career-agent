"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { CoachCard } from "@/components/dashboard/coach-card";
import { CareerJourney, type JourneyStageKey, type JourneyStageStatus } from "@/components/dashboard/career-journey";
import { ProactiveInsightBanner } from "@/components/coach/proactive-insight-banner";

interface DashboardHeroProps {
  userName?: string | null;
  targetRole: string | null;
  readiness: number | null;
  nextActionTitle: string | null;
  nextActionWhy: string | null;
  jobCount: number;
  journey: { key: JourneyStageKey; status: JourneyStageStatus }[];
  proactiveInsight: { skill: string; jobCount: number } | null;
}

function readinessBucket(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/** Starts with the time-agnostic fallback for the first paint (avoids an SSR/client hydration mismatch, since the server doesn't know the user's local hour), then swaps to the real time-of-day greeting once mounted. */
function useTimeOfDayGreeting(dict: Dictionary, userName?: string | null): string {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHour(new Date().getHours()));
    return () => cancelAnimationFrame(id);
  }, []);

  const g = dict.dashboard.greeting;
  const template = hour === null ? g.fallback : hour < 12 ? g.morning : hour < 18 ? g.afternoon : g.evening;
  return userName ? template.replace("{name}", userName) : template.replace(/,?\s*\{name\}/, "");
}

export function DashboardHero({ userName, targetRole, readiness, nextActionTitle, nextActionWhy, jobCount, journey, proactiveInsight }: DashboardHeroProps) {
  const { dict } = useLocale();
  const hero = dict.dashboard.hero;
  const greeting = useTimeOfDayGreeting(dict, userName);

  // Starts at 0 and jumps to the real value one tick after mount so the
  // Progress bar's own `transition-all` animates the fill on first paint.
  const [animatedReadiness, setAnimatedReadiness] = useState(0);
  useEffect(() => {
    if (readiness === null) return;
    const id = requestAnimationFrame(() => setAnimatedReadiness(readiness));
    return () => cancelAnimationFrame(id);
  }, [readiness]);

  if (!targetRole) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{greeting} 👋</h1>
          <p className="text-muted-foreground mx-auto max-w-md">{hero.noGoalDescription}</p>
          <Button nativeButton={false} render={<Link href="/dashboard/career-analysis">{hero.exploreCareersCta}</Link>} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{greeting} 👋</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">{dict.dashboard.greeting.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Career goal — large cell */}
        <Card className="hover-lift ring-primary/15 bg-gradient-to-br from-primary/5 to-transparent ring-1 sm:col-span-2">
          <CardContent className="flex h-full flex-col justify-center py-6">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{hero.goalLabel}</p>
            <p className="mt-1 text-xl font-semibold sm:text-2xl">{targetRole}</p>
          </CardContent>
        </Card>

        {/* Readiness — small cell */}
        <Card className="hover-lift">
          <CardContent className="flex h-full flex-col justify-center gap-1.5 py-6">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{hero.readinessLabel}</span>
            <span className="text-2xl font-bold">{readiness !== null ? `${readiness}%` : "—"}</span>
            {readiness !== null && <Progress value={animatedReadiness} />}
            {readiness !== null && (
              <p className="text-muted-foreground text-xs">{hero.readinessMessage[readinessBucket(readiness)]}</p>
            )}
          </CardContent>
        </Card>

        {/* Next best action — large cell */}
        <Card className="hover-lift sm:col-span-2">
          <CardContent className="flex h-full flex-col justify-center gap-2 py-6">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{hero.nextActionLabel}</p>
            {nextActionTitle ? (
              <>
                <p className="font-semibold">{nextActionTitle}</p>
                {nextActionWhy && (
                  <p className="text-muted-foreground text-sm">
                    <span className="font-medium">{hero.whyLabel}</span> {nextActionWhy}
                  </p>
                )}
                <Button size="sm" className="w-fit" nativeButton={false} render={<Link href="/dashboard/coach">{hero.startCta}</Link>} />
              </>
            ) : (
              <p className="text-muted-foreground text-sm">{hero.nextActionEmpty}</p>
            )}
          </CardContent>
        </Card>

        {/* Job matches — small cell */}
        <Card className="hover-lift">
          <CardContent className="flex h-full flex-col justify-center gap-2 py-6">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{hero.recommendedForYouLabel}</p>
            <p className="font-semibold">{jobCount > 0 ? hero.recommendedJobsTemplate.replace("{count}", String(jobCount)) : hero.recommendedJobsEmpty}</p>
            <Button size="sm" variant="outline" className="w-fit" nativeButton={false} render={<Link href="/dashboard/jobs">{hero.viewJobsCta}</Link>} />
          </CardContent>
        </Card>

        {/* AI Coach teaser — large banner cell */}
        <div className="sm:col-span-3">
          <CoachCard readiness={readiness} nextActionTitle={nextActionTitle} />
        </div>
      </div>

      {proactiveInsight && <ProactiveInsightBanner targetRole={targetRole} insight={proactiveInsight} />}

      <CareerJourney stages={journey} />
    </div>
  );
}
