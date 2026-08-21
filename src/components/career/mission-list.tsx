"use client";

import { motion } from "motion/react";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MissionKey } from "@/lib/career/missions";

export interface MissionData {
  id: string;
  key: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}

export function MissionList({ missions }: { missions: MissionData[] }) {
  const { dict } = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.missions.title}</CardTitle>
        <CardDescription>{dict.missions.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {missions.map((mission, index) => {
          const isDone = mission.status === "COMPLETED";
          const catalog = dict.missions.catalog[mission.key as MissionKey];
          if (!catalog) return null;

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                isDone ? "bg-muted/40" : "bg-background"
              )}
            >
              {isDone ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
              ) : (
                <Circle className="text-muted-foreground mt-0.5 size-5 shrink-0" />
              )}
              <div className="flex-1 space-y-0.5">
                <p className={cn("text-sm font-medium", isDone && "text-muted-foreground line-through")}>
                  {catalog.title}
                </p>
                <p className="text-muted-foreground text-xs">{catalog.description}</p>
              </div>
              <Badge variant={isDone ? "default" : "secondary"}>
                {isDone ? dict.missions.status.completed : dict.missions.status.inProgress}
              </Badge>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
