"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { JOURNEY_STAGE_HREF, type JourneyStageKey } from "@/lib/career/journey";
import type { ScoreStrengthKey, ScoreMissingKey } from "@/lib/career/score";

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

interface DashboardHeroProps {
  userName?: string | null;
  nextStepKey: JourneyStageKey;
  profilePercent: number | null;
  strengths: ScoreStrengthKey[];
  missing: ScoreMissingKey[];
}

/**
 * The dashboard's one wide anchor: greeting + next action on the left, a
 * readiness summary on the right — a big number and a slim linear bar
 * instead of a ring, so it never crowds neighboring text at narrower
 * widths. Still backed by the same real career-score data the rest of the
 * app already computes.
 */
export function DashboardHero({ userName, nextStepKey, profilePercent, strengths, missing }: DashboardHeroProps) {
  const { dict } = useLocale();
  const greeting = useTimeOfDayGreeting(dict, userName);
  const hero = dict.dashboard.hero;
  const score = dict.dashboard.careerScore;
  const stage = dict.dashboard.nextStep.stages[nextStepKey];
  const percent = profilePercent ?? 0;

  return (
    <Card className="profymind-glow">
      <CardContent className="grid gap-6 py-6 lg:grid-cols-2 lg:items-center">
        <div className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting} 👋</h1>
            <p className="text-muted-foreground text-sm">{dict.dashboard.greeting.subtitle}</p>
          </div>
          <div className="border-border/70 space-y-1.5 rounded-lg border p-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{hero.nextStepLabel}</p>
            <p className="text-base font-semibold">{stage.title}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">{stage.description}</p>
            <Button
              size="sm"
              nativeButton={false}
              render={
                <Link href={JOURNEY_STAGE_HREF[nextStepKey]}>
                  {stage.cta}
                  <ArrowRight />
                </Link>
              }
            />
          </div>
        </div>

        <div className="border-border/70 space-y-4 rounded-lg border p-4 lg:border-0 lg:p-0">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold">{score.title}</p>
              <p className="text-2xl font-bold tabular-nums">{percent}%</p>
            </div>
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div className="bg-primary h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${percent}%` }} />
            </div>
          </div>

          {strengths.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{hero.strengthsLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {strengths.map((key) => (
                  <Badge key={key} variant="success" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    {score.strengthItems[key]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {missing.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{hero.improveLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((key) => (
                  <Badge key={key} variant="warning" className="gap-1">
                    <XCircle className="size-3" />
                    {score.missingItems[key]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
