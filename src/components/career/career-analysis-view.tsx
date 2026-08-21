"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Compass, Sparkles, RotateCw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { RecommendationCard, type RecommendationData } from "./recommendation-card";
import { InsightsCard } from "./insights-card";
import { useLocale } from "@/lib/i18n/locale-provider";

interface CareerAnalysisViewProps {
  initialRecommendations: RecommendationData[];
  initialInsights: string[];
  readyForAnalysis: boolean;
}

export function CareerAnalysisView({
  initialRecommendations,
  initialInsights,
  readyForAnalysis,
}: CareerAnalysisViewProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.careerAnalysisPage;

  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [insights, setInsights] = useState(initialInsights);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/career-analysis", { method: "POST" });
      if (!response.ok) throw new Error("failed");

      const data = (await response.json()) as {
        recommendations: Omit<RecommendationData, "id">[];
        insights: string[];
      };
      setRecommendations(data.recommendations.map((rec, i) => ({ ...rec, id: `new-${i}` })));
      setInsights(data.insights);
    } catch {
      toast.error(dict.auth.register.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  if (!readyForAnalysis && recommendations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={page.title} description={page.subtitle} />
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
        action={
          <Button onClick={generate} disabled={loading} variant={recommendations.length > 0 ? "outline" : "default"}>
            {loading ? <RotateCw className="animate-spin" /> : <Sparkles />}
            {recommendations.length > 0 ? page.regenerateCta : page.generateCta}
          </Button>
        }
      />

      <InsightsCard insights={insights} />

      {recommendations.length === 0 ? (
        <EmptyState icon={Compass} title={page.generateCta} description={page.notReadyDescription} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recommendations.map((recommendation, i) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
