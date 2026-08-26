"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Send, RotateCw, Sparkles, User, Square, Copy, Check, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import { readCoachSseEvents } from "@/lib/coach/sse";
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
  streaming?: boolean;
}

function CoachMessageBubble({
  msg,
  isLastAssistant,
  onRegenerate,
}: {
  msg: DisplayMessage;
  isLastAssistant: boolean;
  onRegenerate: () => void;
}) {
  const { dict } = useLocale();
  const page = dict.dashboard.coachPage.chat;
  const [copied, setCopied] = useState(false);

  const actionLabel = (labelKey: string, count?: number) => {
    const template = page.actions[labelKey as keyof typeof page.actions] ?? labelKey;
    return count !== undefined ? template.replace("{count}", String(count)) : template;
  };

  const isUser = msg.role === "USER";
  const showHoverActions = !isUser && !msg.streaming;

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser — silently no-op rather than showing an error for a non-critical action.
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("group/msg flex gap-2.5", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
        )}
      >
        {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </div>
      <div className={cn("min-w-0 space-y-1", isUser ? "max-w-[85%]" : "max-w-full flex-1")}>
        <div
          className={cn(
            "text-sm leading-normal",
            isUser ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3.5 py-2.5" : "px-0.5 py-1"
          )}
        >
          {msg.streaming && msg.content.length === 0 ? (
            <span className="text-muted-foreground inline-flex items-center gap-1.5">
              <span className="bg-primary/60 size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
              <span className="bg-primary/60 size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
              <span className="bg-primary/60 size-1.5 animate-bounce rounded-full" />
              <span className="ml-0.5">{page.thinking}</span>
            </span>
          ) : (
            <MessageContent content={msg.content} />
          )}
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

        {showHoverActions && (
          <div className="flex items-center gap-1 pl-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100 focus-within:opacity-100">
            <Button size="icon-xs" variant="ghost" onClick={copyText} aria-label={page.copy} title={copied ? page.copied : page.copy}>
              {copied ? <Check className="text-success" /> : <Copy />}
            </Button>
            {isLastAssistant && (
              <Button size="icon-xs" variant="ghost" onClick={onRegenerate} aria-label={page.regenerate} title={page.regenerate}>
                <RefreshCw />
              </Button>
            )}
          </div>
        )}

        {msg.memoryNoted && <p className="text-muted-foreground pl-1 text-xs italic">{page.memoryNotedLabel}</p>}
      </div>
    </motion.div>
  );
}

interface ChatPanelProps {
  initialMessages: CoachMessageData[];
  onMessageSent: () => void;
}

