"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { CareerDnaWidget } from "@/components/dashboard/career-dna-widget";
import { CareerScoreWidget } from "@/components/dashboard/career-score-widget";
import { RecommendationCard, type RecommendationData } from "./recommendation-card";
import { InsightsCard } from "./insights-card";
import { MissionList, type MissionData } from "./mission-list";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getInitials } from "@/lib/utils";
import type { CareerDnaScores } from "@/lib/ai/career/types";
import type { ScoreStrengthKey, ScoreMissingKey } from "@/lib/career/score";
import {
  ArrowRight,
  Sparkles,
  IdCard,
  History,
  Cake,
  MapPin,
  GraduationCap,
  Briefcase,
  Wallet,
  Globe2,
  Heart,
  Target,
  Wrench,
  Star,
} from "lucide-react";

/** Rotates decoratively across the fact chips below — purely visual variety for one self-contained card, not the app-wide per-feature tone coding those tokens carry elsewhere. */
const CHIP_TONES = [
  "bg-tool-profile-solid",
  "bg-tool-roadmap-solid",
  "bg-tool-resume-solid",
  "bg-tool-jobs-solid",
  "bg-tool-interview-solid",
  "bg-tool-tasks-solid",
];

function FactChip({ icon: Icon, label, value, toneClass }: { icon: LucideIcon; label: string; value: string; toneClass: string }) {
  return (
    <div className="border-border/70 flex items-center gap-2.5 rounded-lg border p-2.5">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-white ${toneClass}`}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-[11px] font-medium tracking-wide uppercase">{label}</p>
        <p className="text-foreground truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
      <Icon className="size-3.5" />
      {children}
    </p>
  );
}

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
  summary?: string | null;
  missions: MissionData[];
  interviewHistory: { id: string; completedAt: string; topCareerTitle: string | null }[];
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
  summary,
  missions,
  interviewHistory,
}: CareerPassportViewProps) {
  const { dict, locale } = useLocale();
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

      <Card className="profymind-glow">
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center gap-3.5">
            <Avatar size="lg" className="bg-tool-profile-solid text-base font-semibold text-white">
              <AvatarFallback className="bg-transparent">{getInitials(userName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold tracking-tight">{userName ?? page.profileTitle}</h2>
              <p className="text-muted-foreground truncate text-sm">
                {[profile.city, educationLabel].filter(Boolean).join(" · ") || page.profileTitle}
              </p>
            </div>
          </div>

          {(() => {
            const facts = [
              profile.age !== null && { icon: Cake, label: page.ageLabel, value: String(profile.age) },
              profile.city && { icon: MapPin, label: page.cityLabel, value: profile.city },
              educationLabel && { icon: GraduationCap, label: page.educationLabel, value: educationLabel },
              profile.preferredFormat && {
                icon: Briefcase,
                label: page.formatLabel,
                value: translateTag(page.workFormat as unknown as Record<string, string>, profile.preferredFormat),
              },
              profile.salaryExpectation && { icon: Wallet, label: page.salaryLabel, value: profile.salaryExpectation },
              profile.languages.length > 0 && { icon: Globe2, label: page.languagesLabel, value: profile.languages.join(", ") },
            ].filter((f): f is { icon: LucideIcon; label: string; value: string } => Boolean(f));

            return facts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {facts.map((fact, i) => (
                  <FactChip key={fact.label} {...fact} toneClass={CHIP_TONES[i % CHIP_TONES.length]} />
                ))}
              </div>
            ) : null;
          })()}

          {profile.interests.length > 0 && (
            <div className="space-y-1.5">
              <SectionHeading icon={Heart}>{page.interestsTitle}</SectionHeading>
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
              <SectionHeading icon={Target}>{page.goalsTitle}</SectionHeading>
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
              <SectionHeading icon={Wrench}>{page.skillsTitle}</SectionHeading>
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
              <SectionHeading icon={Star}>{page.personalStrengthsTitle}</SectionHeading>
              <div className="flex flex-wrap gap-1.5">
                {profile.strengths.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

      <InsightsCard summary={summary} insights={insights} />

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

      {interviewHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <History className="text-muted-foreground size-4" />
            <h2 className="text-sm font-medium">{page.historyTitle}</h2>
          </div>
          <Card>
            <CardContent className="divide-y py-0">
              {interviewHistory.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(attempt.completedAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="font-medium">{attempt.topCareerTitle ?? page.historyUntitled}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
