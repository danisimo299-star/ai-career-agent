"use client";

import { Sparkles, TrendingUp, TrendingDown, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { InsightBanner } from "@/components/shared/insight-banner";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { InterviewSessionData, WeakSkillRecommendationData } from "./types";

interface InterviewReportViewProps {
  session: InterviewSessionData;
  weakSkill: WeakSkillRecommendationData | null;
  onStartNew: () => void;
}

function CategoryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

export function InterviewReportView({ session, weakSkill, onStartNew }: InterviewReportViewProps) {
  const { dict } = useLocale();
  const r = dict.dashboard.interviewPage.report;
  const setup = dict.dashboard.interviewPage.setup;
  const report = session.report;
  if (!report) return null;

  const answeredQuestions = session.questions.filter((q) => q.userAnswer !== null);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-muted-foreground text-sm">{r.title}</p>
            <p className="text-4xl font-bold">
              {report.overallScore}
              <span className="text-muted-foreground text-lg font-normal"> {r.outOf}</span>
            </p>
            <p className="text-muted-foreground max-w-md text-sm">{report.overallResult}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CategoryRow label={r.categoryScores.technicalKnowledge} value={report.categoryScores.technicalKnowledge} />
            <CategoryRow label={r.categoryScores.communication} value={report.categoryScores.communication} />
            <CategoryRow label={r.categoryScores.answerQuality} value={report.categoryScores.answerQuality} />
            <CategoryRow label={r.categoryScores.problemSolving} value={report.categoryScores.problemSolving} />
            <CategoryRow label={r.categoryScores.confidence} value={report.categoryScores.confidence} />
          </div>
        </CardContent>
      </Card>

      {weakSkill && (
        <InsightBanner text={r.weakSkillRecommendationTemplate.replaceAll("{skill}", weakSkill.skill)} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="text-primary size-4" />
              {r.strongestAreasTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {report.strongestAreas.map((area) => (
              <Badge key={area} variant="secondary">
                {area}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="text-muted-foreground size-4" />
              {r.areasToImproveTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {report.areasToImprove.map((area) => (
              <Badge key={area} variant="outline">
                {area}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="text-primary size-4" />
            {r.nextStepsTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-1.5 text-sm">
            {report.nextSteps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <ListChecks className="size-4" />
          {r.reviewTitle}
        </p>
        {answeredQuestions.map((question, i) => (
          <Card key={question.id}>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{setup.types[question.type === "MIXED" ? "GENERAL" : question.type]}</Badge>
                {question.skill && <Badge variant="outline">{question.skill}</Badge>}
                {question.isFollowUp && <Badge variant="outline">{dict.dashboard.interviewPage.session.followUpBadge}</Badge>}
                <span className="text-muted-foreground ml-auto font-medium">{question.score ?? "—"} / 100</span>
              </div>
              <p className="font-medium">
                {i + 1}. {question.question}
              </p>
              <div>
                <p className="text-muted-foreground text-xs">{r.yourAnswerLabel}</p>
                <p>{question.userAnswer}</p>
              </div>
              {question.strengths && (
                <div>
                  <p className="text-muted-foreground text-xs">{r.goodLabel}</p>
                  <p>{question.strengths}</p>
                </div>
              )}
              {question.improvements && (
                <div>
                  <p className="text-muted-foreground text-xs">{r.improveLabel}</p>
                  <p>{question.improvements}</p>
                </div>
              )}
              {question.idealAnswerNotes && (
                <div>
                  <p className="text-muted-foreground text-xs">{r.idealAnswerLabel}</p>
                  <p>{question.idealAnswerNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button onClick={onStartNew}>{r.newInterviewCta}</Button>
      </div>
    </div>
  );
}
