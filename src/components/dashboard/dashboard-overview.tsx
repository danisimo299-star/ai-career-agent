"use client";

import { motion } from "motion/react";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { ProfileSnapshotRow } from "@/components/dashboard/profile-snapshot-row";
import { WeeklyFocusPreview } from "@/components/dashboard/weekly-focus-preview";
import { DashboardRecommendationCard } from "@/components/dashboard/dashboard-recommendation-card";
import { DashboardTasksCard, type DashboardTaskItem } from "@/components/dashboard/dashboard-tasks-card";
import { DashboardJobsPreviewCard, type DashboardJobPreviewItem } from "@/components/dashboard/dashboard-jobs-preview-card";
import { DashboardAskProfyMind } from "@/components/dashboard/dashboard-ask-profymind";
import { ProactiveInsightBanner } from "@/components/coach/proactive-insight-banner";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { JourneyStageKey } from "./types";
import type { ThisWeekTaskItem } from "./weekly-focus-preview";
import type { ScoreStrengthKey, ScoreMissingKey } from "@/lib/career/score";

interface DashboardOverviewProps {
  userName?: string | null;
  nextStepKey: JourneyStageKey;
  upcomingStageKeys: JourneyStageKey[];
  profilePercent: number | null;
  strengths: ScoreStrengthKey[];
  missing: ScoreMissingKey[];
  planPercent: number | null;
  resumeScore: number | null;
  interviewCount: number;
  interviewAvgScore: number | null;
  proactiveInsight: { skill: string; jobCount: number } | null;
  targetRole: string | null;
  tasks: DashboardTaskItem[];
  jobs: DashboardJobPreviewItem[];
  thisWeekMilestoneTitle: string | null;
  thisWeekTasks: ThisWeekTaskItem[];
  thisWeekPercent: number | null;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

/**
 * Hero → metrics strip → a 4-up row of real preview cards → a wide "ask
 * ProfyMind" section — the Career-OS reference structure, every number
 * still sourced from the same deterministic services/queries the rest of
 * the app already uses (no new AI calls, no invented data).
 */
export function DashboardOverview({
  userName,
  nextStepKey,
  upcomingStageKeys,
  profilePercent,
  strengths,
  missing,
  planPercent,
  resumeScore,
  interviewCount,
  interviewAvgScore,
  proactiveInsight,
  targetRole,
  tasks,
  jobs,
  thisWeekMilestoneTitle,
  thisWeekTasks,
  thisWeekPercent,
}: DashboardOverviewProps) {
  const { dict } = useLocale();

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <DashboardHero userName={userName} nextStepKey={nextStepKey} profilePercent={profilePercent} strengths={strengths} missing={missing} />
      </motion.div>

      {proactiveInsight && <ProactiveInsightBanner targetRole={targetRole} insight={proactiveInsight} />}

      <motion.div variants={itemVariants} className="space-y-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{dict.dashboard.snapshot.title}</p>
        <ProfileSnapshotRow
          profilePercent={profilePercent}
          planPercent={planPercent}
          resumeScore={resumeScore}
          interviewCount={interviewCount}
          interviewAvgScore={interviewAvgScore}
        />
      </motion.div>

      {/* `grid-cols-1` has to be explicit here, not just implied by omission
          — without it, `display:grid` falls back to an implicit `auto`
          track below `md:`, and an `auto` track has no `minmax(0, …)` cap,
          so a grid item with no `min-w-0` forces the track (and the whole
          row) to its max-content width instead of the viewport's. Same
          reasoning behind `min-w-0` on each item wrapper below. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <motion.div variants={itemVariants} className="min-w-0">
          <DashboardRecommendationCard nextSteps={upcomingStageKeys} />
        </motion.div>
        <motion.div variants={itemVariants} className="min-w-0">
          <WeeklyFocusPreview milestoneTitle={thisWeekMilestoneTitle} tasks={thisWeekTasks} percent={thisWeekPercent} />
        </motion.div>
        <motion.div variants={itemVariants} className="min-w-0">
          <DashboardTasksCard tasks={tasks} />
        </motion.div>
        <motion.div variants={itemVariants} className="min-w-0">
          <DashboardJobsPreviewCard jobs={jobs} />
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <DashboardAskProfyMind />
      </motion.div>
    </motion.div>
  );
}
