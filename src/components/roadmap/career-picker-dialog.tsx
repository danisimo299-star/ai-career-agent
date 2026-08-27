"use client";

import { useState } from "react";
import { Briefcase, Check, RotateCw, Sparkles, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { careerOptions } from "@/lib/ai/career/mock-data";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface CareerPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCareerTitle?: string | null;
  onSelect: (title: string) => void;
  /** True while the roadmap for a just-picked title is generating — the dialog stays open and shows this instead of silently vanishing (a real generation can take up to ~a minute on a local model, see item on roadmap regeneration feedback). */
  loading?: boolean;
  /** The user's own real, market-validated Career Analysis recommendations (see `careerRepository`) — shown first and separately from the generic static catalog, since these are already picked FOR this specific user rather than a one-size-fits-all list. */
  recommendedCareers?: string[];
}

function OptionButton({ title, isSelected, onClick }: { title: string; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors",
        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 hover:bg-muted/50"
      )}
    >
      <Briefcase className="text-muted-foreground size-4 shrink-0" />
      <span className="flex-1 font-medium">{title}</span>
      {isSelected && <Check className="text-primary size-4 shrink-0" />}
    </button>
  );
}

export function CareerPickerDialog({ open, onOpenChange, currentCareerTitle, onSelect, loading, recommendedCareers }: CareerPickerDialogProps) {
  const { locale, dict } = useLocale();
  const page = dict.dashboard.roadmapPage;
  const [customTitle, setCustomTitle] = useState("");

  const recommended = (recommendedCareers ?? []).filter(Boolean);
  // The catalog is a general-purpose fallback list — don't repeat a title
  // that's already shown above as a personal recommendation.
  const catalog = careerOptions.filter((o) => !recommended.includes(o.title[locale]));

  const submitCustom = () => {
    const trimmed = customTitle.trim();
    if (trimmed) onSelect(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md" showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>{page.changeCareerTitle}</DialogTitle>
          <DialogDescription>{loading ? page.generatingDescription : page.changeCareerDescription}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
            <RotateCw className="size-4 animate-spin" />
            {page.generating}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{page.customCareerLabel}</p>
              <div className="flex gap-2">
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={page.customCareerPlaceholder}
                  onKeyDown={(e) => e.key === "Enter" && submitCustom()}
                />
                <Button type="button" onClick={submitCustom} disabled={!customTitle.trim()}>
                  {page.customCareerCta}
                  <ArrowRight />
                </Button>
              </div>
            </div>

            <div className="max-h-80 space-y-4 overflow-y-auto">
              {recommended.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                    <Sparkles className="size-3.5" />
                    {page.recommendedCareersLabel}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {recommended.map((title) => (
                      <OptionButton key={title} title={title} isSelected={title === currentCareerTitle} onClick={() => onSelect(title)} />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                {recommended.length > 0 && <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{page.otherCareersLabel}</p>}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {catalog.map((option) => {
                    const title = option.title[locale];
                    return <OptionButton key={option.key} title={title} isSelected={title === currentCareerTitle} onClick={() => onSelect(title)} />;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
