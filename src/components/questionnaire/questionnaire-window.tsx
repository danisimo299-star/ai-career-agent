"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ClipboardList, RotateCw } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "@/components/shared/typing-indicator";
import { ProgressHeader } from "./progress-header";
import { QuestionWidget, type QuestionAnswer } from "./question-widget";
import { CompletionScreen } from "./completion-screen";
import { RestartInterviewButton } from "./restart-interview-button";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { useLocale } from "@/lib/i18n/locale-provider";
import { resolveOptionLabels } from "@/lib/ai/career/questionnaire-copy";
import type { QuestionnaireMessageData, QuestionSpecData } from "./types";

function makeLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface QuestionnaireWindowProps {
  initialMessages: QuestionnaireMessageData[];
  initialProgress: number;
  initialStep: number;
  initialTotalSteps: number;
  initialIsComplete: boolean;
  interests: string[];
}

export function QuestionnaireWindow({
  initialMessages,
  initialProgress,
  initialStep,
  initialTotalSteps,
  initialIsComplete,
  interests,
}: QuestionnaireWindowProps) {
  const { dict } = useLocale();
  const [messages, setMessages] = useState<QuestionnaireMessageData[]>(initialMessages);
  const [progress, setProgress] = useState(initialProgress);
  const [step, setStep] = useState(initialStep);
  const [totalSteps, setTotalSteps] = useState(initialTotalSteps);
  const [isComplete, setIsComplete] = useState(initialIsComplete);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState<{ payload: unknown } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const pendingQuestion: QuestionSpecData | null = !isComplete ? (lastAssistant?.questionSpec ?? null) : null;

  const send = async (answer: QuestionAnswer & { questionId?: string }) => {
    setError(null);
    setSending(true);

    const displayLabels = pendingQuestion ? resolveOptionLabels(pendingQuestion.id, dict, interests) : [];
    const optimisticText =
      answer.content?.trim() ||
      (answer.skipped ? dict.questionnaire.skipCta : "") ||
      (answer.selectedKeys ?? []).map((k) => displayLabels.find((o) => o.key === k)?.label ?? k).join(", ");

    setMessages((prev) => [...prev, { id: makeLocalId("optimistic"), role: "user", content: optimisticText }]);

    const payload = { ...answer, questionId: pendingQuestion?.id };
    setLastAnswer({ payload });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        setError(body.error === "ai_unavailable" ? dict.common.aiUnavailable : dict.questionnaire.errorGeneric);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const data = (await response.json()) as {
        reply: string;
        nextQuestion: QuestionSpecData | null;
        isComplete: boolean;
        progressPercent: number;
        step: number;
        totalSteps: number;
      };
      setMessages((prev) => [
        ...prev,
        { id: makeLocalId("reply"), role: "assistant", content: data.reply, questionSpec: data.nextQuestion },
      ]);
      setProgress(data.progressPercent);
      setStep(data.step);
      setTotalSteps(data.totalSteps);
      setIsComplete(data.isComplete);
    } catch {
      setError(dict.questionnaire.errorGeneric);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const retry = () => {
    if (!lastAnswer) return;
    send(lastAnswer.payload as QuestionAnswer);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4 pb-3 sm:px-6">
        <PageHeader
          title={dict.questionnaire.title}
          description={dict.questionnaire.subtitle}
          icon={ClipboardList}
          action={isComplete ? <RestartInterviewButton /> : undefined}
        />
      </div>
      <ProgressHeader percent={progress} step={step} totalSteps={totalSteps} />

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {pendingQuestion && !sending && (
          <div className="space-y-3">
            <MessageBubble message={{ id: "pending-prompt", role: "assistant", content: pendingQuestion.prompt }} />
            <p className="text-muted-foreground pl-11 text-xs">{dict.questionnaire.whyThisHelps}</p>
            <QuestionWidget question={pendingQuestion} interests={interests} disabled={sending} onAnswer={send} />
          </div>
        )}

        {sending && <TypingIndicator />}
        {error && (
          <div className="border-destructive/30 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm">
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button size="sm" variant="outline" onClick={retry}>
              <RotateCw className="size-3.5" />
              {dict.questionnaire.retry}
            </Button>
          </div>
        )}

        {isComplete && <CompletionScreen />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
