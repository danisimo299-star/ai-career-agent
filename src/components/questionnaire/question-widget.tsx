"use client";

import { useState } from "react";
import { Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import { QUESTION_DEFINITIONS } from "@/lib/ai/career/questionnaire";
import { resolveOptionLabels } from "@/lib/ai/career/questionnaire-copy";
import type { QuestionSpecData } from "./types";

export interface QuestionAnswer {
  content?: string;
  selectedKeys?: string[];
  skipped?: boolean;
}

interface QuestionWidgetProps {
  question: QuestionSpecData;
  interests: string[];
  disabled?: boolean;
  onAnswer: (answer: QuestionAnswer) => void;
}

export function QuestionWidget({ question, interests, disabled, onAnswer }: QuestionWidgetProps) {
  const { dict } = useLocale();
  const def = QUESTION_DEFINITIONS[question.id];
  const options = resolveOptionLabels(question.id, dict, interests);

  const [selected, setSelected] = useState<string[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [text, setText] = useState("");

  const toggle = (key: string) => {
    if (def.type === "single") {
      onAnswer({ selectedKeys: [key] });
      return;
    }
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (def.maxSelect && prev.length >= def.maxSelect) return prev;
      return [...prev, key];
    });
  };

  if (def.type === "yesNo") {
    return (
      <div className="flex flex-wrap gap-2 pl-11">
        <Button variant="outline" disabled={disabled} onClick={() => onAnswer({ selectedKeys: ["yes"] })}>
          {dict.questionnaire.yesNo.yes}
        </Button>
        <Button variant="outline" disabled={disabled} onClick={() => onAnswer({ selectedKeys: ["no"] })}>
          {dict.questionnaire.yesNo.no}
        </Button>
      </div>
    );
  }

  if (def.type === "text") {
    return (
      <div className="space-y-2 pl-11">
        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={dict.questionnaire.placeholder}
            rows={1}
            disabled={disabled}
            className="max-h-40 min-h-10 flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && text.trim()) {
                e.preventDefault();
                onAnswer({ content: text.trim() });
              }
            }}
          />
          <Button size="icon" disabled={disabled || !text.trim()} onClick={() => onAnswer({ content: text.trim() })} aria-label={dict.questionnaire.send}>
            <Send className="size-4" />
          </Button>
        </div>
        {def.skippable && (
          <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onAnswer({ skipped: true })}>
            {dict.questionnaire.skipCta}
          </Button>
        )}
      </div>
    );
  }

  // single (no immediate-submit reached above only if it fell through — kept for safety) or multi
  return (
    <div className="space-y-3 pl-11">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.key);
          return (
            <button
              key={opt.key}
              type="button"
              disabled={disabled}
              onClick={() => toggle(opt.key)}
              className={cn(
                "hover-lift inline-flex max-w-full items-center gap-1.5 rounded-full border px-3.5 py-2 text-left text-sm font-medium break-words transition-colors",
                isSelected ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/40"
              )}
            >
              {isSelected && <Check className="size-3.5 shrink-0" />}
              {opt.label}
            </button>
          );
        })}
        {def.allowOther && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOtherOpen((v) => !v)}
            className={cn(
              "hover-lift inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              otherOpen ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/40"
            )}
          >
            {dict.questionnaire.otherOption}
          </button>
        )}
      </div>

      {otherOpen && (
        <Textarea
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          placeholder={dict.questionnaire.otherPlaceholder}
          rows={1}
          disabled={disabled}
          className="max-h-32 min-h-9 resize-none"
        />
      )}

      <Button
        size="sm"
        disabled={disabled || (selected.length === 0 && !otherText.trim())}
        onClick={() => onAnswer({ selectedKeys: selected, content: otherText.trim() || undefined })}
      >
        {dict.common.continueLabel}
      </Button>
    </div>
  );
}
