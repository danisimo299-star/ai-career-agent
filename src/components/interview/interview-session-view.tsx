"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, RotateCw, Flag } from "lucide-react";
import { MessageBubble } from "@/components/shared/message-bubble";
import { TypingIndicator } from "@/components/shared/typing-indicator";
import { MessageComposer } from "@/components/shared/message-composer";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FinishConfirmDialog } from "./finish-confirm-dialog";
import type { InterviewSessionData } from "./types";

interface InterviewSessionViewProps {
  session: InterviewSessionData;
  onAnswer: (questionId: string, answer: string) => Promise<boolean>;
  onFinish: () => Promise<void>;
  finishing: boolean;
}

export function InterviewSessionView({ session, onAnswer, onFinish, finishing }: InterviewSessionViewProps) {
  const { dict } = useLocale();
  const s = dict.dashboard.interviewPage.session;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const pending = session.questions.find((q) => q.userAnswer === null) ?? null;
  const primaryAskedCount = session.questions.filter((q) => !q.isFollowUp).length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.questions.length, submitting]);

  const submit = async (content: string) => {
    if (!pending) return;
    setError(false);
    setSubmitting(true);
    const ok = await onAnswer(pending.id, content);
    setSubmitting(false);
    if (!ok) setError(true);
  };

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-[420px] flex-col rounded-xl border">
      <div className="flex items-center justify-between gap-3 border-b p-4">
        <div className="flex-1 space-y-1.5">
          <p className="text-muted-foreground text-sm font-medium">
            {s.questionCounterTemplate.replace("{current}", String(Math.min(primaryAskedCount, session.questionCount))).replace("{total}", String(session.questionCount))}
          </p>
          <Progress value={(Math.min(primaryAskedCount, session.questionCount) / session.questionCount) * 100} />
        </div>
        <Button variant="outline" size="sm" onClick={() => setConfirmFinishOpen(true)} disabled={finishing}>
          <Flag className="size-3.5" />
          {s.finishCta}
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {session.questions.map((question) => (
          <div key={question.id} className="space-y-2">
            {question.isFollowUp && (
              <Badge variant="secondary" className="ml-11">
                {s.followUpBadge}
              </Badge>
            )}
            <MessageBubble message={{ id: `${question.id}-q`, role: "assistant", content: question.question }} />
            {question.userAnswer !== null && (
              <>
                <MessageBubble message={{ id: `${question.id}-a`, role: "user", content: question.userAnswer }} />
                {question.aiEvaluation && (
                  <div className="border-border bg-muted/40 ml-11 max-w-[80%] rounded-lg border p-3 text-sm sm:max-w-[70%]">
                    {question.aiEvaluation}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {submitting && <TypingIndicator />}
        {error && (
          <div className="border-destructive/30 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm">
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1">{s.errorSubmit}</span>
          </div>
        )}
        {!pending && !submitting && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <RotateCw className="size-3.5 animate-spin" />
            {s.generatingNext}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <MessageComposer onSend={submit} disabled={submitting || !pending} placeholder={s.answerPlaceholder} sendLabel={s.submitCta} />

      <FinishConfirmDialog
        open={confirmFinishOpen}
        onOpenChange={setConfirmFinishOpen}
        loading={finishing}
        onConfirm={async () => {
          await onFinish();
          setConfirmFinishOpen(false);
        }}
      />
    </div>
  );
}
