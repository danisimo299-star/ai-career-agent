"use client";

import { motion } from "motion/react";
import { CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { CareerMissionData } from "./types";

export interface MissionHistoryEntry extends CareerMissionData {
  missionDate: string;
}

export function MissionHistory({ history }: { history: MissionHistoryEntry[] }) {
  const { dict } = useLocale();
  const page = dict.dashboard.missionsPage;

  const relevant = history.filter((m) => m.status === "COMPLETED" || m.status === "SKIPPED" || m.status === "EXPIRED");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{page.historyTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {relevant.length === 0 ? (
          <p className="text-muted-foreground text-sm">{page.historyEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {relevant.map((mission, i) => {
              const isDone = mission.status === "COMPLETED";
              const Icon = isDone ? CheckCircle2 : mission.status === "EXPIRED" ? Clock3 : XCircle;
              return (
                <motion.li
                  key={mission.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03, ease: "easeOut" }}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <Icon className={cn("size-4 shrink-0", isDone ? "text-tool-tasks" : "text-muted-foreground")} />
                  <span className={cn(isDone ? "" : "text-muted-foreground line-through")}>{mission.title}</span>
                </motion.li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
