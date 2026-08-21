"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, MessageSquareText, FileEdit, Bookmark, BookmarkCheck, ChevronDown, ChevronUp, MapPin, GraduationCap, Check, Triangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import { formatSalary } from "@/lib/career/salary-format";
import { isSafeExternalUrl } from "@/lib/security/url-safety";
import type { JobSearchResultItemData, JobEmployment, JobExperience } from "./types";

interface JobCardProps {
  item: JobSearchResultItemData;
  saved: boolean;
  onSave: () => void;
  onPrepare: () => void;
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

export function JobCard({ item, saved, onSave, onPrepare }: JobCardProps) {
  const { locale, dict } = useLocale();
  const page = dict.dashboard.jobsPage;
  const [expanded, setExpanded] = useState(false);
  const { vacancy, match } = item;

  const salary = formatSalary(vacancy.salaryMin, vacancy.salaryMax, vacancy.currency, locale);
  const salaryLabel =
    salary.kind === "range"
      ? page.card.salary.range.replace("{min}", salary.min!).replace("{max}", salary.max!).replace("{currency}", salary.currencySymbol ?? "")
      : salary.kind === "from"
        ? page.card.salary.from.replace("{min}", salary.min!).replace("{currency}", salary.currencySymbol ?? "")
        : salary.kind === "to"
          ? page.card.salary.to.replace("{max}", salary.max!).replace("{currency}", salary.currencySymbol ?? "")
          : page.card.salary.undisclosed;

  const publishedLabel = vacancy.publishedAt
    ? page.card.publishedTemplate.replace("{date}", new Date(vacancy.publishedAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US"))
    : null;

  const canOpen = isSafeExternalUrl(vacancy.sourceUrl);

  return (
    <Card className="hover-lift">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{vacancy.title}</CardTitle>
          <p className="text-muted-foreground truncate text-sm">{vacancy.company}</p>
        </div>
        <motion.span
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`shrink-0 text-lg font-bold ${scoreColor(match.score)}`}
        >
          {match.score}%
        </motion.span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {vacancy.workFormat === "REMOTE" ? (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {page.card.remoteLabel}
            </span>
          ) : (
            vacancy.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {vacancy.location}
              </span>
            )
          )}
          {vacancy.experienceLevel && (
            <span className="flex items-center gap-1">
              <GraduationCap className="size-3.5" />
              {page.filters.experience[vacancy.experienceLevel as JobExperience]}
            </span>
          )}
          <span>{salaryLabel}</span>
          {vacancy.employmentType === "probation" && <Badge variant="secondary">{page.card.internshipBadge}</Badge>}
          {vacancy.employmentType && vacancy.employmentType !== "probation" && (
            <Badge variant="outline">{page.filters.employment[vacancy.employmentType as JobEmployment]}</Badge>
          )}
          {publishedLabel && <span>{publishedLabel}</span>}
        </div>

        <p className="text-muted-foreground text-xs">
          {page.card.sourceLabelTemplate.replace("{source}", vacancy.isSearchLink ? page.card.sourceDemo : page.card.sourceHh)}
        </p>

        {match.positiveFraming && <p className="text-sm text-emerald-700 dark:text-emerald-400">{page.card.positiveFraming}</p>}
        {match.roadmapPrioritySkill && (
          <p className="text-primary text-sm">{page.card.roadmapPriorityTemplate.replace("{skill}", match.roadmapPrioritySkill)}</p>
        )}

        {(match.matchedSkills.length > 0 || match.missingSkills.length > 0) && (
          <div className="space-y-1.5">
            {match.matchedSkills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground text-xs">{page.card.matchedSkillsLabel}:</span>
                {match.matchedSkills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    <Check className="size-3" />
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {match.missingSkills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground text-xs">{page.card.missingSkillsLabel}:</span>
                {match.missingSkills.map((s) => (
                  <Badge key={s} variant="outline" className="gap-1">
                    <Triangle className="size-3" />
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-muted-foreground flex items-center gap-1 text-xs hover:underline">
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          {page.matchBreakdown.title}
        </button>
        {expanded && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-5">
              {(["skills", "experience", "location", "careerGoal", "salary"] as const).map((key) => (
                <div key={key} className="flex justify-between gap-2 sm:flex-col sm:gap-0.5">
                  <span className="text-muted-foreground">{page.matchBreakdown[key]}</span>
                  <span className="font-medium">{match.breakdown[key]}%</span>
                </div>
              ))}
            </div>
            {(vacancy.requirementSnippet || vacancy.responsibilitySnippet) && (
              <div className="space-y-1.5 border-t pt-3 text-xs">
                {vacancy.requirementSnippet && (
                  <p>
                    <span className="text-muted-foreground">{page.card.requirementsLabel}: </span>
                    {vacancy.requirementSnippet}
                  </p>
                )}
                {vacancy.responsibilitySnippet && (
                  <p>
                    <span className="text-muted-foreground">{page.card.responsibilitiesLabel}: </span>
                    {vacancy.responsibilitySnippet}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {canOpen && (
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={
                <a href={vacancy.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  {vacancy.isSearchLink ? page.card.openSearchCta : page.card.openVacancyCta}
                </a>
              }
            />
          )}
          <Button size="sm" variant="outline" onClick={onPrepare}>
            <MessageSquareText />
            {page.card.prepareCta}
          </Button>
          <Button size="sm" variant="outline" onClick={onPrepare}>
            <FileEdit />
            {page.card.improveResumeCta}
          </Button>
          <Button size="sm" variant={saved ? "secondary" : "outline"} onClick={onSave} disabled={saved}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={saved ? "saved" : "unsaved"}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="inline-flex items-center"
              >
                {saved ? <BookmarkCheck /> : <Bookmark />}
              </motion.span>
            </AnimatePresence>
            {saved ? page.card.savedCta : page.card.saveCta}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
