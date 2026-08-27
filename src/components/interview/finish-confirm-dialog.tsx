"use client";

import { RotateCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

interface FinishConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** True while the final report generates — the dialog stays open and shows this instead of closing and leaving the session view with no visible feedback. */
  loading?: boolean;
}

export function FinishConfirmDialog({ open, onOpenChange, onConfirm, loading }: FinishConfirmDialogProps) {
  const { dict } = useLocale();
  const session = dict.dashboard.interviewPage.session;

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="sm:max-w-sm" showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>{session.finishConfirmTitle}</DialogTitle>
          <DialogDescription>{loading ? session.generatingReport : session.finishConfirmDescription}</DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm">
            <RotateCw className="size-4 animate-spin" />
            {session.generatingReport}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {dict.common.cancel}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading && <RotateCw className="animate-spin" />}
            {session.finishConfirmCta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
