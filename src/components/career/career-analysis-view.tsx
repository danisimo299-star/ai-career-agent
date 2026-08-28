"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Compass, Sparkles, RotateCw, AlertCircle, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { RecommendationCard, type RecommendationData } from "./recommendation-card";
import { InsightsCard } from "./insights-card";
import { useLocale } from "@/lib/i18n/locale-provider";

type GenerationStatus = "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED";

interface AnalysisResult {
  recommendations: Omit<RecommendationData, "id">[];
  insights: string[];
  summary: string;
}

interface CareerAnalysisViewProps {
  initialRecommendations: RecommendationData[];
  initialInsights: string[];
  initialSummary: string | null;
  initialStatus: GenerationStatus;
  readyForAnalysis: boolean;
}

const POLL_INTERVAL_MS = 2500;
// ~300s safety net — generous, but bounded (item 6/30: never wait forever).
// Must stay comfortably above the backend's own worst-case deadline
// (`career-analysis.service.ts`'s `AI_CALL_TIMEOUT_MS`, 220s — sized to
// cover a request that has to queue behind another heavy generation before
// it even starts). A shorter window here was the actual bug: this poll gave
// up and reported FAILED while the real generation was still legitimately
// running server-side, so the only way to see the finished result was to
// leave and come back to the page (a fresh load reads the real DB status,
// which the poll should have caught but stopped checking too soon).
const MAX_POLLS = 120;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function CareerAnalysisView({
  initialRecommendations,
  initialInsights,
  initialSummary,
  initialStatus,
  readyForAnalysis,
}: CareerAnalysisViewProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.careerAnalysisPage;

  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [insights, setInsights] = useState(initialInsights);
  const [summary, setSummary] = useState(initialSummary);
  const [status, setStatus] = useState<GenerationStatus>(initialStatus);
  const [findingMore, setFindingMore] = useState(false);
  const loading = status === "PROCESSING";

  const applyResult = (data: AnalysisResult) => {
    setRecommendations(data.recommendations.map((rec, i) => ({ ...rec, id: `new-${i}` })));
    setInsights(data.insights);
    setSummary(data.summary);
    setStatus("COMPLETED");
  };

  /**
   * DB-persisted generation status (item 29) means a refresh — or a POST
   * whose response never made it back to this tab (network hiccup, a slow
   * Ollama call outliving the fetch) — is always recoverable: this polls
   * until the backend actually finishes, instead of leaving the page stuck
   * on a spinner that only a manual browser refresh used to clear.
   */
  const pollUntilDone = async () => {
    for (let i = 0; i < MAX_POLLS; i++) {
      await sleep(POLL_INTERVAL_MS);
      try {
        const response = await fetch("/api/career-analysis");
        if (!response.ok) continue;
        const data = (await response.json()) as AnalysisResult & { status: GenerationStatus };
        if (data.status === "COMPLETED") {
          applyResult(data);
          return;
        }
        if (data.status === "FAILED") {
          setStatus("FAILED");
          toast.error(dict.auth.register.errors.generic);
          return;
        }
      } catch {
        // transient — keep polling, the loop's own bound is the real limit
      }
    }
    setStatus("FAILED");
    toast.error(dict.auth.register.errors.generic);
  };

  // Only runs once, only when a PREVIOUS generation was still running server-side when this page loaded (e.g. the user refreshed mid-generation) — resumes watching it instead of leaving a dead spinner. Deferred a tick so the poll's eventual `setState` calls are never mistaken for a synchronous effect-body update.
  useEffect(() => {
    if (initialStatus !== "PROCESSING") return;
    const id = requestAnimationFrame(() => {
      pollUntilDone();
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only: re-runs must never re-trigger this from later state changes.
  }, []);

  const generate = async () => {
    setStatus("PROCESSING");
    try {
      const response = await fetch("/api/career-analysis", { method: "POST" });
      if (response.status === 409) {
        // Not a failure — this user's own generation is already running
        // (a double-click, a second tab, a retried request); watch the one
        // that's actually in flight instead of starting a redundant AI call.
        await pollUntilDone();
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        toast.error(
          body.error === "ai_unavailable"
            ? dict.common.aiUnavailable
            : body.error === "ai_busy"
              ? dict.common.aiBusy
              : dict.auth.register.errors.generic
        );
        setStatus("FAILED");
        return;
      }
      const data = (await response.json()) as AnalysisResult;
      applyResult(data);
    } catch {
      // The fetch itself failed/timed out client-side — the backend may
      // still be working (status is DB-persisted), so fall back to polling
      // rather than immediately declaring failure.
      await pollUntilDone();
    }
  };

  /**
   * "Показать ещё варианты" — adds a few more validated professions without
   * discarding what's already shown (unlike Regenerate, which replaces
   * everything). Same recovery story as `generate()` above: a slow AI call
   * (or a network hiccup on this fetch) used to just show an error and give
   * up while the backend kept working — the new recommendations only ever
   * showed up if the user happened to leave and reload the page. Falls back
   * to the same `pollUntilDone()` (it reads the persisted status and full
   * recommendation list, which is exactly what this action also produces).
   */
  const findMore = async () => {
    setFindingMore(true);
    try {
      const response = await fetch("/api/career-analysis/more", { method: "POST" });
      if (response.status === 409) {
        await pollUntilDone();
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        toast.error(
          body.error === "ai_unavailable"
            ? dict.common.aiUnavailable
            : body.error === "ai_busy"
              ? dict.common.aiBusy
              : dict.auth.register.errors.generic
        );
        return;
      }
      const data = (await response.json()) as { allRecommendations: RecommendationData[] };
      setRecommendations(data.allRecommendations);
      if (data.allRecommendations.length === recommendations.length) {
        toast(page.noMoreOptions);
      }
    } catch {
      // The fetch itself failed/timed out client-side — the backend may
      // still be working (status is DB-persisted), so fall back to polling
      // rather than immediately declaring failure.
      await pollUntilDone();
    } finally {
      setFindingMore(false);
    }
  };

  if (!readyForAnalysis && recommendations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={page.title} description={page.subtitle} icon={Compass} />
        <EmptyState
          icon={Compass}
          title={page.notReadyTitle}
          description={page.notReadyDescription}
        />
        <div className="flex justify-center">
          <Button nativeButton={false} render={<Link href="/dashboard/questionnaire">{page.chatCta}</Link>} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={page.title}
        description={page.subtitle}
        icon={Compass}
        action={
          <Button onClick={generate} disabled={loading} variant={recommendations.length > 0 ? "outline" : "default"}>
            {loading ? <RotateCw className="animate-spin" /> : <Sparkles />}
            {recommendations.length > 0 ? page.regenerateCta : page.generateCta}
          </Button>
        }
      />

      {loading && recommendations.length === 0 ? (
        <EmptyState icon={Sparkles} title={page.generatingTitle} description={page.generatingDescription} />
      ) : status === "FAILED" && recommendations.length === 0 ? (
        <div className="space-y-3">
          <EmptyState icon={AlertCircle} title={page.generationFailedTitle} description={page.generationFailedDescription} />
          <div className="flex justify-center">
            <Button onClick={generate}>
              <RotateCw />
              {page.retryCta}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <InsightsCard summary={summary} insights={insights} />

          {recommendations.length === 0 ? (
            <EmptyState icon={Compass} title={page.generateCta} description={page.notReadyDescription} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {recommendations.map((recommendation, i) => (
                  <RecommendationCard key={recommendation.id} recommendation={recommendation} rank={i + 1} />
                ))}
              </div>
              <div className="flex justify-center pt-1">
                <Button variant="outline" onClick={findMore} disabled={loading || findingMore}>
                  {findingMore ? <RotateCw className="animate-spin" /> : <PlusCircle />}
                  {page.findMoreCta}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
