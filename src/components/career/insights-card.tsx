"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-provider";

const COLLAPSED_COUNT = 3;

/**
 * "Краткий вывод" (2-3 sentence `summary`) leads, in larger, higher-contrast
 * type — everything else is detail a user can choose to expand. Beyond
 * `COLLAPSED_COUNT` insights, the rest hide behind "Показать всё" so the
 * page never opens on a wall of bullet points (item 2 of the brief).
 */
export function InsightsCard({ summary, insights }: { summary?: string | null; insights: string[] }) {
  const { dict } = useLocale();
  const page = dict.dashboard.careerAnalysisPage;
  const [expanded, setExpanded] = useState(false);

  if (!summary && insights.length === 0) return null;

  const visibleInsights = expanded ? insights : insights.slice(0, COLLAPSED_COUNT);
  const hiddenCount = insights.length - visibleInsights.length;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {summary && (
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{page.summaryTitle}</p>
            <p className="text-foreground max-w-prose text-[17px] leading-snug font-medium text-balance">{summary}</p>
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
            <p className="text-sm font-medium">{page.insightsTitle}</p>
            <ul className="space-y-1.5">
              {visibleInsights.map((insight, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="text-muted-foreground flex gap-2 text-[15px] leading-relaxed"
                >
                  <Sparkles className="text-primary mt-0.5 size-3.5 shrink-0" />
                  {insight}
                </motion.li>
              ))}
            </ul>
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
              >
                <ChevronDown className="size-3.5" />
                {page.showAllInsights.replace("{count}", String(hiddenCount))}
              </button>
            )}
            {expanded && insights.length > COLLAPSED_COUNT && (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
              >
                <ChevronUp className="size-3.5" />
                {page.hideDetails}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
