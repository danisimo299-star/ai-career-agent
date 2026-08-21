"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Send, RotateCw, Sparkles, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MessageContent } from "./message-content";
import type { CoachMessageData } from "./types";

// Kept outside the component so the React Compiler's purity check never has
// to reason about `Date.now()`/`new Date()` being reachable from render —
// these only ever run inside the `send` event handler, never during render.
function makeOptimisticId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function nowIso(): string {
  return new Date().toISOString();
}

interface DisplayMessage extends CoachMessageData {
  memoryNoted?: boolean;
  // Only true for a reply just received this session — history loaded from
  // the server (initialMessages) renders instantly, never re-animates.
  animate?: boolean;
}

// Reveals `fullText` progressively when `enabled`, in a fixed number of
// chunks so a long reply doesn't take proportionally longer to finish than
// a short one — a flat ~800ms either way.
function useTypewriter(fullText: string, enabled: boolean): string {
  const [revealed, setRevealed] = useState(enabled ? "" : fullText);

  useEffect(() => {
    if (!enabled) {
      setRevealed(fullText);
      return;
    }
    const totalTicks = 40;
    const chunkSize = Math.max(1, Math.ceil(fullText.length / totalTicks));
    setRevealed("");
    let shown = 0;
    const id = setInterval(() => {
      shown = Math.min(fullText.length, shown + chunkSize);
      setRevealed(fullText.slice(0, shown));
      if (shown >= fullText.length) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [fullText, enabled]);

  return revealed;
}

function CoachMessageBubble({ msg }: { msg: DisplayMessage }) {
  const { dict } = useLocale();
  const page = dict.dashboard.coachPage.chat;
  const revealedContent = useTypewriter(msg.content, msg.animate === true);

  const actionLabel = (labelKey: string, count?: number) => {
    const template = page.actions[labelKey as keyof typeof page.actions] ?? labelKey;
    return count !== undefined ? template.replace("{count}", String(count)) : template;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("flex gap-2", msg.role === "USER" && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          msg.role === "USER" ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
        )}
      >
        {msg.role === "USER" ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </div>
      <div className="max-w-[80%] space-y-1">
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            msg.role === "USER" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"
          )}
        >
          <MessageContent content={revealedContent} />
          {msg.suggestedActions && msg.suggestedActions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {msg.suggestedActions.map((action) => (
                <Button
                  key={action.href}
                  size="sm"
                  variant="secondary"
                  nativeButton={false}
                  render={<Link href={action.href}>{actionLabel(action.labelKey, action.count)}</Link>}
                />
              ))}
            </div>
          )}
        </div>
        {msg.memoryNoted && <p className="text-muted-foreground pl-1 text-xs italic">{page.memoryNotedLabel}</p>}
      </div>
    </motion.div>
  );
}

interface ChatPanelProps {
  initialMessages: CoachMessageData[];
  targetRole: string | null;
  onMessageSent: () => void;
}

export function ChatPanel({ initialMessages, targetRole, onMessageSent }: ChatPanelProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.coachPage.chat;

  const [messages, setMessages] = useState<DisplayMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (presetMessage?: string) => {
    const message = (presetMessage ?? input).trim();
    if (!message || sending) return;
    setError(null);
    setSending(true);
    setInput("");

    const optimisticUser: DisplayMessage = {
      id: makeOptimisticId("optimistic"),
      role: "USER",
      content: message,
      suggestedActions: null,
      createdAt: nowIso(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const response = await fetch("/api/coach/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as {
        reply: string;
        suggestedActions: { labelKey: string; href: string; count?: number }[];
        memoryNoted: boolean;
      };
      setMessages((prev) => [
        ...prev,
        {
          id: makeOptimisticId("reply"),
          role: "ASSISTANT",
          content: data.reply,
          suggestedActions: data.suggestedActions,
          createdAt: nowIso(),
          memoryNoted: data.memoryNoted,
          animate: true,
        },
      ]);
      onMessageSent();
    } catch {
      setError(page.errorSend);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-primary/10 from-primary/5 gap-0 overflow-hidden bg-gradient-to-b to-transparent py-0">
      <CardContent className="flex h-[60vh] flex-col gap-3 px-4 pt-4">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="bg-primary/15 flex size-12 items-center justify-center rounded-full">
                <Sparkles className="text-primary size-6" />
              </div>
              <div className="max-w-sm space-y-1.5">
                <p className="font-semibold">{page.greetingTitle}</p>
                <p className="text-muted-foreground text-sm">
                  {targetRole ? page.greetingWithGoalTemplate.replace("{role}", targetRole) : page.capabilitiesLine}
                </p>
              </div>
              <div className="flex max-w-sm flex-wrap justify-center gap-2">
                {(Object.entries(page.quickActions) as [keyof typeof page.quickActions, string][]).map(([key, label]) => (
                  <Button key={key} size="sm" variant="outline" onClick={() => send(label)} disabled={sending}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <CoachMessageBubble key={msg.id} msg={msg} />
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2 pb-4"
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={page.placeholder} disabled={sending} />
          <Button type="submit" disabled={sending || !input.trim()}>
            {sending ? <RotateCw className="animate-spin" /> : <Send />}
            {page.send}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
