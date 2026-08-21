"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, RotateCw, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RoadmapHeader } from "./roadmap-header";
import { RoadmapTimeline } from "./roadmap-timeline";
import { MilestoneDetailSheet } from "./milestone-detail-sheet";
import { CareerPickerDialog } from "./career-picker-dialog";
import { RegenerateConfirmDialog } from "./regenerate-confirm-dialog";
import { InsightBanner } from "@/components/shared/insight-banner";
import { useLocale } from "@/lib/i18n/locale-provider";
import { computeRoadmapProgress, estimateMonthsRange } from "@/lib/career/roadmap-progress";
import type { RoadmapData } from "./types";

interface RoadmapViewProps {
  initialRoadmap: RoadmapData | null;
  careerScore: number;
  suggestedCareerTitle: string | null;
}

type ErrorKind = "generic" | "ai_invalid_response" | "invalid_input" | null;

export function RoadmapView({ initialRoadmap, careerScore, suggestedCareerTitle }: RoadmapViewProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.roadmapPage;

  const [roadmap, setRoadmap] = useState(initialRoadmap);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<ErrorKind>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [careerPickerOpen, setCareerPickerOpen] = useState(false);
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);
  const [startingMilestone, setStartingMilestone] = useState(false);

  const selectedMilestone = roadmap?.milestones.find((m) => m.id === selectedMilestoneId) ?? null;

  const errorMessage = (kind: ErrorKind) => {
    if (kind === "ai_invalid_response") return page.errorAiInvalid;
    if (kind === "invalid_input") return page.errorGeneration;
    return page.errorGeneration;
  };

  const generate = async (careerTitle: string) => {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerTitle }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        setError(body.error ?? "generic");
        toast.error(errorMessage(body.error ?? "generic"));
        return;
      }

      const data = (await response.json()) as { roadmap: RoadmapData };
      setRoadmap(data.roadmap);
    } catch {
      setError("generic");
      toast.error(errorMessage("generic"));
    } finally {
      setGenerating(false);
    }
  };

  const handleStartMilestone = async (milestoneId: string) => {
    setStartingMilestone(true);
    try {
      const response = await fetch(`/api/roadmap/milestones/${milestoneId}/start`, { method: "POST" });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { roadmap: RoadmapData };
      setRoadmap(data.roadmap);
    } catch {
      toast.error(page.errorGeneration);
    } finally {
      setStartingMilestone(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    // optimistic update
    setRoadmap((prev) =>
      prev
        ? {
            ...prev,
            milestones: prev.milestones.map((m) => ({
              ...m,
              tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, completed } : t)),
            })),
          }
        : prev
    );

    try {
      const response = await fetch(`/api/roadmap/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { roadmap: RoadmapData };
      setRoadmap(data.roadmap);
    } catch {
      toast.error(page.errorGeneration);
      if (roadmap) setRoadmap(roadmap);
    }
  };

  if (!roadmap) {
    return (
      <div className="space-y-6">
        <PageHeader title={page.title} description={page.subtitle} />
        <div className="bg-roadmap-tint space-y-6 rounded-3xl p-4 sm:p-6">
          <EmptyState icon={Map} title={page.emptyTitle} description={page.emptyDescription} />
          <div className="flex flex-col items-center gap-3">
            <Button onClick={() => setCareerPickerOpen(true)} disabled={generating}>
              {generating ? <RotateCw className="animate-spin" /> : <Sparkles />}
              {generating ? page.generating : page.generateCta}
            </Button>
            {error && <p className="text-destructive text-sm">{errorMessage(error)}</p>}
          </div>
        </div>

        <CareerPickerDialog
          open={careerPickerOpen}
          onOpenChange={setCareerPickerOpen}
          currentCareerTitle={suggestedCareerTitle}
          onSelect={(title) => generate(title)}
        />
      </div>
    );
  }

  const progress = computeRoadmapProgress(roadmap.milestones);
  const remainingWeeks = roadmap.milestones
    .filter((m) => m.status !== "COMPLETED")
    .reduce((sum, m) => sum + m.estimatedWeeks, 0);
  const estimatedRange = estimateMonthsRange(remainingWeeks || 1);

  const upcomingSkills = roadmap.milestones.filter((m) => m.status !== "COMPLETED").flatMap((m) => m.skills);
  const insightText =
    upcomingSkills[0] && upcomingSkills[1]
      ? page.aiInsightTemplate.replace("{skill1}", upcomingSkills[0]).replace("{skill2}", upcomingSkills[1])
      : null;

  return (
    <div className="space-y-6">
      <RoadmapHeader
        careerTitle={roadmap.careerTitle}
        careerScore={careerScore}
        progress={progress}
        estimatedRange={estimatedRange}
        onChangeCareer={() => setCareerPickerOpen(true)}
        onRegenerate={() => setRegenerateConfirmOpen(true)}
      />

      <InsightBanner text={insightText} />

      <div className="bg-roadmap-tint rounded-3xl p-4 sm:p-6">
        <RoadmapTimeline milestones={roadmap.milestones} onSelect={setSelectedMilestoneId} />
      </div>

      <MilestoneDetailSheet
        milestone={selectedMilestone}
        onOpenChange={(open) => !open && setSelectedMilestoneId(null)}
        onStartMilestone={handleStartMilestone}
        onToggleTask={handleToggleTask}
        starting={startingMilestone}
      />

      <CareerPickerDialog
        open={careerPickerOpen}
        onOpenChange={setCareerPickerOpen}
        currentCareerTitle={roadmap.careerTitle}
        onSelect={(title) => generate(title)}
      />

      <RegenerateConfirmDialog
        open={regenerateConfirmOpen}
        onOpenChange={setRegenerateConfirmOpen}
        loading={generating}
        onConfirm={() => {
          setRegenerateConfirmOpen(false);
          generate(roadmap.careerTitle);
        }}
      />
    </div>
  );
}
