"use client";

import { motion } from "motion/react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ScoreStrengthKey, ScoreMissingKey } from "@/lib/career/score";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CareerScoreWidgetProps {
  score: number;
  strengths: ScoreStrengthKey[];
  missing: ScoreMissingKey[];
}

export function CareerScoreWidget({ score, strengths, missing }: CareerScoreWidgetProps) {
  const { dict } = useLocale();
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.dashboard.careerScore.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="relative flex size-36 items-center justify-center">
            <svg viewBox="0 0 128 128" className="size-36 -rotate-90">
              <circle cx="64" cy="64" r={RADIUS} className="stroke-muted" strokeWidth="10" fill="none" />
              <motion.circle
                cx="64"
                cy="64"
                r={RADIUS}
                className="stroke-primary"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-semibold">{score}</span>
              <span className="text-muted-foreground text-xs">{dict.dashboard.careerScore.outOf}</span>
            </div>
          </div>
        </div>

        {strengths.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{dict.dashboard.careerScore.strengthsTitle}</p>
            <ul className="space-y-1.5">
              {strengths.map((key) => (
                <li key={key} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
                  {dict.dashboard.careerScore.strengthItems[key]}
                </li>
              ))}
            </ul>
          </div>
        )}

        {missing.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{dict.dashboard.careerScore.missingTitle}</p>
            <ul className="space-y-1.5">
              {missing.map((key) => (
                <li key={key} className="text-muted-foreground flex items-center gap-2 text-sm">
                  <XCircle className="size-4 shrink-0" />
                  {dict.dashboard.careerScore.missingItems[key]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
