"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Circle, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WidgetHeader } from "./widget-header";
import { WidgetEmptyState } from "./widget-empty-state";
import { ProgressRing } from "./progress-ring";
import { useLocale } from "@/lib/i18n/locale-provider";

export interface ThisWeekTaskItem {
  id: string;
  title: string;
}

interface WeeklyFocusPreviewProps {
  milestoneTitle: string | null;
  tasks: ThisWeekTaskItem[];
  percent: number | null;
}

/**
 * "Фокус этой недели" — the roadmap's current milestone, checklist-style.
 * The first task gets a real, working checkbox (closing it out doesn't
 * require leaving the page); the rest stay read-only bullets — full
 * editing still lives on the Roadmap page itself.
 */
export function WeeklyFocusPreview({ milestoneTitle, tasks, percent }: WeeklyFocusPreviewProps) {
  const { dict } = useLocale();
  const w = dict.dashboard.thisWeek;
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const visibleTasks = tasks.filter((t) => !doneIds.has(t.id));

  const completeTask = async (taskId: string) => {
    setPendingId(taskId);
    setDoneIds((prev) => new Set(prev).add(taskId));
    try {
      const response = await fetch(`/api/roadmap/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      if (!response.ok) throw new Error("failed");
    } catch {
      toast.error(w.toggleError);
      setDoneIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3 py-5">
        <div className="flex items-center justify-between">
          <WidgetHeader icon={Target} title={w.title} />
          {percent !== null && <ProgressRing percent={percent} size={36} strokeWidth={3} label={w.title} />}
        </div>

        {visibleTasks.length === 0 ? (
          <WidgetEmptyState icon={Target} title={w.emptyTitle} description={w.emptyDescription} cta={{ label: w.emptyCta, href: "/dashboard/roadmap" }} />
        ) : (
          <div className="flex flex-1 flex-col gap-2.5">
            {milestoneTitle && <p className="text-muted-foreground truncate text-xs">{milestoneTitle}</p>}
            {visibleTasks.map((task, i) => (
              <div key={task.id} className="flex items-center gap-2.5 text-sm">
                {i === 0 ? (
                  <>
                    <Checkbox
                      id={`focus-task-${task.id}`}
                      checked={false}
                      disabled={pendingId === task.id}
                      onCheckedChange={(checked) => checked === true && completeTask(task.id)}
                    />
                    <Label htmlFor={`focus-task-${task.id}`} className="min-w-0 flex-1 truncate font-normal">
                      {task.title}
                    </Label>
                  </>
                ) : (
                  <>
                    <Circle className="text-muted-foreground size-3.5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{task.title}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
