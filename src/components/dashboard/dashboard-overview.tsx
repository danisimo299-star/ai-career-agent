"use client";

import { ClipboardList, Compass, Settings } from "lucide-react";
import { FeatureCard } from "@/components/dashboard/feature-card";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import type { JourneyStageKey, JourneyStageStatus } from "@/components/dashboard/career-journey";
import { CareerDnaWidget } from "@/components/dashboard/career-dna-widget";
import { CareerScoreWidget } from "@/components/dashboard/career-score-widget";
import { CareerTimelineWidget } from "@/components/dashboard/career-timeline-widget";
import { RoadmapProgressCard } from "@/components/dashboard/roadmap-progress-card";
import { TodayMissionCard } from "@/components/dashboard/today-mission-card";
import { InterviewCard } from "@/components/dashboard/interview-card";
import { ResumeCard } from "@/components/dashboard/resume-card";
import { JobsCard } from "@/components/dashboard/jobs-card";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { CareerDnaScores } from "@/lib/ai/career/types";
import type { ScoreStrengthKey, ScoreMissingKey } from "@/lib/career/score";
import type { RoadmapData } from "@/components/roadmap/types";
import type { CareerMissionData } from "@/components/missions/types";

const featureCards = [
  { key: "questionnaire", href: "/dashboard/questionnaire", icon: ClipboardList, available: true },
  { key: "careerAnalysis", href: "/dashboard/career-analysis", icon: Compass, available: true },
  { key: "settings", href: "/dashboard/settings", icon: Settings, available: false },
] as const;

interface DashboardOverviewProps {
  userName?: string | null;
  dna: CareerDnaScores | null;
  score: number;
  strengths: ScoreStrengthKey[];
  missing: ScoreMissingKey[];
  hasChatted: boolean;
  roadmap: RoadmapData | null;
  todayMission: CareerMissionData | null;
  hasActiveMissions: boolean;
  missionStreak: number;
  interviewCompletedCount: number;
  interviewLastScore: number | null;
  interviewRecommendation: string | null;
  hasResume: boolean;
  resumeScore: number | null;
  resumeUpdatedAt: string | null;
  jobTopMatches: { title: string; matchScore: number | null }[];
  targetRole: string | null;
  readiness: number | null;
  nextActionTitle: string | null;
  nextActionWhy: string | null;
  journey: { key: JourneyStageKey; status: JourneyStageStatus }[];
  proactiveInsight: { skill: string; jobCount: number } | null;
}

export function DashboardOverview({
  userName,
  dna,
  score,
  strengths,
  missing,
  hasChatted,
  roadmap,
  todayMission,
  hasActiveMissions,
  missionStreak,
  interviewCompletedCount,
  interviewLastScore,
  interviewRecommendation,
  hasResume,
  resumeScore,
  resumeUpdatedAt,
  jobTopMatches,
  targetRole,
  readiness,
  nextActionTitle,
  nextActionWhy,
  journey,
  proactiveInsight,
}: DashboardOverviewProps) {
  const { dict } = useLocale();

  return (
    <div className="space-y-6">
      <DashboardHero
        userName={userName}
        targetRole={targetRole}
        readiness={readiness}
        nextActionTitle={nextActionTitle}
        nextActionWhy={nextActionWhy}
        jobCount={jobTopMatches.length}
        journey={journey}
        proactiveInsight={proactiveInsight}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CareerTimelineWidget milestones={roadmap?.milestones} />
        </div>
        <div className="space-y-4">
          <CareerScoreWidget score={score} strengths={strengths} missing={missing} />
          <TodayMissionCard
            mission={todayMission}
            hasRoadmap={roadmap !== null}
            hasActiveMissions={hasActiveMissions}
            streak={missionStreak}
          />
          <RoadmapProgressCard roadmap={roadmap} />
          <InterviewCard
            completedCount={interviewCompletedCount}
            lastScore={interviewLastScore}
            recommendation={interviewRecommendation}
          />
          <ResumeCard hasResume={hasResume} score={resumeScore} updatedAt={resumeUpdatedAt} />
          <JobsCard topMatches={jobTopMatches} />
        </div>
      </div>

      <CareerDnaWidget dna={dna} />

      {!hasChatted && (
        <FeatureCard
          href="/dashboard/questionnaire"
          icon={ClipboardList}
          title={dict.dashboard.startChatCard.title}
          description={dict.dashboard.startChatCard.description}
          comingSoonLabel={dict.common.comingSoon}
          openLabel={dict.dashboard.startChatCard.cta}
          available
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featureCards.map(({ key, href, icon, available }) => (
          <FeatureCard
            key={key}
            href={href}
            icon={icon}
            title={dict.dashboard.cards[key].title}
            description={dict.dashboard.cards[key].description}
            comingSoonLabel={dict.common.comingSoon}
            openLabel={dict.common.open}
            available={available}
          />
        ))}
      </div>
    </div>
  );
}
