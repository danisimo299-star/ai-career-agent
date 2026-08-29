"use client";

import { useMemo, useState } from "react";
import { Sparkles, RotateCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxPopup,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { careerOptions } from "@/lib/ai/career/mock-data";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { InterviewSetupInput, InterviewQuestionType, InterviewDifficulty, InterviewExperienceLevel } from "./types";

const interviewTypes: InterviewQuestionType[] = ["MIXED", "TECHNICAL", "BEHAVIORAL", "HR", "GENERAL", "RESUME_BASED"];
const difficulties: InterviewDifficulty[] = ["EASY", "MEDIUM", "HARD"];
const experienceLevels: InterviewExperienceLevel[] = ["STUDENT", "JUNIOR", "MID", "SENIOR"];
const questionCounts = [5, 10, 15] as const;

/** Matches the API's own `startSessionSchema` cap (`start/route.ts`) — kept in sync manually since one lives in a Zod schema and the other in a plain UI constant. */
const MAX_TARGET_ROLE_LENGTH = 150;

interface InterviewSetupFormProps {
  defaultTargetRole: string | null;
  /** A specific role to prepare for (e.g. a vacancy title from Jobs' "Prepare for Interview") that may not exist in the fixed `careerOptions` catalog — added as an extra selectable option rather than silently falling back to a catalog entry. */
  initialCustomRole?: string | null;
  starting: boolean;
  error: string | null;
  onStart: (input: InterviewSetupInput) => void;
}

export function InterviewSetupForm({ defaultTargetRole, initialCustomRole, starting, error, onStart }: InterviewSetupFormProps) {
  const { locale, dict } = useLocale();
  const setup = dict.dashboard.interviewPage.setup;

  const customRole = initialCustomRole && !careerOptions.some((o) => o.title[locale] === initialCustomRole) ? initialCustomRole : null;
  const defaultRoleOption = careerOptions.find((o) => o.title[locale] === defaultTargetRole);
  // Career Profile's recommended role, when it's a catalog title — pinned to
  // the top of the suggestion list, but the field stays a free-text combobox
  // either way, so the user is never forced onto it.
  const recommendedRole = defaultRoleOption?.title[locale] ?? null;

  const [targetRole, setTargetRole] = useState(customRole ?? recommendedRole ?? careerOptions[0].title[locale]);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [interviewType, setInterviewType] = useState<InterviewQuestionType>("MIXED");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("MEDIUM");
  const [experienceLevel, setExperienceLevel] = useState<InterviewExperienceLevel>("JUNIOR");
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(5);

  const roleOptions = useMemo(() => {
    const base = careerOptions.map((option) => option.title[locale]);
    if (recommendedRole && base.includes(recommendedRole)) {
      return [recommendedRole, ...base.filter((title) => title !== recommendedRole)];
    }
    return base;
  }, [locale, recommendedRole]);

  const trimmedRole = targetRole.trim();
  const hasExactMatch = roleOptions.some((title) => title.toLowerCase() === trimmedRole.toLowerCase());

  const handleStart = () => {
    const trimmed = targetRole.trim();
    if (!trimmed) {
      setRoleError(setup.targetRoleEmptyError);
      return;
    }
    setRoleError(null);
    onStart({ targetRole: trimmed, interviewType, difficulty, experienceLevel, questionCount });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{setup.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{setup.targetRoleLabel}</Label>
            <Combobox
              items={roleOptions}
              // `value` is kept identical to `inputValue` on every keystroke
              // (not just on selecting a list item) — every character typed
              // is immediately the authoritative target role, with no
              // separate "commit" step. Without this, Base UI has no
              // tracked selected value for free-typed text, so Escape's
              // built-in "revert to last selection" reverts to nothing —
              // silently wiping whatever the user just typed.
              value={targetRole}
              onValueChange={(value) => setTargetRole((value ?? "").slice(0, MAX_TARGET_ROLE_LENGTH))}
              inputValue={targetRole}
              onInputValueChange={(value) => {
                setTargetRole(value.slice(0, MAX_TARGET_ROLE_LENGTH));
                if (roleError) setRoleError(null);
              }}
            >
              <ComboboxInputGroup aria-invalid={roleError ? true : undefined} className={roleError ? "border-destructive ring-destructive/20" : undefined}>
                <ComboboxInput placeholder={setup.targetRolePlaceholder} maxLength={MAX_TARGET_ROLE_LENGTH} aria-label={setup.targetRoleLabel} />
                <ComboboxTrigger aria-label={setup.targetRoleSearchPlaceholder} />
              </ComboboxInputGroup>
              <ComboboxPopup>
                <ComboboxEmpty>{setup.targetRoleNoMatches}</ComboboxEmpty>
                <ComboboxList>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                      {item === recommendedRole && (
                        <span className="text-muted-foreground ml-1.5 text-xs font-normal">{setup.targetRoleRecommended}</span>
                      )}
                    </ComboboxItem>
                  )}
                </ComboboxList>
                {trimmedRole.length > 0 && !hasExactMatch && (
                  <ComboboxItem value={trimmedRole} className="text-foreground font-medium">
                    {setup.targetRoleUseCustomTemplate.replace("{role}", trimmedRole)}
                  </ComboboxItem>
                )}
              </ComboboxPopup>
            </Combobox>
            {roleError && <p className="text-destructive text-xs">{roleError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>{setup.typeLabel}</Label>
            <Select value={interviewType} onValueChange={(value) => value && setInterviewType(value as InterviewQuestionType)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(value: InterviewQuestionType) => setup.types[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {interviewTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {setup.types[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{setup.difficultyLabel}</Label>
            <Select value={difficulty} onValueChange={(value) => value && setDifficulty(value as InterviewDifficulty)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(value: InterviewDifficulty) => setup.difficultyLevels[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((level) => (
                  <SelectItem key={level} value={level}>
                    {setup.difficultyLevels[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{setup.experienceLevelLabel}</Label>
            <Select
              value={experienceLevel}
              onValueChange={(value) => value && setExperienceLevel(value as InterviewExperienceLevel)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{(value: InterviewExperienceLevel) => setup.experienceLevels[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {experienceLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {setup.experienceLevels[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{setup.questionCountLabel}</Label>
            <Select
              value={String(questionCount)}
              onValueChange={(value) => value && setQuestionCount(Number(value) as 5 | 10 | 15)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questionCounts.map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="w-full sm:w-auto" disabled={starting} onClick={handleStart}>
          {starting ? <RotateCw className="animate-spin" /> : <Sparkles />}
          {starting ? setup.starting : setup.startCta}
        </Button>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}
