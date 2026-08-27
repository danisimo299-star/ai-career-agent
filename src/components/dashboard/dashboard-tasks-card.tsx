"use client";

import Link from "next/link";
import { ListChecks, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WidgetHeader } from "./widget-header";
import { WidgetEmptyState } from "./widget-empty-state";
import { useLocale } from "@/lib/i18n/locale-provider";

export interface DashboardTaskItem {
  id: string;
  title: string;
  status: "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "EXPIRED";
  estimatedMinutes: number;
}

interface DashboardTasksCardProps {
  tasks: DashboardTaskItem[];
}

/** "Мои задачи" — today's real AI-generated career missions (career-mission.service, same feature the Tasks page runs), shown as compact rows, never fabricated deadlines the data model doesn't have. */
export function DashboardTasksCard({ tasks }: DashboardTasksCardProps) {
  const { dict } = useLocale();
  const t = dict.dashboard.tasksPreview;
  const status = dict.dashboard.missionsPage.status;
  const time = dict.dashboard.missionsPage.estimatedTimeTemplate;

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3 py-5">
        <div className="flex items-center justify-between gap-2">
          <WidgetHeader icon={ListChecks} title={t.title} />
          <Link
            href="/dashboard/missions"
            className="text-muted-foreground hover:text-foreground shrink-0 text-xs font-medium whitespace-nowrap"
          >
            {t.viewAllCta}
          </Link>
        </div>

        {tasks.length === 0 ? (
          <WidgetEmptyState icon={ListChecks} title={t.emptyTitle} description={t.emptyDescription} cta={{ label: t.viewAllCta, href: "/dashboard/missions" }} />
        ) : (
          <div className="flex flex-1 flex-col gap-1">
            {tasks.map((task) => {
              const done = task.status === "COMPLETED";
              return (
                <Link
                  key={task.id}
                  href="/dashboard/missions"
                  className="hover:bg-accent -mx-1.5 flex items-center gap-2.5 rounded-md px-1.5 py-2 transition-colors duration-150"
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      done ? "bg-tool-tasks-solid text-white" : "bg-tool-chat-solid text-white"
                    }`}
                  >
                    <CheckCircle2 className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-medium ${done ? "text-muted-foreground line-through" : ""}`}>{task.title}</span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {done ? status.COMPLETED : time.replace("{minutes}", String(task.estimatedMinutes))}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
