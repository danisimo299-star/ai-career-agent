"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WelcomeScreen } from "./welcome-screen";
import { ProductTour, type TourStep } from "./product-tour";
import { useLocale } from "@/lib/i18n/locale-provider";

type Stage = "hidden" | "welcome" | "tour";

/**
 * Mounted once in the dashboard shell. Shows Welcome → 5-step spotlight tour
 * on a brand-new user's first visit (`tourCompleted === false`), or whenever
 * `?tour=replay` is present (Settings → "Replay tour" — item 16: a replay
 * never touches `tourCompleted`, it only re-shows the same UI).
 */
export function DashboardTour({ tourCompleted }: { tourCompleted: boolean }) {
  const { dict } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReplay = searchParams.get("tour") === "replay";

  const [stage, setStage] = useState<Stage>(!tourCompleted || isReplay ? "welcome" : "hidden");

  const steps: TourStep[] = (["profile", "chat", "tools", "search", "settings"] as const).map((key) => ({
    selector: key,
    title: dict.onboardingTour.steps[key].title,
    description: dict.onboardingTour.steps[key].description,
  }));

  const clearReplayParam = () => {
    if (!isReplay) return;
    const params = new URLSearchParams(searchParams);
    params.delete("tour");
    router.replace(params.size > 0 ? `/dashboard?${params}` : "/dashboard");
  };

  const finish = async () => {
    setStage("hidden");
    clearReplayParam();
    if (isReplay) return; // Replays never write `tourCompleted` — see item 16.
    try {
      await fetch("/api/onboarding/tour", { method: "POST" });
    } catch {
      // Non-critical — worst case the tour offers itself again next visit.
    }
  };

  if (stage === "hidden") return null;

  return (
    <>
      <WelcomeScreen open={stage === "welcome"} onStart={() => setStage("tour")} />
      {stage === "tour" && <ProductTour steps={steps} onFinish={finish} onSkip={finish} />}
    </>
  );
}
