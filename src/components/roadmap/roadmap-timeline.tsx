"use client";

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Circle, Lock, PlayCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import { computeMilestoneProgress } from "@/lib/career/roadmap-progress";
import type { MilestoneListData } from "./types";

const statusIcon = {
  LOCKED: Lock,
  AVAILABLE: Circle,
  IN_PROGRESS: PlayCircle,
  COMPLETED: CheckCircle2,
};

export function RoadmapTimeline({
  milestones,
  onSelect,
}: {
  milestones: MilestoneListData[];
  onSelect: (milestoneId: string) => void;
}) {
  const { dict } = useLocale();
  const page = dict.dashboard.roadmapPage;

  return (
    <ol className="relative ml-4 space-y-4 border-l pl-6">
      {milestones.map((milestone, index) => {
        const Icon = statusIcon[milestone.status];
        const progress = computeMilestoneProgress(milestone);
        const isCurrent = milestone.status === "IN_PROGRESS";
        const isLocked = milestone.status === "LOCKED";

        return (
          <motion.li
            key={milestone.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="relative"
          >
            <span
              className={cn(
                "absolute top-3 -left-[31px] flex size-4 items-center justify-center rounded-full border-2 bg-background",
                milestone.status === "COMPLETED" && "border-tool-tasks bg-tool-tasks text-primary-foreground",
                milestone.status === "IN_PROGRESS" && "border-tool-chat",
                milestone.status === "AVAILABLE" && "border-muted-foreground/40",
                milestone.status === "LOCKED" && "border-muted-foreground/20"
              )}
            >
              {isCurrent && (
                <motion.span
                  className="border-tool-chat absolute inset-0 rounded-full border"
                  animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </span>

            <button
              type="button"
              onClick={() => onSelect(milestone.id)}
              disabled={isLocked}
              className={cn(
                "hover-lift flex w-full items-center gap-3 rounded-lg border p-3 text-left",
                isLocked ? "cursor-not-allowed opacity-60" : "hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={milestone.status}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="shrink-0"
                >
                  <Icon
                    className={cn(
                      "size-5",
                      milestone.status === "COMPLETED" && "text-tool-tasks",
                      milestone.status === "IN_PROGRESS" && "text-tool-chat",
                      milestone.status !== "COMPLETED" && milestone.status !== "IN_PROGRESS" && "text-muted-foreground"
                    )}
                  />
                </motion.span>
              </AnimatePresence>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {index + 1}. {milestone.title}
                  </span>
                </div>
                <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="text-xs">
                    {page.milestoneStatus[milestone.status]}
                  </Badge>
                  {progress.total > 0 && (
                    <span>{page.tasksProgressTemplate.replace("{completed}", String(progress.completed)).replace("{total}", String(progress.total))}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            </button>
          </motion.li>
        );
      })}
    </ol>
  );
}
