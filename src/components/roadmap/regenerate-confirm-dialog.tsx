"use client";

import { RotateCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface RegenerateConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** True while the new roadmap generates — the dialog stays open and shows this instead of closing and leaving the page with no feedback for what can be up to ~a minute on a local model. */
  loading?: boolean;
}

export function RegenerateConfirmDialog({ open, onOpenChange, onConfirm, loading }: RegenerateConfirmDialogProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.roadmapPage;

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="sm:max-w-sm" showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>{page.regenerateConfirmTitle}</DialogTitle>
          <DialogDescription>{loading ? page.generatingDescription : page.regenerateConfirmDescription}</DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm">
            <RotateCw className="size-4 animate-spin" />
            {page.generating}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {dict.common.cancel}
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading && <RotateCw className="animate-spin" />}
            {page.regenerateConfirmCta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
