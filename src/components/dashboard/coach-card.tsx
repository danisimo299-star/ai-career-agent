"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface CoachCardProps {
  readiness: number | null;
  nextActionTitle: string | null;
  className?: string;
}

export function CoachCard({ readiness, nextActionTitle, className }: CoachCardProps) {
  const { dict } = useLocale();
  const card = dict.dashboard.coachCard;

  return (
    <Card className={`hover-lift border-primary/15 bg-coach-tint shadow-featured ${className ?? ""}`}>
      <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="font-semibold">{card.title}</p>
            {readiness !== null || nextActionTitle ? (
              <div className="space-y-0.5">
                {readiness !== null && <p className="text-sm">{card.readinessTemplate.replace("{score}", String(readiness))}</p>}
                {nextActionTitle && <p className="text-muted-foreground text-xs">{card.nextActionTemplate.replace("{action}", nextActionTitle)}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{card.noData}</p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          nativeButton={false}
          render={
            <Link href="/dashboard/coach">
              {card.openCta}
              <ArrowRight />
            </Link>
          }
        />
      </CardContent>
    </Card>
  );
}
