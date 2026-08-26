"use client";

import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n/locale-provider";

export function ProgressHeader({ percent, step, totalSteps }: { percent: number; step: number; totalSteps: number }) {
  const { dict } = useLocale();
  const page = dict.questionnaire;

  const message = percent >= 70 ? page.progress.almostThere : percent >= 25 ? page.progress.midway : page.progress.justStarted;

  return (
    <div className="space-y-1.5 border-b px-4 py-3 sm:px-6">
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-sm font-medium">{page.progress.label}</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {page.progress.stepTemplate.replace("{step}", String(step)).replace("{total}", String(totalSteps))}
        </span>
      </div>
      <Progress value={percent} />
      <p className="text-muted-foreground text-xs">{message}</p>
    </div>
  );
}
