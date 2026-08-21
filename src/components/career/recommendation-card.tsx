"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Gauge, Briefcase } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export interface RecommendationData {
  id: string;
  title: string;
  matchScore: number;
  reasoning: string;
  requiredSkills: string[];
  learningTimeMonths: number;
  growthPotential: "LOW" | "MEDIUM" | "HIGH";
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
}

export function RecommendationCard({ recommendation, rank }: { recommendation: RecommendationData; rank: number }) {
  const { dict } = useLocale();
  const page = dict.dashboard.careerAnalysisPage;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            {rank}
          </span>
          <CardTitle className="text-base">{recommendation.title}</CardTitle>
        </div>
        <Badge>
          {recommendation.matchScore}% {page.matchScore}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{recommendation.reasoning}</p>

        <div className="flex flex-wrap gap-1.5">
          {recommendation.requiredSkills.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>

        <div className="text-muted-foreground grid grid-cols-3 gap-2 border-t pt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {page.learningTimeTemplate.replace("{months}", String(recommendation.learningTimeMonths))}
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3.5" />
            {page.growthPotential[recommendation.growthPotential]}
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="size-3.5" />
            {page.difficultyLevel[recommendation.difficultyLevel]}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={
            <Link href={`/dashboard/jobs?role=${encodeURIComponent(recommendation.title)}`}>
              <Briefcase />
              {page.findJobsCta}
            </Link>
          }
        />
      </CardContent>
    </Card>
  );
}
