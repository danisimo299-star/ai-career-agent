"use client";

import Link from "next/link";
import { Briefcase, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface JobsCardProps {
  topMatches: { title: string; matchScore: number | null }[];
}

export function JobsCard({ topMatches }: JobsCardProps) {
  const { dict } = useLocale();
  const card = dict.dashboard.jobsCard;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="text-primary size-4" />
          {card.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topMatches.length === 0 ? (
          <p className="text-muted-foreground text-sm">{card.noJobs}</p>
        ) : (
          <ul className="space-y-1.5">
            {topMatches.slice(0, 3).map((job, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{job.title}</span>
                {job.matchScore !== null && (
                  <span className="text-primary shrink-0 text-xs font-medium">{card.matchTemplate.replace("{score}", String(job.matchScore))}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <Button
          size="sm"
          className="w-full"
          nativeButton={false}
          render={
            <Link href="/dashboard/jobs">
              {card.viewAllCta}
              <ArrowRight />
            </Link>
          }
        />
      </CardContent>
    </Card>
  );
}
