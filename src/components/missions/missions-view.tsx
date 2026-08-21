"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles, RotateCw, Target, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

type ErrorKind = "generic" | "ai_invalid_response" | "no_roadmap" | null;

export function MissionsView({
  initialMissions,
  initialInsight,
  hasRoadmap,
  careerTitle,
  initialCareerScore,
  roadmapProgressPercent,
  currentMilestoneTitle,
  history,
}: MissionsViewProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.missionsPage;

  const [missions, setMissions] = useState(initialMissions);
  const [insight, setInsight] = useState(initialInsight);
  const [careerScore, setCareerScore] = useState(initialCareerScore);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<ErrorKind>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [skipTargetId, setSkipTargetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedMission = missions.find((m) => m.id === selectedMissionId) ?? null;
  const hasActive = missions.some((m) => m.status === "AVAILABLE" || m.status === "IN_PROGRESS");

  const errorMessage = (kind: ErrorKind) => {
    if (kind === "ai_invalid_response") return page.errorAiInvalid;
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
      if (!response.ok) throw new Error("failed");
      const data = await response.json();
      if (data.missions) setMissions(data.missions);
      if (typeof data.careerScore === "number") setCareerScore(data.careerScore);
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

  if (!hasRoadmap) {
    return (
      <div className="space-y-6">
        <MissionsHeader
          careerTitle={null}
          careerScore={careerScore}
          roadmapProgressPercent={0}
          currentMilestoneTitle={null}
        />
        <EmptyState icon={Map} title={page.noRoadmapTitle} description={page.noRoadmapDescription} />
        <div className="flex justify-center">
          <Button nativeButton={false} render={<Link href="/dashboard/roadmap">{page.createRoadmapCta}</Link>} />
        </div>
      </div>
    );
  }

  const [main, ...secondary] = missions;

  return (
    <div className="space-y-6">
      <MissionsHeader
        careerTitle={careerTitle}
        careerScore={careerScore}
        roadmapProgressPercent={roadmapProgressPercent}
        currentMilestoneTitle={currentMilestoneTitle}
      />

      <InsightBanner text={insight} />

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

          {main && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">{page.mainMissionLabel}</p>
              <MissionCard mission={main} variant="main" onOpen={setSelectedMissionId} />
            </div>
          )}

          {secondary.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">{page.secondaryMissionsLabel}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {secondary.map((mission) => (
                  <MissionCard key={mission.id} mission={mission} variant="secondary" onOpen={setSelectedMissionId} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <MissionHistory history={history} />

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
    </div>
  );
}
