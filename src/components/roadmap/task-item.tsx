"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ResourceItem } from "./resource-item";
import type { TaskWithResourcesData } from "./types";

interface TaskItemProps {
  task: TaskWithResourcesData;
  disabled?: boolean;
  onToggle: (taskId: string, completed: boolean) => void;
}

export function TaskItem({ task, disabled, onToggle }: TaskItemProps) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
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
