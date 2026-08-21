"use client";

import Link from "next/link";
import { Target, Clock, Flame, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MissionStatusBadge } from "@/components/missions/mission-status-badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { CareerMissionData } from "@/components/missions/types";

interface TodayMissionCardProps {
  mission: CareerMissionData | null;
  hasRoadmap: boolean;
  hasActiveMissions: boolean;
  streak: number;
}

export function TodayMissionCard({ mission, hasRoadmap, hasActiveMissions, streak }: TodayMissionCardProps) {
  const { dict } = useLocale();
  const card = dict.dashboard.missionsCard;
  const page = dict.dashboard.missionsPage;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="text-primary size-4" />
          {card.title}
        </CardTitle>
        {streak > 0 && (
          <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
            <Flame className="size-3.5 text-orange-500" />
            {card.streakTemplate.replace("{days}", String(streak))}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasRoadmap ? (
          <>
            <p className="text-muted-foreground text-sm">{card.noMissions}</p>
            <Button size="sm" nativeButton={false} render={<Link href="/dashboard/roadmap">{card.noRoadmapCta}</Link>} />
          </>
        ) : mission ? (
          <>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{mission.title}</p>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {page.estimatedTimeTemplate.replace("{minutes}", String(mission.estimatedMinutes))}
                </span>
                <MissionStatusBadge status={mission.status} />
              </div>
            </div>
            <Button
              size="sm"
              className="w-full"
              nativeButton={false}
              render={
                <Link href="/dashboard/missions">
                  {card.startCta}
                  <ArrowRight />
                </Link>
              }
            />
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">{hasActiveMissions ? card.allDone : card.noMissions}</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              nativeButton={false}
              render={
                <Link href="/dashboard/missions">
                  {card.viewCta}
                  <ArrowRight />
                </Link>
              }
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
