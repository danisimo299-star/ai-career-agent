"use client";

import Link from "next/link";
import { Map, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import { computeRoadmapProgress } from "@/lib/career/roadmap-progress";
import type { RoadmapData } from "@/components/roadmap/types";

export function RoadmapProgressCard({ roadmap }: { roadmap: RoadmapData | null }) {
  const { dict } = useLocale();
  const card = dict.dashboard.roadmapCard;

  if (!roadmap) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="text-primary size-4" />
            {card.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">{card.noRoadmap}</p>
          <Button size="sm" nativeButton={false} render={<Link href="/dashboard/roadmap">{card.startCta}</Link>} />
        </CardContent>
      </Card>
    );
  }

  const progress = computeRoadmapProgress(roadmap.milestones);
  const nextMilestone = roadmap.milestones.find((m) => m.status !== "COMPLETED");
  const nextTask = nextMilestone?.tasks.find((t) => !t.completed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="text-primary size-4" />
          {card.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">{roadmap.careerTitle}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
              <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress.percent}%` }} />
            </div>
            <span className="text-muted-foreground text-xs">{progress.percent}%</span>
          </div>
        </div>

        {nextMilestone ? (
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground text-xs">{card.nextMilestoneLabel}</p>
            <p className="font-medium">{nextMilestone.title}</p>
            {nextTask && (
              <>
                <p className="text-muted-foreground text-xs">{card.nextTaskLabel}</p>
                <p>{nextTask.title}</p>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm font-medium">{card.allDone}</p>
        )}

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={
            <Link href="/dashboard/roadmap">
              {card.continueCta}
              <ArrowRight />
            </Link>
          }
        />
      </CardContent>
    </Card>
  );
}