export function ChatPanel({ initialMessages, onMessageSent }: ChatPanelProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.coachPage.chat;

  const [messages, setMessages] = useState<DisplayMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoAskedRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Contextual "Discuss with ProfyMind" buttons elsewhere in the app (Career
  // Analysis, Roadmap, ...) link here as `/dashboard/coach?ask=<question>` —
  // fired once on load via `sendRef` (kept current below, right after `send`
  // is defined, so it's already pointing at the real function by the time
  // this effect runs on the same mount), then stripped from the URL so
  // refreshing or navigating back never re-sends it.
  const sendRef = useRef<(presetMessage?: string) => void>(() => {});

  const runStream = async (url: string, body: unknown, assistantId: string) => {
    const controller = new AbortController();
    abortRef.current = controller;

    const updateAssistant = (patch: Partial<DisplayMessage>) => {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)));
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("failed");

      let sawDone = false;
      let errorCode: "unavailable" | "generic" | null = null;
      for await (const event of readCoachSseEvents(response)) {
        if (event.type === "delta") {
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + event.text } : m)));
        } else if (event.type === "done") {
          sawDone = true;
          updateAssistant({ streaming: false, suggestedActions: event.suggestedActions, memoryNoted: event.memoryNoted });
        } else if (event.type === "error") {
          errorCode = event.code ?? "generic";
          break;
        }
      }
      if (errorCode) throw new Error(errorCode);
      if (!sawDone) throw new Error("generic");
      onMessageSent();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // The user stopped generation on purpose — keep whatever text streamed in so far, just mark it finished.
        updateAssistant({ streaming: false });
        return;
      }
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      setError(err instanceof Error && err.message === "unavailable" ? page.errorUnavailable : page.errorSend);
      setLastFailedMessage(typeof body === "object" && body && "message" in body ? String((body as { message: unknown }).message) : null);
    } finally {
      abortRef.current = null;
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const send = async (presetMessage?: string) => {
    const message = (presetMessage ?? input).trim();
    if (!message || sending) return;
    setError(null);
    setLastFailedMessage(null);
    setSending(true);
    setInput("");

    const optimisticUser: DisplayMessage = {
      id: makeOptimisticId("optimistic"),
      role: "USER",
      content: message,
      suggestedActions: null,
      createdAt: nowIso(),
    };
    const assistantId = makeOptimisticId("reply");
    const assistantPlaceholder: DisplayMessage = {
      id: assistantId,
      role: "ASSISTANT",
      content: "",
      suggestedActions: null,
      createdAt: nowIso(),
      streaming: true,
    };
    setMessages((prev) => [...prev, optimisticUser, assistantPlaceholder]);

    await runStream("/api/coach/message", { message }, assistantId);
  };
  useEffect(() => {
    sendRef.current = send;
  });

  useEffect(() => {
    if (autoAskedRef.current) return;
    autoAskedRef.current = true;
    const ask = new URLSearchParams(window.location.search).get("ask");
    if (ask) {
      window.history.replaceState(null, "", window.location.pathname);
      sendRef.current(ask);
    }
  }, []);

  const regenerate = async () => {
    if (sending) return;
    const lastAssistant = [...messages].reverse().find((m) => m.role === "ASSISTANT");
    if (!lastAssistant) return;

    setError(null);
    setSending(true);

    const assistantId = makeOptimisticId("reply");
    setMessages((prev) => [
      ...prev.filter((m) => m.id !== lastAssistant.id),
      { id: assistantId, role: "ASSISTANT", content: "", suggestedActions: null, createdAt: nowIso(), streaming: true },
    ]);

    await runStream("/api/coach/regenerate", {}, assistantId);
  };

  const stopGenerating = () => {
    abortRef.current?.abort();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "ASSISTANT")?.id;

  return (
    <div>
      {messages.length === 0 ? (
        <div className="mx-auto flex min-h-[55dvh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-3 text-center sm:px-4">
          <div className="bg-primary/15 flex size-12 items-center justify-center rounded-full">
            <Sparkles className="text-primary size-6" />
          </div>
          <div className="max-w-sm space-y-1.5">
            <p className="text-lg font-semibold">{page.greetingTitle}</p>
            <p className="text-muted-foreground text-sm">{page.capabilitiesLine}</p>
          </div>
          <div className="flex max-w-md flex-wrap justify-center gap-2">
            {(Object.entries(page.quickActions) as [keyof typeof page.quickActions, string][]).map(([key, label]) => (
              <Button key={key} size="sm" variant="outline" onClick={() => send(label)} disabled={sending}>
                {label}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-3xl flex-col space-y-3.5 px-3 py-2 sm:px-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <CoachMessageBubble key={msg.id} msg={msg} isLastAssistant={msg.id === lastAssistantId} onRegenerate={regenerate} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="pt-3">
        <div ref={bottomRef} className="mx-auto w-full max-w-3xl px-3 pb-4 sm:px-4">
          {error && (
            <div className="mb-2 flex items-center justify-between gap-2 text-sm">
              <p className="text-destructive">{error}</p>
              <Button type="button" size="sm" variant="outline" onClick={() => lastFailedMessage && send(lastFailedMessage)}>
                <RotateCw className="size-3.5" />
                {page.retry}
              </Button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!sending) send();
            }}
            className="composer-shell bg-card shadow-card flex items-end gap-2 rounded-2xl p-1.5"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={page.placeholder}
              disabled={sending}
              rows={1}
              className="max-h-40 min-h-10 resize-none border-transparent bg-transparent py-2.5 focus-visible:border-transparent focus-visible:ring-0"
            />
            {sending ? (
              <Button type="button" variant="secondary" className="shrink-0" onClick={stopGenerating}>
                <Square className="fill-current" />
                {page.stop}
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim()} className="shrink-0">
                <Send />
                {page.send}
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
