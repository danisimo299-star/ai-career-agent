"use client";

import { Sparkles, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/locale-provider";

interface ResumeWelcomeProps {
  targetRole: string;
  onTargetRoleChange: (value: string) => void;
  onGenerate: () => void;
  onManual: () => void;
  generating: boolean;
}

/** The first thing a user with no meaningful resume content sees — a blank editor form is never the empty state (item 27). */
export function ResumeWelcome({ targetRole, onTargetRoleChange, onGenerate, onManual, generating }: ResumeWelcomeProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.resumePage;
  const w = page.welcome;

  return (
    <Card className="ambient-ai border-primary/20">
      <CardContent className="flex flex-col items-center gap-5 py-14 text-center">
        <div className="bg-primary/15 flex size-14 items-center justify-center rounded-full">
          <Sparkles className="text-primary size-7" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h2 className="text-xl font-semibold">{w.title}</h2>
          <p className="text-muted-foreground text-sm">{w.subtitle}</p>
        </div>

        <div className="w-full max-w-xs">
          <Input
            value={targetRole}
            onChange={(e) => onTargetRoleChange(e.target.value)}
            placeholder={page.targetRolePlaceholder}
            className="text-center"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onGenerate} disabled={generating || !targetRole.trim()}>
            <Sparkles />
            {w.primaryCta}
          </Button>
          <Button variant="outline" onClick={onManual}>
            <Pencil />
            {w.secondaryCta}
          </Button>
        </div>
        {!targetRole.trim() && <p className="text-muted-foreground max-w-xs text-xs">{w.needsTargetRole}</p>}
      </CardContent>
    </Card>
  );
}
