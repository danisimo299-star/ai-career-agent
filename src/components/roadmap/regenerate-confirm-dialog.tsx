"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface RegenerateConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function RegenerateConfirmDialog({ open, onOpenChange, onConfirm, loading }: RegenerateConfirmDialogProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.roadmapPage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{page.regenerateConfirmTitle}</DialogTitle>
          <DialogDescription>{page.regenerateConfirmDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {dict.common.cancel}
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {page.regenerateConfirmCta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
