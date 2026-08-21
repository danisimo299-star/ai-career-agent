"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-provider";

interface MissionsHeaderProps {
  careerTitle: string | null;
  careerScore: number;
  roadmapProgressPercent: number;
  currentMilestoneTitle: string | null;
}

export function MissionsHeader({ careerTitle, careerScore, roadmapProgressPercent, currentMilestoneTitle }: MissionsHeaderProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.missionsPage;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
        <p className="text-muted-foreground text-sm">{page.subtitle}</p>
      </div>

      {careerTitle && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-xs">{page.careerLabel}</p>
              <p className="truncate text-base font-semibold">{careerTitle}</p>
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
            <div>
              <p className="text-muted-foreground text-xs">{page.currentMilestoneLabel}</p>
              <p className="truncate text-base font-semibold">{currentMilestoneTitle ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
