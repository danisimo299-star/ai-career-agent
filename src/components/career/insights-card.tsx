"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-provider";

export function InsightsCard({ insights }: { insights: string[] }) {
  const { dict } = useLocale();

  if (insights.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <p className="text-sm font-medium">{dict.dashboard.careerAnalysisPage.insightsTitle}</p>
        <ul className="space-y-1.5">
          {insights.map((insight, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="text-muted-foreground flex gap-2 text-sm"
            >
              <Sparkles className="text-primary mt-0.5 size-3.5 shrink-0" />
              {insight}
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
