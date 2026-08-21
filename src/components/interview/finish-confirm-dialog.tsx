"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface FinishConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function FinishConfirmDialog({ open, onOpenChange, onConfirm, loading }: FinishConfirmDialogProps) {
  const { dict } = useLocale();
  const session = dict.dashboard.interviewPage.session;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{session.finishConfirmTitle}</DialogTitle>
          <DialogDescription>{session.finishConfirmDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {dict.common.cancel}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {session.finishConfirmCta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
