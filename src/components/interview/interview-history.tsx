"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { History } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { InterviewSessionData } from "./types";

interface InterviewHistoryProps {
  sessions: InterviewSessionData[];
  onOpen: (id: string) => void;
}

export function InterviewHistory({ sessions, onOpen }: InterviewHistoryProps) {
  const { locale, dict } = useLocale();
  const h = dict.dashboard.interviewPage.history;
  const setup = dict.dashboard.interviewPage.setup;

  const completed = sessions.filter((s) => s.status === "COMPLETED" && s.report);
  const scores = completed.map((s) => s.report!.overallScore);
  const bestScore = scores.length > 0 ? Math.max(...scores) : null;
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length) : null;
  const latestScore = scores[0] ?? null;
  const trend = [...completed]
    .reverse()
    .map((s) => s.report!.overallScore)
    .join(" → ");

  if (sessions.length === 0) {
    return <EmptyState icon={History} title={h.title} description={h.empty} />;
  }

  return (
    <div className="space-y-4">
      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{h.progressTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-xs">{h.bestScoreLabel}</p>
                <p className="text-lg font-semibold">{bestScore}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{h.averageScoreLabel}</p>
                <p className="text-lg font-semibold">{averageScore}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{h.countLabel}</p>
                <p className="text-lg font-semibold">{completed.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{h.latestScoreLabel}</p>
                <p className="text-lg font-semibold">{latestScore}</p>
              </div>
            </div>
            {completed.length > 1 && <p className="text-muted-foreground text-sm">{trend}</p>}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <p className="text-muted-foreground text-sm font-medium">{h.title}</p>
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onOpen(session.id)}
            className="border-border hover:border-primary/40 hover:bg-muted/50 flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{session.targetRole}</p>
              <p className="text-muted-foreground text-xs">
                {setup.types[session.type]} · {new Date(session.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US")}
              </p>
            </div>
            {session.status === "COMPLETED" && session.report ? (
              <span className="font-semibold">{session.report.overallScore}/100</span>
            ) : (
              <Badge variant="secondary">{h.inProgressBadge}</Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
