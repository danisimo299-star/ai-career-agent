"use client";

import { Clock, Target, Lightbulb, Sparkles, Lock } from "lucide-react";
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
import { TaskItem } from "./task-item";
import { useLocale } from "@/lib/i18n/locale-provider";
import { computeMilestoneProgress } from "@/lib/career/roadmap-progress";
import type { MilestoneListData } from "./types";

interface MilestoneDetailSheetProps {
  milestone: MilestoneListData | null;
  onOpenChange: (open: boolean) => void;
  onStartMilestone: (milestoneId: string) => void;
  onToggleTask: (taskId: string, completed: boolean) => void;
  starting?: boolean;
}

export function MilestoneDetailSheet({
  milestone,
  onOpenChange,
  onStartMilestone,
  onToggleTask,
  starting,
}: MilestoneDetailSheetProps) {
  return (
    <Sheet open={milestone !== null} onOpenChange={onOpenChange}>
      {milestone && <MilestoneDetailContent milestone={milestone} onStartMilestone={onStartMilestone} onToggleTask={onToggleTask} starting={starting} />}
    </Sheet>
  );
}

function MilestoneDetailContent({
  milestone,
  onStartMilestone,
  onToggleTask,
  starting,
}: {
  milestone: MilestoneListData;
  onStartMilestone: (milestoneId: string) => void;
  onToggleTask: (taskId: string, completed: boolean) => void;
  starting?: boolean;
}) {
  const { dict } = useLocale();
  const page = dict.dashboard.roadmapPage;
  const progress = computeMilestoneProgress(milestone);
  const isLocked = milestone.status === "LOCKED";

  return (
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{milestone.title}</SheetTitle>
            <Badge variant={milestone.status === "COMPLETED" ? "default" : "secondary"}>
              {page.milestoneStatus[milestone.status]}
            </Badge>
          </div>
          <SheetDescription>{milestone.description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          {isLocked ? (
            <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm">
              <Lock className="size-4 shrink-0" />
              {page.lockedNote}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Clock className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">{page.durationLabel}</p>
                    <p className="font-medium">{page.durationWeeksTemplate.replace("{weeks}", String(milestone.estimatedWeeks))}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">{page.tasksLabel}</p>
                    <p className="font-medium">{page.tasksProgressTemplate.replace("{completed}", String(progress.completed)).replace("{total}", String(progress.total))}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <Lightbulb className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">{page.whyItMattersLabel}</p>
                  <p>{milestone.whyItMatters}</p>
                </div>
              </div>

              {milestone.skills.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs">{page.skillsLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {milestone.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">{page.tasksLabel}</p>
                <div className="space-y-2">
                  {milestone.tasks.map((task) => (
                    <TaskItem key={task.id} task={task} onToggle={onToggleTask} />
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <Sparkles className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">{page.expectedResultLabel}</p>
                  <p>{milestone.expectedResult}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {milestone.status === "AVAILABLE" && (
          <SheetFooter>
            <Button onClick={() => onStartMilestone(milestone.id)} disabled={starting}>
              {page.startMilestoneCta}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
  );
}
