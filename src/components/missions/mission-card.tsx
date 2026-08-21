"use client";

import { Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MissionStatusBadge } from "./mission-status-badge";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { CareerMissionData } from "./types";

interface MissionCardProps {
  mission: CareerMissionData;
  variant: "main" | "secondary";
  onOpen: (missionId: string) => void;
}

export function MissionCard({ mission, variant, onOpen }: MissionCardProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.missionsPage;
  const isMain = variant === "main";
  const isDone = mission.status === "COMPLETED";
  const isSkippedOrExpired = mission.status === "SKIPPED" || mission.status === "EXPIRED";

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(mission.id)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(mission.id)}
      className={cn(
        "cursor-pointer transition-colors hover:border-primary/40",
        isDone && "bg-muted/40",
        isSkippedOrExpired && "opacity-60"
      )}
    >
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isMain && <Sparkles className="text-primary size-4 shrink-0" />}
          <CardTitle className={cn(isMain ? "text-base" : "text-sm", isDone && "text-muted-foreground line-through")}>
            {mission.title}
          </CardTitle>
        </div>
        <MissionStatusBadge status={mission.status} />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">{mission.description}</p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {page.estimatedTimeTemplate.replace("{minutes}", String(mission.estimatedMinutes))}
          </span>
          <Badge variant="secondary" className="text-xs">
            {dict.dashboard.careerAnalysisPage.difficultyLevel[mission.difficulty]}
          </Badge>
          {mission.skill && (
            <Badge variant="secondary" className="text-xs">
              {mission.skill}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
