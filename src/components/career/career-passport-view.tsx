"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { CareerDnaWidget } from "@/components/dashboard/career-dna-widget";
import { CareerScoreWidget } from "@/components/dashboard/career-score-widget";
import { RecommendationCard, type RecommendationData } from "./recommendation-card";
import { InsightsCard } from "./insights-card";
import { MissionList, type MissionData } from "./mission-list";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { CareerDnaScores } from "@/lib/ai/career/types";
import type { ScoreStrengthKey, ScoreMissingKey } from "@/lib/career/score";
import { ArrowRight, Sparkles, IdCard } from "lucide-react";

interface PassportProfile {
  age: number | null;
  city: string | null;
  educationStage: string | null;
  interests: string[];
  goals: string[];
  skills: string[];
  strengths: string[];
  preferredFormat: string | null;
  salaryExpectation: string | null;
  languages: string[];
}

interface CareerPassportViewProps {
  userName: string | null;
  profile: PassportProfile;
  dna: CareerDnaScores | null;
  score: number;
  strengths: ScoreStrengthKey[];
  missing: ScoreMissingKey[];
  recommendations: RecommendationData[];
  insights: string[];
  missions: MissionData[];
}

function translateTag(options: Record<string, string>, key: string): string {
  return options[key] ?? key;
}

export function CareerPassportView({
  userName,
  profile,
  dna,
  score,
  strengths,
  missing,
  recommendations,
  insights,
  missions,
}: CareerPassportViewProps) {
  const { dict } = useLocale();
  const page = dict.passport;

  const educationLabel = profile.educationStage
    ? translateTag(
        dict.onboarding.steps.education.options as unknown as Record<string, string>,
        profile.educationStage.toLowerCase()
      )
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title={page.title} description={page.subtitle} icon={IdCard} tone="profile" />

      <Card>
        <CardHeader>
          <CardTitle>{userName ?? page.profileTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs">{page.ageLabel}</p>
              <p className="text-foreground font-medium">{profile.age ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs">{page.cityLabel}</p>
              <p className="text-foreground font-medium">{profile.city ?? "—"}</p>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <p className="text-xs">{page.educationLabel}</p>
              <p className="text-foreground font-medium">{educationLabel ?? "—"}</p>
            </div>
          </div>

          {profile.interests.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{page.interestsTitle}</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <Badge key={interest} variant="secondary">
                    {translateTag(
                      dict.onboarding.steps.interests.options as unknown as Record<string, string>,
                      interest
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.goals.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{page.goalsTitle}</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.goals.map((goal) => (
                  <Badge key={goal} variant="secondary">
                    {translateTag(dict.onboarding.steps.goals.options as unknown as Record<string, string>, goal)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.skills.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{page.skillsTitle}</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.strengths.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{page.personalStrengthsTitle}</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.strengths.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(profile.preferredFormat || profile.salaryExpectation || profile.languages.length > 0) && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{page.preferencesTitle}</p>
              <div className="text-muted-foreground grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {profile.preferredFormat && (
                  <div>
                    <p className="text-xs">{page.formatLabel}</p>
                    <p className="text-foreground font-medium">
                      {translateTag(page.workFormat as unknown as Record<string, string>, profile.preferredFormat)}
                    </p>
                  </div>
                )}
                {profile.salaryExpectation && (
                  <div>
                    <p className="text-xs">{page.salaryLabel}</p>
                    <p className="text-foreground font-medium">{profile.salaryExpectation}</p>
                  </div>
                )}
                {profile.languages.length > 0 && (
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs">{page.languagesLabel}</p>
                    <p className="text-foreground font-medium">{profile.languages.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <CareerDnaWidget dna={dna} />
        <CareerScoreWidget score={score} strengths={strengths} missing={missing} />
      </div>

      <Button
        variant="outline"
        className="w-fit"
        nativeButton={false}
        render={
          <Link href="/dashboard/coach">
            <Sparkles />
            {page.discussCta}
          </Link>
        }
      />

      <InsightsCard insights={insights} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{page.recommendationsTitle}</h2>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={
              <Link href="/dashboard/career-analysis">
                {page.viewAll}
                <ArrowRight />
              </Link>
            }
          />
        </div>
        {recommendations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={rec.id} recommendation={rec} rank={i + 1} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{page.noRecommendations}</p>
        )}
      </div>

      <MissionList missions={missions} />
    </div>
  );
}
