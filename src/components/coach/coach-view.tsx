"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocale } from "@/lib/i18n/locale-provider";
import { ChatPanel } from "./chat-panel";
import { ProactiveInsightBanner } from "./proactive-insight-banner";
import { OverviewPanel } from "./overview-panel";
import { SkillGapPanel } from "./skill-gap-panel";
import { PlanPanel } from "./plan-panel";
import { ComparePanel } from "./compare-panel";
import type { CoachMessageData, CoachContextSnapshotData, ReadinessResultData, ApplicationAnalyticsData, CareerPlanData } from "./types";

interface CoachViewProps {
  initialMessages: CoachMessageData[];
  context: CoachContextSnapshotData;
  readiness: ReadinessResultData;
  applicationAnalytics: ApplicationAnalyticsData;
  nextActions: string[];
  plan: CareerPlanData | null;
}

type CoachTab = "chat" | "overview" | "skillGap" | "plan" | "compare";

export function CoachView({ initialMessages, context, readiness, applicationAnalytics, nextActions, plan }: CoachViewProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.coachPage;

  const [tab, setTab] = useState<CoachTab>("chat");

  return (
    <div className="space-y-6">
      <PageHeader
        title={page.title}
        description={page.subtitle}
        icon={
          <div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
            <Sparkles className="size-5" />
          </div>
        }
      />

      {context.proactiveInsight && <ProactiveInsightBanner targetRole={context.targetRole} insight={context.proactiveInsight} />}

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as CoachTab)}>
        <div className="overflow-x-auto">
          <TabsList className="w-max min-w-full sm:w-fit sm:min-w-0">
            <TabsTrigger value="chat">{page.tabs.chat}</TabsTrigger>
            <TabsTrigger value="overview">{page.tabs.overview}</TabsTrigger>
            <TabsTrigger value="skillGap">{page.tabs.skillGap}</TabsTrigger>
            <TabsTrigger value="plan">{page.tabs.plan}</TabsTrigger>
            <TabsTrigger value="compare">{page.tabs.compare}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" keepMounted className="mt-4">
          <ChatPanel initialMessages={initialMessages} targetRole={context.targetRole} onMessageSent={() => {}} />
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <OverviewPanel readiness={readiness} applicationAnalytics={applicationAnalytics} nextActions={nextActions} context={context} />
        </TabsContent>

        <TabsContent value="skillGap" className="mt-4">
          <SkillGapPanel defaultTargetRole={context.targetRole} defaultCity={context.city} />
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <PlanPanel plan={plan} />
        </TabsContent>

        <TabsContent value="compare" className="mt-4">
          <ComparePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
