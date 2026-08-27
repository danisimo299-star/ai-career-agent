"use client";

import { Clock, Target, Lightbulb, Sparkles, ListChecks, RotateCw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MissionStatusBadge } from "./mission-status-badge";
import { ResourceItem } from "@/components/roadmap/resource-item";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { CareerMissionData } from "./types";

interface MissionDetailSheetProps {
  mission: CareerMissionData | null;
  onOpenChange: (open: boolean) => void;
  onStart: (missionId: string) => void;
  onComplete: (missionId: string) => void;
  onSkip: (missionId: string) => void;
  onRegenerate: (missionId: string) => void;
  busy?: boolean;
}

export function MissionDetailSheet({
  mission,
  onOpenChange,
  onStart,
  onComplete,
  onSkip,
  onRegenerate,
  busy,
}: MissionDetailSheetProps) {
  return (
    <Sheet open={mission !== null} onOpenChange={onOpenChange}>
      {mission && (
        <MissionDetailContent
          mission={mission}
          onStart={onStart}
          onComplete={onComplete}
          onSkip={onSkip}
          onRegenerate={onRegenerate}
          busy={busy}
        />
      )}
    </Sheet>
  );
}

function MissionDetailContent({
  mission,
  onStart,
  onComplete,
  onSkip,
  onRegenerate,
  busy,
}: {
  mission: CareerMissionData;
  onStart: (missionId: string) => void;
  onComplete: (missionId: string) => void;
  onSkip: (missionId: string) => void;
  onRegenerate: (missionId: string) => void;
  busy?: boolean;
}) {
  const { dict } = useLocale();
  const page = dict.dashboard.missionsPage;
  const isTerminal = mission.status === "COMPLETED" || mission.status === "SKIPPED" || mission.status === "EXPIRED";

  return (
    <SheetContent className="flex flex-col overflow-y-auto sm:max-w-md">
      <SheetHeader>
        <div className="flex items-center gap-2">
          <SheetTitle>{mission.title}</SheetTitle>
          <MissionStatusBadge status={mission.status} />
        </div>
        <SheetDescription>{mission.description}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">{dict.dashboard.roadmapPage.durationLabel}</p>
              <p className="font-medium">{page.estimatedTimeTemplate.replace("{minutes}", String(mission.estimatedMinutes))}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Target className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">{page.goalLabel}</p>
              <p className="font-medium">{mission.goal}</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <Lightbulb className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-muted-foreground text-xs">{dict.dashboard.roadmapPage.whyItMattersLabel}</p>
            <p>{mission.whyItMatters}</p>
          </div>
        </div>

        {mission.skill && (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs">{page.skillLabel}</p>
            <Badge variant="secondary">{mission.skill}</Badge>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <ListChecks className="size-3.5" />
            {page.instructionsLabel}
          </p>
          <ol className="space-y-1.5 text-sm">
            {mission.instructions.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {mission.resources.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs">{dict.dashboard.roadmapPage.resourcesLabel}</p>
            <div className="space-y-1.5">
              {mission.resources.map((resource) => (
                <ResourceItem key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 text-sm">
          <Sparkles className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-muted-foreground text-xs">{dict.dashboard.roadmapPage.expectedResultLabel}</p>
            <p>{mission.expectedResult}</p>
          </div>
        </div>
      </div>

      {!isTerminal && (
        <SheetFooter className="gap-2">
          {mission.status === "AVAILABLE" && (
            <Button onClick={() => onStart(mission.id)} disabled={busy}>
              {page.startCta}
            </Button>
          )}
          {mission.status === "IN_PROGRESS" && (
            <Button onClick={() => onComplete(mission.id)} disabled={busy}>
              {page.completeCta}
            </Button>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="sm:flex-1" onClick={() => onSkip(mission.id)} disabled={busy}>
              {page.skipCta}
            </Button>
            <Button variant="outline" className="sm:flex-1" onClick={() => onRegenerate(mission.id)} disabled={busy}>
              {busy && <RotateCw className="animate-spin" />}
              {page.regenerateCta}
            </Button>
          </div>
        </SheetFooter>
      )}
    </SheetContent>
  );
}
