"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { ResourceItem } from "./resource-item";
import type { TaskWithResourcesData } from "./types";

interface TaskItemProps {
  task: TaskWithResourcesData;
  disabled?: boolean;
  onToggle: (taskId: string, completed: boolean) => void;
}

export function TaskItem({ task, disabled, onToggle }: TaskItemProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.roadmapPage;

  return (
    <div className="group/task space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2.5">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          disabled={disabled}
          onCheckedChange={(checked) => onToggle(task.id, checked === true)}
        />
        <Label
          htmlFor={`task-${task.id}`}
          className={cn("flex-1 text-sm font-normal", task.completed && "text-muted-foreground line-through")}
        >
          {task.title}
        </Label>
        <Button
          size="icon-xs"
          variant="ghost"
          className="text-muted-foreground opacity-0 transition-opacity group-hover/task:opacity-100 focus-visible:opacity-100"
          title={page.discussTaskCta}
          aria-label={page.discussTaskCta}
          nativeButton={false}
          render={<Link href={`/dashboard/coach?ask=${encodeURIComponent(page.discussTaskQuestionTemplate.replace("{title}", task.title))}`} />}
        >
          <Sparkles />
        </Button>
      </div>
      {task.resources.length > 0 && (
        <div className="space-y-1.5 pl-6.5">
          {task.resources.map((resource) => (
            <ResourceItem key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
