"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/locale-provider";

interface MessageComposerProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  sendLabel?: string;
}

/** Generic free-text composer — shared by the Interview Simulator's answer box and (indirectly) the Questionnaire's text-type questions. */
export function MessageComposer({ onSend, disabled, placeholder, sendLabel }: MessageComposerProps) {
  const { dict } = useLocale();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div className="flex items-end gap-2 border-t p-4">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder ?? dict.questionnaire.placeholder}
        rows={1}
        disabled={disabled}
        className="max-h-40 min-h-10 flex-1 resize-none"
      />
      <Button size="icon" onClick={submit} disabled={disabled || value.trim().length === 0} aria-label={sendLabel ?? dict.questionnaire.send}>
        <Send className="size-4" />
      </Button>
    </div>
  );
}
