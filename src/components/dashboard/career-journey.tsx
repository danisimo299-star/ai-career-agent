"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CheckCircle2, ClipboardList, Compass, Map, FileText, Mic, Briefcase, TrendingUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";

export type JourneyStageKey = "discover" | "choose" | "build" | "present" | "practice" | "apply" | "grow";
export type JourneyStageStatus = "done" | "current" | "todo";

export interface JourneyStage {
  key: JourneyStageKey;
  status: JourneyStageStatus;
}

const STAGE_ORDER: JourneyStageKey[] = ["discover", "choose", "build", "present", "practice", "apply", "grow"];

const STAGE_ICONS: Record<JourneyStageKey, LucideIcon> = {
  discover: ClipboardList,
  choose: Compass,
  build: Map,
  present: FileText,
  practice: Mic,
  apply: Briefcase,
  grow: TrendingUp,
};

const STAGE_HREFS: Record<JourneyStageKey, string> = {
  discover: "/dashboard/questionnaire",
  choose: "/dashboard/career-analysis",
  build: "/dashboard/roadmap",
  present: "/dashboard/resume",
  practice: "/dashboard/interview",
  apply: "/dashboard/jobs",
  grow: "/dashboard/coach",
};

/**
 * A connected path, not a checklist — one continuous progress line behind
 * the nodes (horizontal on desktop, vertical on mobile per the brief),
 * filled up to the last completed stage. `grow` never shows a checkmark:
 * it's the open-ended "keep going" stage, not something to complete.
 */
export function CareerJourney({ stages }: { stages: JourneyStage[] }) {
  const { dict } = useLocale();
  const copy = dict.dashboard.careerJourney;

  const ordered = STAGE_ORDER.map((key) => stages.find((s) => s.key === key)).filter((s): s is JourneyStage => Boolean(s));
  const doneCount = ordered.filter((s) => s.status === "done").length;
  const progressPercent = ordered.length > 1 ? (doneCount / (ordered.length - 1)) * 100 : 0;

  return (
    <Card className="hover-lift">
      <CardContent className="py-5">
        <p className="text-muted-foreground mb-5 text-xs font-medium tracking-wide uppercase">{copy.title}</p>

        <div className="relative">
          {/* Mobile: vertical track + fill */}
          <div className="bg-border absolute top-4 bottom-4 left-4 w-0.5 sm:hidden">
            <motion.div
              className="bg-primary w-full"
              initial={false}
              animate={{ height: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          {/* Desktop: horizontal track + fill */}
          <div className="bg-border absolute top-4 right-4 left-4 hidden h-0.5 sm:block">
            <motion.div
              className="bg-primary h-full"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          <ol className="relative flex flex-col gap-6 sm:flex-row sm:justify-between sm:gap-2">
            {ordered.map((stage) => {
              const Icon = STAGE_ICONS[stage.key];
              const isMuted = stage.status === "todo";
              return (
                <li key={stage.key} className="relative">
                  <Link href={STAGE_HREFS[stage.key]} className="group flex items-center gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
                    <span
                      className={cn(
                        "bg-background flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        // Green = completed (matches Career Score's checkmarks elsewhere); indigo is reserved for the active/current stage, not "done".
                        stage.status === "done" && "border-success bg-success text-success-foreground",
                        stage.status === "current" && "border-primary text-primary",
                        isMuted && "border-muted-foreground/25 text-muted-foreground/40"
                      )}
                    >
                      {stage.status === "done" ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                    </span>
                    <span className="sm:max-w-20">
                      <span className={cn("block text-[10px] font-semibold tracking-wide uppercase", isMuted ? "text-muted-foreground/40" : "text-muted-foreground")}>
                        {copy.stages[stage.key].label}
                      </span>
                      <span className={cn("block text-xs font-medium", isMuted ? "text-muted-foreground/40" : "text-foreground group-hover:text-primary")}>
                        {copy.stages[stage.key].item}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
