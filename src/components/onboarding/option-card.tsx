"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  icon: LucideIcon;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function OptionCard({ icon: Icon, label, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-muted/50"
      )}
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-lg transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-4.5" />
      </div>
      <span className="text-sm font-medium">{label}</span>
      {selected && (
        <span className="bg-primary text-primary-foreground absolute top-3 right-3 flex size-4 items-center justify-center rounded-full">
          <Check className="size-2.5" />
        </span>
      )}
    </button>
  );
}
