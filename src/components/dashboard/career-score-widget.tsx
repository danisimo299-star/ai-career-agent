"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "./progress-ring";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ScoreStrengthKey, ScoreMissingKey } from "@/lib/career/score";

interface CareerScoreWidgetProps {
  score: number;
  strengths: ScoreStrengthKey[];
  missing: ScoreMissingKey[];
}

export function CareerScoreWidget({ score, strengths, missing }: CareerScoreWidgetProps) {
  const { dict } = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.dashboard.careerScore.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center">
          <ProgressRing percent={score} size={144} strokeWidth={10} label={dict.dashboard.careerScore.title} />
        </div>
        <p className="text-muted-foreground -mt-3 text-center text-xs text-balance">{dict.dashboard.snapshot.profile.tooltip}</p>

        {strengths.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{dict.dashboard.careerScore.strengthsTitle}</p>
            <div className="flex flex-wrap gap-1.5">
              {strengths.map((key) => (
                <Badge key={key} variant="success" className="gap-1">
                  <CheckCircle2 className="size-3" />
                  {dict.dashboard.careerScore.strengthItems[key]}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {missing.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{dict.dashboard.careerScore.missingTitle}</p>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((key) => (
                <Badge key={key} variant="warning" className="gap-1">
                  <XCircle className="size-3" />
                  {dict.dashboard.careerScore.missingItems[key]}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
