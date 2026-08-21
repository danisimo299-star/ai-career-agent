"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, Compass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface RecommendationData {
  title: string;
  matchScore: number;
  reasoning: string;
}

export function CompletionScreen() {
  const { dict } = useLocale();
  const page = dict.questionnaire.completion;

  const [recommendations, setRecommendations] = useState<RecommendationData[] | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/career-analysis", { method: "POST" });
        if (!response.ok) throw new Error("failed");
        const data = (await response.json()) as { recommendations: RecommendationData[]; insights: string[] };
        if (!cancelled) {
          setRecommendations(data.recommendations);
          setInsights(data.insights);
        }
      } catch {
        if (!cancelled) setRecommendations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 border-t p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
          <Sparkles className="size-5" />
        </div>
        <p className="text-lg font-semibold">{page.title}</p>
      </div>

      {loading ? (
        <div className="text-muted-foreground space-y-2 py-6 text-center text-sm">
          <Sparkles className="mx-auto size-5 animate-pulse" />
        </div>
      ) : (
        <>
          {recommendations && recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{page.topDirectionsTitle}</p>
              {recommendations.slice(0, 3).map((rec, i) => (
                <Card key={rec.title} className="hover-lift">
                  <CardContent className="flex items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {i + 1}. {rec.title}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">{rec.reasoning}</p>
                    </div>
                    <span className="text-primary shrink-0 text-sm font-bold">{page.fitTemplate.replace("{score}", String(rec.matchScore))}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {insights.length > 0 && (
            <div className="bg-coach-tint space-y-2 rounded-2xl p-4">
              <p className="text-sm font-semibold">{page.noticedTitle}</p>
              <ul className="space-y-1">
                {insights.slice(0, 4).map((insight) => (
                  <li key={insight} className="text-muted-foreground flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1 block size-1.5 shrink-0 rounded-full bg-current" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <p className="text-muted-foreground text-sm">{page.transitionDescription}</p>
            <div className="flex flex-wrap gap-2">
              <Button nativeButton={false} render={<Link href="/dashboard/coach">{page.talkToCoachCta}<ArrowRight /></Link>} />
              <Button
                variant="outline"
                nativeButton={false}
                render={
                  <Link href="/dashboard/career-analysis">
                    <Compass />
                    {page.exploreCta}
                  </Link>
                }
              />
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
