"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface SkipConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function SkipConfirmDialog({ open, onOpenChange, onConfirm, loading }: SkipConfirmDialogProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.missionsPage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{page.skipConfirmTitle}</DialogTitle>
          <DialogDescription>{page.skipConfirmDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {dict.common.cancel}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {page.skipConfirmCta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
