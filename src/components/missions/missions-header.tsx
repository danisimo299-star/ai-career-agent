"use client";

import { Target, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface MissionsHeaderProps {
  careerTitle: string | null;
  careerScore: number;
  roadmapProgressPercent: number;
  currentMilestoneTitle: string | null;
  streakDays?: number;
}

export function MissionsHeader({ careerTitle, careerScore, roadmapProgressPercent, currentMilestoneTitle, streakDays = 0 }: MissionsHeaderProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.missionsPage;

  return (
    <div className="space-y-4">
      <PageHeader title={page.title} description={page.subtitle} icon={Target} tone="tasks" />

      {careerTitle && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-5">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">{page.careerLabel}</p>
              <p className="text-base leading-snug font-semibold break-words">{careerTitle}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{dict.dashboard.roadmapPage.careerScoreLabel}</p>
              <p className="text-base font-semibold">{careerScore} / 100</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{dict.dashboard.roadmapPage.progressLabel}</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold">{roadmapProgressPercent}%</p>
                <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                  <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${roadmapProgressPercent}%` }} />
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">{page.currentMilestoneLabel}</p>
              <p className="text-base leading-snug font-semibold break-words">{currentMilestoneTitle ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{page.streakLabel}</p>
              <p className={cn("flex items-center gap-1 text-base font-semibold", streakDays > 0 && "text-tool-resume")}>
                <Flame className={cn("size-4", streakDays === 0 && "text-muted-foreground")} />
                {page.streakTemplate.replace("{days}", String(streakDays))}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
