"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * "Пройти интервью заново" — a secondary action, not a primary CTA (item 9).
 * Confirms first (item 10): the old completed result is kept as history,
 * nothing is deleted, only a new `InterviewAttempt` starts.
 */
export function RestartInterviewButton({ variant = "outline" }: { variant?: "outline" | "ghost" }) {
  const { dict } = useLocale();
  const router = useRouter();
  const page = dict.questionnaire.restart;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/questionnaire/restart", { method: "POST" });
      if (!response.ok) throw new Error("failed");
      setOpen(false);
      router.push("/dashboard/questionnaire");
      router.refresh();
    } catch {
      toast.error(dict.settings.errors.actionFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant={variant} size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <RotateCcw className="size-3.5" />
        {page.cta}
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{page.confirmTitle}</DialogTitle>
          <DialogDescription>{page.confirmDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {dict.common.cancel}
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {page.confirmCta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
