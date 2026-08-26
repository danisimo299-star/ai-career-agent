"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Eraser, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLocale } from "@/lib/i18n/locale-provider";

interface DangerRowProps {
  icon: React.ElementType;
  title: string;
  description: string;
  ctaLabel: string;
  onConfirm: () => Promise<void>;
  confirmTitle: string;
  confirmDescription: string;
}

function DangerRow({ icon: Icon, title, description, ctaLabel, onConfirm, confirmTitle, confirmDescription }: DangerRowProps) {
  const { dict } = useLocale();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
          {ctaLabel}
        </Button>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
            <DialogDescription>{confirmDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
              {dict.settings.privacy.confirmCta}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PrivacySection() {
  const { dict } = useLocale();
  const page = dict.settings.privacy;

  const clearChatHistory = async () => {
    const response = await fetch("/api/coach/messages", { method: "DELETE" });
    if (!response.ok) {
      toast.error(dict.settings.errors.actionFailed);
      return;
    }
    toast.success(page.done);
  };

  const resetCareerProfile = async () => {
    const response = await fetch("/api/profile/reset-career", { method: "POST" });
    if (!response.ok) {
      toast.error(dict.settings.errors.actionFailed);
      return;
    }
    toast.success(page.done);
  };

  return (
    <Card>
      <CardContent className="max-w-lg space-y-6 py-6">
        <DangerRow
          icon={Eraser}
          title={page.clearChatTitle}
          description={page.clearChatDescription}
          ctaLabel={page.clearChatCta}
          confirmTitle={page.clearChatConfirmTitle}
          confirmDescription={page.clearChatConfirmDescription}
          onConfirm={clearChatHistory}
        />

        <DangerRow
          icon={Trash2}
          title={page.resetProfileTitle}
          description={page.resetProfileDescription}
          ctaLabel={page.resetProfileCta}
          confirmTitle={page.resetProfileConfirmTitle}
          confirmDescription={page.resetProfileConfirmDescription}
          onConfirm={resetCareerProfile}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Download className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{page.exportTitle}</p>
              <p className="text-muted-foreground text-sm">{page.exportDescription}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" nativeButton={false} render={<a href="/api/export">{page.exportCta}</a>} />
        </div>
      </CardContent>
    </Card>
  );
}
