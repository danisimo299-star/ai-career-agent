"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, Target, Map, FileText, Mic, Briefcase, Sparkles, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WidgetHeader } from "./widget-header";
import { useLocale } from "@/lib/i18n/locale-provider";
import { JOURNEY_STAGE_HREF, type JourneyStageKey } from "@/lib/career/journey";

const STAGE_ICON: Record<JourneyStageKey, LucideIcon> = {
  discover: ClipboardList,
  choose: Target,
  build: Map,
  present: FileText,
  practice: Mic,
  apply: Briefcase,
  grow: Sparkles,
};

const STAGE_TONE: Record<JourneyStageKey, string> = {
  discover: "bg-tool-profile-solid text-white",
  choose: "bg-tool-tasks-solid text-white",
  build: "bg-tool-roadmap-solid text-white",
  present: "bg-tool-resume-solid text-white",
  practice: "bg-tool-interview-solid text-white",
  apply: "bg-tool-jobs-solid text-white",
  grow: "bg-tool-chat-solid text-white",
};

interface DashboardRecommendationCardProps {
  nextSteps: JourneyStageKey[];
}

/** "Что делать дальше" — up to 3 concrete next actions, reusing the same sequential journey-stage logic the rest of the app already relies on, never invented suggestions. */
export function DashboardRecommendationCard({ nextSteps }: DashboardRecommendationCardProps) {
  const { dict } = useLocale();
  const r = dict.dashboard.recommendation;
  const stages = dict.dashboard.nextStep.stages;

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3 py-5">
        <WidgetHeader icon={Sparkles} title={r.title} />
        <div className="flex flex-1 flex-col gap-1">
          {nextSteps.map((key) => {
            const Icon = STAGE_ICON[key];
            const stage = stages[key];
            return (
              <Link
                key={key}
                href={JOURNEY_STAGE_HREF[key]}
                className="hover:bg-accent group flex items-center gap-2.5 rounded-md px-1.5 py-2 -mx-1.5 transition-colors duration-150"
              >
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${STAGE_TONE[key]}`}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{stage.title}</span>
                  <span className="text-muted-foreground block truncate text-xs">{stage.description}</span>
                </span>
                <ArrowRight className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
