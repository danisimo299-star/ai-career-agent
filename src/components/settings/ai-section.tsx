"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { AiReplyStyle } from "@prisma/client";
import type { SettingsProfileData } from "./types";

const STYLES: AiReplyStyle[] = ["BRIEF", "BALANCED", "DETAILED"];

export function AiSection({ profile }: { profile: SettingsProfileData }) {
  const { dict } = useLocale();
  const page = dict.settings.ai;

  const [useProfileContext, setUseProfileContext] = useState(profile.aiUseProfileContext);
  const [rememberHistory, setRememberHistory] = useState(profile.aiRememberHistory);
  const [replyStyle, setReplyStyle] = useState<AiReplyStyle>(profile.aiReplyStyle);

  const patch = async (body: Record<string, unknown>) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("failed");
      toast.success(dict.settings.saved);
    } catch {
      toast.error(dict.settings.errors.saveFailed);
    }
  };

  return (
    <Card>
      <CardContent className="max-w-md space-y-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="ai-use-profile">{page.useProfileLabel}</Label>
            <p className="text-muted-foreground text-sm">{page.useProfileDescription}</p>
          </div>
          <Switch
            id="ai-use-profile"
            checked={useProfileContext}
            onCheckedChange={(checked) => {
              setUseProfileContext(checked);
              patch({ aiUseProfileContext: checked });
            }}
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="ai-remember-history">{page.rememberHistoryLabel}</Label>
            <p className="text-muted-foreground text-sm">{page.rememberHistoryDescription}</p>
          </div>
          <Switch
            id="ai-remember-history"
            checked={rememberHistory}
            onCheckedChange={(checked) => {
              setRememberHistory(checked);
              patch({ aiRememberHistory: checked });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>{page.styleLabel}</Label>
          <div className="flex gap-2">
            {STYLES.map((style) => (
              <Button
                key={style}
                type="button"
                size="sm"
                variant={replyStyle === style ? "default" : "outline"}
                className={cn(replyStyle === style && "pointer-events-none")}
                onClick={() => {
                  setReplyStyle(style);
                  patch({ aiReplyStyle: style });
                }}
              >
                {page.style[style]}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
