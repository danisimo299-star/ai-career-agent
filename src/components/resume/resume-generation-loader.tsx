"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

const STEP_KEYS = ["analyzeProfile", "pickStrengths", "buildStructure", "refineWording"] as const;

/**
 * There is exactly one real network call behind this (`generateDraft`), not
 * four — these steps advance on a timer to accompany that one indeterminate
 * wait rather than claim four separate operations happened. When the real
 * call resolves, `done` flips true and every step completes immediately
 * instead of waiting out the rest of the cycle.
 */
export function ResumeGenerationLoader({ done }: { done: boolean }) {
  const { dict } = useLocale();
  const page = dict.dashboard.resumePage.generation;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setActiveIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1));
    }, 1100);
    return () => clearInterval(id);
  }, [done]);

  const effectiveIndex = done ? STEP_KEYS.length : activeIndex;

  return (
    <Card className="ambient-ai border-primary/20">
      <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="bg-primary/15 flex size-12 items-center justify-center rounded-full">
          <Sparkles className="text-primary size-6" />
        </div>
        <p className="text-lg font-semibold">{page.heading}</p>
        <ul className="w-full max-w-xs space-y-2.5 text-left">
          {STEP_KEYS.map((key, i) => {
            const complete = i < effectiveIndex || done;
            const current = i === effectiveIndex && !done;
            return (
              <li key={key} className="flex items-center gap-2.5 text-sm">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    complete ? "border-success bg-success/15 text-success" : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {complete ? (
                    <Check className="size-3" />
                  ) : (
                    <span className={cn("size-1.5 rounded-full bg-current", current && "animate-pulse")} />
                  )}
                </span>
                <span className={complete ? "text-foreground" : "text-muted-foreground"}>{page.steps[key]}</span>
              </li>
            );
          })}
        </ul>
        <motion.div
          className="bg-primary/40 h-0.5 w-full max-w-xs overflow-hidden rounded-full"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </CardContent>
    </Card>
  );
}
