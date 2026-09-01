"use client";

import Link from "next/link";
import { RotateCw, Briefcase, Search, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ProgressResult } from "@/lib/career/roadmap-progress";

interface RoadmapHeaderProps {
  careerTitle: string;
  careerScore: number;
  progress: ProgressResult;
  estimatedRange: { min: number; max: number };
  onChangeCareer: () => void;
  onRegenerate: () => void;
  disabled?: boolean;
}

export function RoadmapHeader({
  careerTitle,
  careerScore,
  progress,
  estimatedRange,
  onChangeCareer,
  onRegenerate,
  disabled,
}: RoadmapHeaderProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.roadmapPage;

  return (
    <div className="space-y-4">
      <PageHeader
        title={page.title}
        description={page.subtitle}
        icon={Map}
        tone="roadmap"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/dashboard/jobs?role=${encodeURIComponent(careerTitle)}`}>
                  <Search />
                  {page.findJobsCta}
                </Link>
              }
            />
            <Button variant="outline" size="sm" onClick={onChangeCareer} disabled={disabled}>
              <Briefcase />
              {page.changeCareerCta}
            </Button>
            <Button variant="outline" size="sm" onClick={onRegenerate} disabled={disabled}>
              <RotateCw className={disabled ? "animate-spin" : undefined} />
              {page.regenerateCta}
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">{page.goalLabel}</p>
            {/* The actual career goal, not a fixed label — wraps rather
                than ellipsis-cutting a real (possibly long) job title. */}
            <p className="text-base leading-snug font-semibold break-words">{careerTitle}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{page.careerScoreLabel}</p>
            <p className="text-base font-semibold">{careerScore} / 100</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{page.progressLabel}</p>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold">{progress.percent}%</p>
              <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{page.estimatedTimeLabel}</p>
            <p className="text-base font-semibold">
              {page.estimatedTimeTemplate.replace("{min}", String(estimatedRange.min)).replace("{max}", String(estimatedRange.max))}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
