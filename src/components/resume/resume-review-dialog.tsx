"use client";

import { CheckCircle2, TrendingUp, AlertCircle, Target, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ResumeReviewResult } from "@/lib/ai/career/types";

interface ResumeReviewDialogProps {
  review: ResumeReviewResult | null;
  onOpenChange: (open: boolean) => void;
}

function ReviewList({ icon: Icon, title, items, tone }: { icon: React.ElementType; title: string; items: string[]; tone: "success" | "warning" | "muted" }) {
  if (items.length === 0) return null;
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-muted-foreground";
  return (
    <div className="space-y-1.5">
      <p className={`flex items-center gap-1.5 text-sm font-medium ${toneClass}`}>
        <Icon className="size-4" />
        {title}
      </p>
      <ul className="space-y-1 pl-1 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-muted-foreground">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Проверить резюме" (item 12) — a short, grounded read: 3-5 findings, never a wall of 30 recommendations. */
export function ResumeReviewDialog({ review, onOpenChange }: ResumeReviewDialogProps) {
  const { dict } = useLocale();
  const r = dict.dashboard.resumePage.review;

  return (
    <Dialog open={review !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{r.title}</DialogTitle>
        </DialogHeader>
        {review && (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <ReviewList icon={CheckCircle2} title={r.strengthsTitle} items={review.strengths} tone="success" />
            <ReviewList icon={TrendingUp} title={r.improvementsTitle} items={review.improvements} tone="warning" />
            <ReviewList icon={AlertCircle} title={r.missingTitle} items={review.missing} tone="muted" />

            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Target className="size-4" />
                {r.fitTitle}
              </p>
              <p className="text-muted-foreground text-sm">{review.fitNote}</p>
            </div>

            <div className="border-primary/20 bg-primary/5 space-y-1 rounded-lg border p-3">
              <p className="text-primary flex items-center gap-1.5 text-sm font-medium">
                <ArrowRight className="size-4" />
                {r.nextStepTitle}
              </p>
              <p className="text-sm">{review.nextStep}</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {r.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
