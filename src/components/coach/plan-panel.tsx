"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { CareerPlanData } from "./types";

interface PlanPanelProps {
  plan: CareerPlanData | null;
}

export function PlanPanel({ plan }: PlanPanelProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.coachPage.plan;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{page.title}</h2>
        <p className="text-muted-foreground text-sm">{page.subtitle}</p>
      </div>

      {!plan || plan.months.length === 0 ? (
        <p className="text-muted-foreground text-sm">{page.empty}</p>
      ) : (
        <div className="space-y-3">
          {plan.months.map((month) => (
            <Card key={month.monthIndex}>
              <CardContent className="flex items-start gap-3 pt-6">
                {month.allCompleted ? (
                  <CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" />
                ) : (
                  <Circle className="text-muted-foreground mt-0.5 size-5 shrink-0" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">{page.monthTemplate.replace("{month}", String(month.monthIndex))}</p>
                  <ul className="text-muted-foreground list-disc space-y-0.5 pl-4 text-sm">
                    {month.milestoneTitles.map((title, i) => (
                      <li key={i}>{title}</li>
                    ))}
                  </ul>
                  {month.allCompleted && <p className="text-success text-xs">{page.completedLabel}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
