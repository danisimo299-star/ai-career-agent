"use client";

import Link from "next/link";
import { Mic, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface InterviewCardProps {
  completedCount: number;
  lastScore: number | null;
  recommendation: string | null;
}

export function InterviewCard({ completedCount, lastScore, recommendation }: InterviewCardProps) {
  const { dict } = useLocale();
  const card = dict.dashboard.interviewCard;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="text-primary size-4" />
          {card.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {completedCount === 0 ? (
          <p className="text-muted-foreground text-sm">{card.noSessions}</p>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium">{card.lastScoreTemplate.replace("{score}", String(lastScore))}</p>
            <p className="text-muted-foreground text-xs">{card.sessionsCountTemplate.replace("{count}", String(completedCount))}</p>
            {recommendation && <p className="text-muted-foreground text-xs">{recommendation}</p>}
          </div>
        )}
        <Button
          size="sm"
          className="w-full"
          nativeButton={false}
          render={
            <Link href="/dashboard/interview">
              {completedCount === 0 ? card.startCta : card.viewCta}
              <ArrowRight />
            </Link>
          }
        />
      </CardContent>
    </Card>
  );
}
