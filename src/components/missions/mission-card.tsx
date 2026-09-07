"use client";

import { Clock, Sparkles, CheckCircle2 } from "lucide-react";
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
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(mission.id);
        }
      }}
      className={cn(
        "min-w-0 cursor-pointer break-words transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-ring",
        isDone && "bg-muted/40",
        isSkippedOrExpired && "opacity-60"
      )}
    >
      <CardHeader className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg",
              isDone ? "bg-tool-tasks-solid text-white" : "bg-tool-chat-solid text-white"
            )}
          >
            {isDone ? <CheckCircle2 className="size-3.5" /> : <Sparkles className="size-3.5" />}
          </span>
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
