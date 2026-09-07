"use client";

import { useState } from "react";
import { Sparkles, Target, GraduationCap, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
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

  const contextChips = [
    context.targetRole && { icon: Target, label: page.contextGoal },
    context.skillGapPercent !== null && { icon: GraduationCap, label: page.contextSkills },
    context.resumeScore !== null && { icon: FileText, label: page.contextResume },
  ].filter((c): c is { icon: typeof Target; label: string } => Boolean(c));

  return (
    <div className="flex flex-col gap-6">
      <div className="shrink-0 space-y-2">
        <PageHeader title={page.title} description={page.subtitle} icon={Sparkles} tone="chat" />
        <p className="text-muted-foreground pl-[3.25rem] text-xs">{page.helperLine}</p>
        {contextChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pl-[3.25rem]">
            <span className="text-muted-foreground text-xs">{page.contextStripLabel}</span>
            {contextChips.map(({ icon: Icon, label }) => (
              <Badge key={label} variant="secondary" className="gap-1 text-xs">
                <Icon className="size-3" />
                {label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {context.proactiveInsight && (
        <div className="shrink-0">
          <ProactiveInsightBanner targetRole={context.targetRole} insight={context.proactiveInsight} />
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as CoachTab)} className="flex flex-col">
        <div className="shrink-0 overflow-x-auto">
          {/* `flex-none` overrides `TabsTrigger`'s shared `flex-1` — that
              default (equal-width, divide the bar evenly) is right for a
              short tab set that always fits, but fights this bar's
              `overflow-x-auto` + `w-max`: with 5 tabs (one of them long,
              "Сравнить профессии") and `flex-1`'s `flex-basis: 0`, every
              trigger got squeezed into an equal, too-narrow slice instead
              of sizing to its own label — and since triggers are also
              `whitespace-nowrap`, the overflowing text visually spilled
              into its neighbors instead of scrolling. Sized to natural
              content width per tab, the strip's true width exceeds the
              viewport and scrolls horizontally as intended. */}
          <TabsList className="w-max min-w-full sm:w-fit sm:min-w-0">
            <TabsTrigger value="chat" className="flex-none">
              {page.tabs.chat}
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex-none">
              {page.tabs.overview}
            </TabsTrigger>
            <TabsTrigger value="skillGap" className="flex-none">
              {page.tabs.skillGap}
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex-none">
              {page.tabs.plan}
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex-none">
              {page.tabs.compare}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" keepMounted className="mt-4">
          <ChatPanel initialMessages={initialMessages} onMessageSent={() => {}} />
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
