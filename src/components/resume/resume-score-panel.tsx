"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ResumeScoreResult } from "@/lib/career/resume-score";

export function ResumeScorePanel({ result }: { result: ResumeScoreResult }) {
  const { dict } = useLocale();
  const s = dict.dashboard.resumePage.score;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline gap-2 text-base">
          {s.title}
          <span className="text-2xl font-bold">
            {result.score}
            <span className="text-muted-foreground text-sm font-normal"> {s.outOf}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(Object.keys(result.breakdown) as (keyof typeof result.breakdown)[]).map((key) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{s.breakdown[key]}</span>
                <span className="font-medium">{result.breakdown[key]}</span>
              </div>
              <Progress value={result.breakdown[key]} />
            </div>
          ))}
        </div>
        {result.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium">{s.recommendationsTitle}</p>
            <ul className="space-y-1 text-sm">
              {result.recommendations.map((key) => (
                <li key={key} className="flex gap-1.5">
                  <span className="text-muted-foreground">•</span>
                  {s.recommendations[key]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
