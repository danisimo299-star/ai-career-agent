"use client";

import { useState } from "react";
import { Sparkles, RotateCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { careerOptions } from "@/lib/ai/career/mock-data";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { InterviewSetupInput, InterviewQuestionType, InterviewDifficulty, InterviewExperienceLevel } from "./types";

const interviewTypes: InterviewQuestionType[] = ["MIXED", "TECHNICAL", "BEHAVIORAL", "HR", "GENERAL", "RESUME_BASED"];
const difficulties: InterviewDifficulty[] = ["EASY", "MEDIUM", "HARD"];
const experienceLevels: InterviewExperienceLevel[] = ["STUDENT", "JUNIOR", "MID", "SENIOR"];
const questionCounts = [5, 10, 15] as const;

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
  const [targetRole, setTargetRole] = useState(customRole ?? defaultRoleOption?.title[locale] ?? careerOptions[0].title[locale]);
  const [interviewType, setInterviewType] = useState<InterviewQuestionType>("MIXED");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("MEDIUM");
  const [experienceLevel, setExperienceLevel] = useState<InterviewExperienceLevel>("JUNIOR");
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{setup.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{setup.targetRoleLabel}</Label>
            <Select value={targetRole} onValueChange={(value) => value && setTargetRole(value as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={setup.targetRolePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {customRole && (
                  <SelectItem key="custom" value={customRole}>
                    {customRole}
                  </SelectItem>
                )}
                {careerOptions.map((option) => (
                  <SelectItem key={option.key} value={option.title[locale]}>
                    {option.title[locale]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        <Button
          className="w-full sm:w-auto"
          disabled={starting}
          onClick={() => onStart({ targetRole, interviewType, difficulty, experienceLevel, questionCount })}
        >
          {starting ? <RotateCw className="animate-spin" /> : <Sparkles />}
          {starting ? setup.starting : setup.startCta}
        </Button>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}
