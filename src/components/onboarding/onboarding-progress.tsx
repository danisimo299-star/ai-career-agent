"use client";

import { motion } from "motion/react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function OnboardingProgress({ percent }: { percent: number }) {
  const { dict } = useLocale();

  return (
    <div className="w-full space-y-2">
      <div className="text-muted-foreground flex items-center justify-between text-xs font-medium">
        <span>{dict.onboarding.progressLabel}</span>
        <span>{percent}%</span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <motion.div
          className="bg-primary h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
