"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * No notification backend exists yet (no channel, no delivery, nothing to
 * actually turn on) — per the brief, that means showing this honestly as a
 * disabled preview rather than wiring toggles that would silently do
 * nothing. Replace with real state once a notifications system exists.
 */
export function NotificationsSection() {
  const { dict } = useLocale();
  const page = dict.settings.notifications;

  const rows: { key: string; label: string }[] = [
    { key: "tasks", label: page.tasks },
    { key: "reminders", label: page.reminders },
    { key: "recommendations", label: page.recommendations },
  ];

  return (
    <Card>
      <CardContent className="max-w-md space-y-5 py-6">
        <p className="text-muted-foreground text-sm">{page.comingSoonNote}</p>
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 opacity-50">
            <Label>{row.label}</Label>
            <Switch checked={false} disabled />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
