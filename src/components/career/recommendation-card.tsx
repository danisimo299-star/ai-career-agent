"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Clock, TrendingUp, Gauge, Briefcase, Sparkles, ChevronDown, ChevronUp, Rocket } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export interface RecommendationData {
  id: string;
  title: string;
  matchScore: number;
  reasoning: string;
  requiredSkills: string[];
  learningTimeMonths: number;
  growthPotential: "LOW" | "MEDIUM" | "HIGH";
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  hhSearchTitle?: string | null;
  firstJobTitle?: string | null;
  marketDemand?: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  vacancyCountCity?: number | null;
  vacancyCountRussia?: number | null;
  marketCheckedCity?: string | null;
  hhProfessionalRoleId?: number | null;
  hhAreaId?: number | null;
}

const DEMAND_BADGE_VARIANT: Record<NonNullable<RecommendationData["marketDemand"]>, "success" | "warning" | "outline" | "secondary"> = {
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "outline",
  UNKNOWN: "secondary",
};

export function RecommendationCard({ recommendation, rank }: { recommendation: RecommendationData; rank: number }) {
  const { dict } = useLocale();
  const page = dict.dashboard.careerAnalysisPage;
  const [detailsOpen, setDetailsOpen] = useState(false);

  const searchRole = recommendation.hhSearchTitle || recommendation.title;
  const jobsHref = new URLSearchParams({ role: searchRole });
  if (recommendation.hhProfessionalRoleId) jobsHref.set("roleId", String(recommendation.hhProfessionalRoleId));
  if (recommendation.hhAreaId) jobsHref.set("areaId", String(recommendation.hhAreaId));
  const demand = recommendation.marketDemand ?? "UNKNOWN";
  const hasFirstJob = recommendation.firstJobTitle && recommendation.firstJobTitle !== recommendation.title;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              rank === 1 ? "bg-tool-resume-solid text-white" : "bg-secondary text-foreground"
            )}
          >
            {rank}
          </span>
          <CardTitle className="text-base">{recommendation.title}</CardTitle>
        </div>
        <Badge>
          {recommendation.matchScore}% {page.matchScore}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground max-w-prose text-[15px] leading-relaxed">{recommendation.reasoning}</p>

        <Tooltip>
          <TooltipTrigger
            render={
              <Badge variant={DEMAND_BADGE_VARIANT[demand]} className="cursor-default">
                {page.marketDemand[demand]}
              </Badge>
            }
          />
          <TooltipContent>
            {demand === "UNKNOWN"
              ? page.marketDemandTooltip.unknown
              : page.marketDemandTooltip.counts
                  .replace("{city}", recommendation.marketCheckedCity ?? "—")
                  .replace("{cityCount}", String(recommendation.vacancyCountCity ?? 0))
                  .replace("{russiaCount}", String(recommendation.vacancyCountRussia ?? 0))}
          </TooltipContent>
        </Tooltip>

        {hasFirstJob && (
          <p className="flex items-start gap-1.5 text-sm">
            <Rocket className="text-primary mt-0.5 size-3.5 shrink-0" />
            <span>
              <span className="text-muted-foreground">{page.firstJobLabel}: </span>
              <span className="font-medium">{recommendation.firstJobTitle}</span>
            </span>
          </p>
        )}

        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
        >
          {detailsOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          {detailsOpen ? page.hideDetails : page.showDetails}
        </button>

        {detailsOpen && (
          <div className="flex flex-wrap gap-1.5">
            {recommendation.requiredSkills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        )}

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

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            nativeButton={false}
            render={
              <Link href={`/dashboard/jobs?${jobsHref.toString()}`}>
                <Briefcase />
                {page.findJobsCta}
              </Link>
            }
          />
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            nativeButton={false}
            render={
              <Link href={`/dashboard/coach?ask=${encodeURIComponent(page.discussQuestionTemplate.replace("{title}", recommendation.title))}`}>
                <Sparkles />
                {page.discussCta}
              </Link>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
