"use client";

import { useState } from "react";
import { X, Plus, Sparkles, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/locale-provider";

interface SkillsSectionProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  onSuggest: (existingSkills: string[]) => Promise<string[] | null>;
}

export function SkillsSection({ skills, onChange, onSuggest }: SkillsSectionProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.resumePage;
  const [value, setValue] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  const add = () => {
    const trimmed = value.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    onChange([...skills, trimmed]);
    setValue("");
  };
  const remove = (skill: string) => onChange(skills.filter((s) => s !== skill));

  const suggest = async () => {
    setSuggesting(true);
    const suggestions = await onSuggest(skills);
    setSuggesting(false);
    if (suggestions) {
      const merged = [...skills];
      for (const s of suggestions) if (!merged.includes(s)) merged.push(s);
      onChange(merged);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge key={skill} variant="secondary" className="gap-1">
            {skill}
            <button type="button" onClick={() => remove(skill)} aria-label={page.deleteCta}>
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={page.fields.skillName}
          className="max-w-xs"
        />
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="size-3.5" />
          {page.fields.addSkill}
        </Button>
        <Button size="sm" variant="outline" onClick={suggest} disabled={suggesting}>
          {suggesting ? <RotateCw className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          {page.aiAssistCta}
        </Button>
      </div>
    </div>
  );
}
