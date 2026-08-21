"use client";

import { Briefcase, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { careerOptions } from "@/lib/ai/career/mock-data";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface CareerPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCareerTitle?: string | null;
  onSelect: (title: string) => void;
}

export function CareerPickerDialog({ open, onOpenChange, currentCareerTitle, onSelect }: CareerPickerDialogProps) {
  const { locale, dict } = useLocale();
  const page = dict.dashboard.roadmapPage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{page.changeCareerTitle}</DialogTitle>
          <DialogDescription>{page.changeCareerDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {careerOptions.map((option) => {
            const title = option.title[locale];
            const isSelected = title === currentCareerTitle;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  onSelect(title);
                  onOpenChange(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <Briefcase className="text-muted-foreground size-4 shrink-0" />
                <span className="flex-1 font-medium">{title}</span>
                {isSelected && <Check className="text-primary size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
