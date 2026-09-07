"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Sparkles, RotateCw, Target, Map, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { InsightBanner } from "@/components/shared/insight-banner";
import { MissionsHeader } from "./missions-header";
import { MissionCard } from "./mission-card";
import { MissionDetailSheet } from "./mission-detail-sheet";
import { SkipConfirmDialog } from "./skip-confirm-dialog";
import { MissionHistory, type MissionHistoryEntry } from "./mission-history";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { CareerMissionData } from "./types";

interface MissionsViewProps {
  initialMissions: CareerMissionData[];
  initialInsight: string | null;
  hasRoadmap: boolean;
  careerTitle: string | null;
  initialCareerScore: number;
  roadmapProgressPercent: number;
  currentMilestoneTitle: string | null;
  history: MissionHistoryEntry[];
  initialStreak: number;
  embedded?: boolean;
}

type ErrorKind = "generic" | "ai_invalid_response" | "ai_unavailable" | "no_roadmap" | null;

export function MissionsView({
  initialMissions,
  initialInsight,
  hasRoadmap,
  careerTitle,
  initialCareerScore,
  roadmapProgressPercent,
  currentMilestoneTitle,
  history,
  initialStreak,
  embedded = false,
}: MissionsViewProps) {
  const { dict } = useLocale();
  const router = useRouter();
  const page = dict.dashboard.missionsPage;

  const [missions, setMissions] = useState(initialMissions);
  const [previousMissions, setPreviousMissions] = useState(initialMissions);
  if (previousMissions !== initialMissions) {
    setPreviousMissions(initialMissions);
    setMissions(initialMissions);
  }
  const [insight, setInsight] = useState(initialInsight);
  const [careerScore, setCareerScore] = useState(initialCareerScore);
  const [streak, setStreak] = useState(initialStreak);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<ErrorKind>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [skipTargetId, setSkipTargetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedMission = missions.find((m) => m.id === selectedMissionId) ?? null;
  const hasActive = missions.some((m) => m.status === "AVAILABLE" || m.status === "IN_PROGRESS");

  const errorMessage = (kind: ErrorKind) => {
    if (kind === "ai_invalid_response") return page.errorAiInvalid;
    if (kind === "ai_unavailable") return dict.common.aiUnavailable;
    return page.errorGeneration;
  };

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/career-missions/generate", { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        setError(body.error ?? "generic");
        toast.error(errorMessage(body.error ?? "generic"));
        return;
      }
      const data = (await response.json()) as { missions: CareerMissionData[]; insight: string | null };
      setMissions(data.missions);
      if (data.insight) setInsight(data.insight);
      router.refresh();
    } catch {
      setError("generic");
      toast.error(errorMessage("generic"));
    } finally {
      setGenerating(false);
    }
  };

  const runAction = async (url: string, method: "POST" = "POST", body?: unknown) => {
    setBusy(true);
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        toast.error(errorMessage(body.error ?? "generic"));
        return false;
      }
      const data = await response.json();
      if (data.missions) setMissions(data.missions);
      if (typeof data.careerScore === "number") setCareerScore(data.careerScore);
      if (typeof data.streak === "number") setStreak(data.streak);
      router.refresh();
      return true;
    } catch {
      toast.error(page.errorGeneration);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleStart = (id: string) => runAction(`/api/career-missions/${id}/start`);
  const handleComplete = (id: string) => runAction(`/api/career-missions/${id}/complete`);
  const handleRegenerate = async (id: string) => {
    const ok = await runAction(`/api/career-missions/${id}/regenerate`);
    if (ok) setSelectedMissionId(null);
  };
  const confirmSkip = async () => {
    if (!skipTargetId) return;
    const id = skipTargetId;
    setSkipTargetId(null);
    const ok = await runAction(`/api/career-missions/${id}/skip`);
    if (ok) setSelectedMissionId(null);
  };

  const historySection = (
    <details className="rounded-xl border p-4">
      <summary className="min-h-11 cursor-pointer content-center text-sm font-medium">{dict.dashboard.planPage.history}</summary>
      <div className="mt-3"><MissionHistory history={history} /></div>
    </details>
  );

  if (!hasRoadmap && embedded) return historySection;

  if (!hasRoadmap) {
    return (
      <div className="space-y-6">
        {!embedded && <MissionsHeader
          careerTitle={null}
          careerScore={careerScore}
          roadmapProgressPercent={0}
          currentMilestoneTitle={null}
        />}
        <EmptyState icon={Map} title={page.noRoadmapTitle} description={page.noRoadmapDescription} />
        <div className="flex justify-center">
          <Button nativeButton={false} render={<Link href="/dashboard/plan?view=all">{page.createRoadmapCta}</Link>} />
        </div>
      </div>
    );
  }

  const activeMissions = missions.filter((m) => m.status === "AVAILABLE" || m.status === "IN_PROGRESS");
  const closedMissions = missions.filter((m) => m.status === "COMPLETED" || m.status === "SKIPPED" || m.status === "EXPIRED");

  const renderMissionList = (list: CareerMissionData[], emptyTitle: string, emptyDescription: string) => {
    if (list.length === 0) return <EmptyState icon={ListChecks} title={emptyTitle} description={emptyDescription} />;
    const [main, ...secondary] = list;
    return (
      <>
        {main && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">{page.mainMissionLabel}</p>
            <MissionCard mission={main} variant="main" onOpen={setSelectedMissionId} />
          </div>
        )}
        {secondary.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">{page.secondaryMissionsLabel}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {secondary.map((mission) => (
                <MissionCard key={mission.id} mission={mission} variant="secondary" onOpen={setSelectedMissionId} />
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6"
    >
      {!embedded && <MissionsHeader
        careerTitle={careerTitle}
        careerScore={careerScore}
        roadmapProgressPercent={roadmapProgressPercent}
        currentMilestoneTitle={currentMilestoneTitle}
        streakDays={streak}
      />}

      {!embedded && <InsightBanner text={insight} />}
      {embedded && currentMilestoneTitle && (
        <p className="text-muted-foreground text-sm break-words">{page.currentMilestoneLabel}: <span className="text-foreground font-medium">{currentMilestoneTitle}</span></p>
      )}
      {embedded && streak > 0 && <p className="text-muted-foreground text-sm">{page.streakLabel}: {page.streakTemplate.replace("{days}", String(streak))}</p>}

      {missions.length === 0 ? (
        <>
          <EmptyState icon={Target} title={page.emptyTitle} description={page.emptyDescription} />
          <div className="flex flex-col items-center gap-3">
            <Button onClick={generate} disabled={generating}>
              {generating ? <RotateCw className="animate-spin" /> : <Sparkles />}
              {generating ? page.generating : page.generateCta}
            </Button>
            {error && <p className="text-destructive text-sm">{errorMessage(error)}</p>}
          </div>
        </>
      ) : (
        <>
          {!hasActive && (
            <div className="space-y-3">
              <EmptyState icon={Sparkles} title={page.allDoneTitle} description={page.allDoneDescription} />
              <div className="flex justify-center">
                <Button onClick={generate} disabled={generating}>
                  {generating ? <RotateCw className="animate-spin" /> : <Sparkles />}
                  {generating ? page.generating : page.generateCta}
                </Button>
              </div>
            </div>
          )}

          {embedded ? <div className="space-y-4">
            {activeMissions.length > 0 && renderMissionList(activeMissions, page.emptyTabTitle, page.emptyTabActiveDescription)}
            {closedMissions.length > 0 && <details className="rounded-xl border p-4">
              <summary className="min-h-11 cursor-pointer content-center text-sm font-medium">{dict.dashboard.planPage.completedToday} ({closedMissions.length})</summary>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {closedMissions.map((mission) => <MissionCard key={mission.id} mission={mission} variant="secondary" onOpen={setSelectedMissionId} />)}
              </div>
            </details>}
          </div> : <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="all">{page.tabs.all}</TabsTrigger>
              <TabsTrigger value="active">{page.tabs.active}</TabsTrigger>
              <TabsTrigger value="completed">{page.tabs.completed}</TabsTrigger>
            </TabsList>
            <TabsContent value="all" keepMounted className="mt-4 space-y-4">
              {renderMissionList(missions, page.emptyTabTitle, page.emptyTabActiveDescription)}
            </TabsContent>
            <TabsContent value="active" className="mt-4 space-y-4">
              {renderMissionList(activeMissions, page.emptyTabTitle, page.emptyTabActiveDescription)}
            </TabsContent>
            <TabsContent value="completed" className="mt-4 space-y-4">
              {renderMissionList(closedMissions, page.emptyTabTitle, page.emptyTabCompletedDescription)}
            </TabsContent>
          </Tabs>}
        </>
      )}

      {historySection}

      <MissionDetailSheet
        mission={selectedMission}
        onOpenChange={(open) => !open && setSelectedMissionId(null)}
        onStart={handleStart}
        onComplete={handleComplete}
        onSkip={setSkipTargetId}
        onRegenerate={handleRegenerate}
        busy={busy}
      />

      <SkipConfirmDialog open={skipTargetId !== null} onOpenChange={(open) => !open && setSkipTargetId(null)} onConfirm={confirmSkip} loading={busy} />
    </motion.div>
  );
}
