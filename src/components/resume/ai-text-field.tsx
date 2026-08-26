"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, RotateCw, Check, X, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/locale-provider";

interface AiTextFieldProps {
  label: string;
  value: string;
  rows?: number;
  placeholder?: string;
  /** Raw typing in the textarea — never touches the undo stack. */
  onManualChange: (text: string) => void;
  /** Only fires when the user clicks "Apply" on a suggestion — the one path that should be undoable. */
  onApply: (text: string) => void;
  onGenerate: () => Promise<string | null>;
  /** Set only right after an AI suggestion was applied — offers a one-step revert (item 32: never lose the pre-AI text silently). */
  canUndo: boolean;
  onUndo: () => void;
}

/**
 * Never overwrites the field automatically — a generated suggestion is
 * shown alongside the still-editable current text, and only "Apply"
 * commits it. This is the fix for the real bug where the old `AiTextButton`
 * replaced `careerObjective`/`summary` the instant a suggestion arrived,
 * with no comparison or confirmation step.
 */
export function AiTextField({ label, value, rows = 3, placeholder, onManualChange, onApply, onGenerate, canUndo, onUndo }: AiTextFieldProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.resumePage;
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    const text = await onGenerate();
    setLoading(false);
    if (text) setSuggestion(text);
  };

  const apply = () => {
    if (!suggestion) return;
    onApply(suggestion);
    setSuggestion(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-1">
          {canUndo && (
            <Button size="sm" variant="ghost" onClick={onUndo} className="text-muted-foreground">
              <Undo2 className="size-3.5" />
              {page.undoCta}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
            {loading ? <RotateCw className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {page.aiAssistCta}
          </Button>
        </div>
      </div>

      <Textarea value={value} onChange={(e) => onManualChange(e.target.value)} rows={rows} placeholder={placeholder} />

      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-primary/30 bg-primary/5 space-y-2.5 rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium">{page.currentVersionLabel}</p>
              <p className="text-muted-foreground text-sm line-through decoration-muted-foreground/40">{value || "—"}</p>
              <p className="text-primary text-xs font-medium">{page.aiSuggestionTitle}</p>
              <p className="text-sm">{suggestion}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" onClick={apply}>
                  <Check className="size-3.5" />
                  {page.acceptCta}
                </Button>
                <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
                  {loading ? <RotateCw className="size-3.5 animate-spin" /> : <RotateCw className="size-3.5" />}
                  {page.retryCta}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
                  <X className="size-3.5" />
                  {page.dismissCta}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
