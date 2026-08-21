"use client";

import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface ResumeCardProps {
  hasResume: boolean;
  score: number | null;
  updatedAt: string | null;
}

export function ResumeCard({ hasResume, score, updatedAt }: ResumeCardProps) {
  const { locale, dict } = useLocale();
  const card = dict.dashboard.resumeCard;

  const updatedLabel = updatedAt
    ? card.lastUpdatedTemplate.replace(
        "{time}",
        new Date(updatedAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US")
      )
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="text-primary size-4" />
          {card.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasResume ? (
          <p className="text-muted-foreground text-sm">{card.noResume}</p>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium">{card.scoreTemplate.replace("{score}", String(score ?? 0))}</p>
            {updatedLabel && <p className="text-muted-foreground text-xs">{updatedLabel}</p>}
          </div>
        )}
        <Button
          size="sm"
          className="w-full"
          nativeButton={false}
          render={
            <Link href="/dashboard/resume">
              {card.editCta}
              <ArrowRight />
            </Link>
          }
        />
      </CardContent>
    </Card>
  );
}
