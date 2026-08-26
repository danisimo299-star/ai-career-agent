"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/locale-provider";
import { educationStageValues } from "@/lib/validation/onboarding.schema";
import type { EducationStage, ExperienceLevel } from "@prisma/client";
import type { SettingsProfileData } from "./types";

const EXPERIENCE_LEVELS: ExperienceLevel[] = ["STUDENT", "GRADUATE", "JUNIOR", "CAREER_CHANGER", "MID", "SENIOR"];

interface ProfileSectionProps {
  userName: string;
  profile: SettingsProfileData;
}

export function ProfileSection({ userName, profile }: ProfileSectionProps) {
  const { dict } = useLocale();
  const page = dict.settings.profile;

  const [name, setName] = useState(userName);
  const [age, setAge] = useState(profile.age !== null ? String(profile.age) : "");
  const [city, setCity] = useState(profile.city ?? "");
  const [educationStage, setEducationStage] = useState<EducationStage | "">(profile.educationStage ?? "");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">(profile.experienceLevel ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          age: age.trim() ? Number(age) : undefined,
          city: city.trim() || undefined,
          educationStage: educationStage || undefined,
          experienceLevel: experienceLevel || undefined,
        }),
      });
      if (!response.ok) throw new Error("failed");
      toast.success(dict.settings.saved);
    } catch {
      toast.error(dict.settings.errors.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="max-w-md space-y-5 py-6">
        <div className="space-y-1.5">
          <Label htmlFor="settings-name">{page.nameLabel}</Label>
          <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={page.namePlaceholder} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-age">{page.ageLabel}</Label>
            <Input id="settings-age" type="number" min={10} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-city">{page.cityLabel}</Label>
            <Input id="settings-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={page.cityPlaceholder} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{page.educationLabel}</Label>
          <Select value={educationStage} onValueChange={(value) => value && setEducationStage(value as EducationStage)}>
            <SelectTrigger className="w-full">
              <SelectValue>{(value: EducationStage) => dict.onboarding.steps.education.options[value.toLowerCase() as keyof typeof dict.onboarding.steps.education.options]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {educationStageValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {dict.onboarding.steps.education.options[value.toLowerCase() as keyof typeof dict.onboarding.steps.education.options]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{page.statusLabel}</Label>
          <Select value={experienceLevel} onValueChange={(value) => value && setExperienceLevel(value as ExperienceLevel)}>
            <SelectTrigger className="w-full">
              <SelectValue>{(value: ExperienceLevel) => page.experienceLevels[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((value) => (
                <SelectItem key={value} value={value}>
                  {page.experienceLevels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={save} disabled={saving}>
          {dict.settings.saveCta}
        </Button>
      </CardContent>
    </Card>
  );
}
