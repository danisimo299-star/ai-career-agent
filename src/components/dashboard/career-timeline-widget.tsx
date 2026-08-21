"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { careerTimelineStages, careerTimelineCurrentIndex } from "@/lib/demo/dashboard-demo";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { MilestoneListData } from "@/components/roadmap/types";

interface TimelineEntry {
  key: string;
  label: string;
  isCurrent: boolean;
  isPast: boolean;
}

export function CareerTimelineWidget({ milestones }: { milestones?: MilestoneListData[] }) {
  const { dict } = useLocale();

  const entries: TimelineEntry[] =
    milestones && milestones.length > 0
      ? milestones.map((m) => ({
          key: m.id,
          label: m.title,
          isCurrent: m.status === "IN_PROGRESS",
          isPast: m.status === "COMPLETED",
        }))
      : careerTimelineStages.map((stage, index) => ({
          key: stage,
          label: dict.dashboard.timeline.stages[stage],
          isCurrent: index === careerTimelineCurrentIndex,
          isPast: index < careerTimelineCurrentIndex,
        }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.dashboard.timeline.title}</CardTitle>
        <CardDescription>{dict.dashboard.timeline.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative ml-3 space-y-6 border-l pl-6">
          {entries.map((entry, index) => (
            <motion.li
              key={entry.key}
              className="relative"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <span
                className={cn(
                  "absolute top-1 -left-[27px] flex size-3.5 items-center justify-center rounded-full border-2",
                  entry.isCurrent
                    ? "border-primary bg-primary"
                    : entry.isPast
                      ? "border-primary bg-primary/40"
                      : "border-muted-foreground/30 bg-background"
                )}
              >
                {entry.isCurrent && (
                  <motion.span
                    className="border-primary absolute inset-0 rounded-full border"
                    animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </span>
              <span className={cn("text-sm", entry.isCurrent ? "text-foreground font-semibold" : "text-muted-foreground")}>
                {entry.label}
              </span>
            </motion.li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
