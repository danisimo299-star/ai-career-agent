"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ResumePersonalInfo } from "@/types";

interface PersonalInfoSectionProps {
  personalInfo: ResumePersonalInfo;
  onChange: (personalInfo: ResumePersonalInfo) => void;
}

export function PersonalInfoSection({ personalInfo, onChange }: PersonalInfoSectionProps) {
  const { dict } = useLocale();
  const labels = dict.dashboard.resumePage.sections;

  const set = (key: keyof ResumePersonalInfo, value: string) => onChange({ ...personalInfo, [key]: value });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>{labels.fullName}</Label>
        <Input value={personalInfo.fullName} onChange={(e) => set("fullName", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{labels.email}</Label>
        <Input value={personalInfo.email} onChange={(e) => set("email", e.target.value)} type="email" />
      </div>
      <div className="space-y-1.5">
        <Label>{labels.phone}</Label>
        <Input value={personalInfo.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{labels.city}</Label>
        <Input value={personalInfo.city ?? ""} onChange={(e) => set("city", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{labels.linkedin}</Label>
        <Input value={personalInfo.linkedin ?? ""} onChange={(e) => set("linkedin", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{labels.github}</Label>
        <Input value={personalInfo.github ?? ""} onChange={(e) => set("github", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{labels.website}</Label>
        <Input value={personalInfo.website ?? ""} onChange={(e) => set("website", e.target.value)} />
      </div>
    </div>
  );
}
