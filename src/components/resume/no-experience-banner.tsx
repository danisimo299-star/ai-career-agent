"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

/** Shown once, dismissibly, when a generated/edited resume still has no experience or projects — the honest "ask, don't invent" nudge from item 5, not a blocking gate. */
export function NoExperienceBanner({ onAddExperience }: { onAddExperience: () => void }) {
  const { dict } = useLocale();
  const b = dict.dashboard.resumePage.noExperienceBanner;
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-lg border p-3.5">
      <Info className="text-primary mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-sm font-medium">{b.title}</p>
        <p className="text-muted-foreground text-sm">{b.description}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" onClick={onAddExperience}>
            {b.addCta}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
            {b.dismissCta}
          </Button>
        </div>
      </div>
      <Button size="icon-sm" variant="ghost" onClick={() => setDismissed(true)} aria-label={b.dismissCta}>
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
