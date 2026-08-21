"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface ProactiveInsightBannerProps {
  targetRole: string | null;
  insight: { skill: string; jobCount: number };
  className?: string;
}

export function ProactiveInsightBanner({ targetRole, insight, className }: ProactiveInsightBannerProps) {
  const { dict } = useLocale();
  const copy = dict.dashboard.coachPage.proactiveInsight;

  const description = targetRole
    ? copy.withGoalTemplate.replace("{role}", targetRole).replace("{count}", String(insight.jobCount)).replace("{skill}", insight.skill)
    : copy.withoutGoalTemplate.replace("{count}", String(insight.jobCount)).replace("{skill}", insight.skill);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`ambient-ai hover-lift border-primary/15 bg-coach-tint ${className ?? ""}`}>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-primary/15 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="size-4.5" />
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold">{copy.title}</p>
              <p className="text-sm">{description}</p>
              <p className="text-muted-foreground text-xs">{copy.hint}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 pl-12 sm:pl-0">
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard/jobs">{copy.showJobsCta}</Link>} />
            <Button size="sm" nativeButton={false} render={<Link href="/dashboard/roadmap">{copy.addToRoadmapCta}</Link>} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
