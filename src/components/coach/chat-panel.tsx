"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Send, RotateCw, Sparkles, User, Square, Copy, Check, RefreshCw, ArrowDown } from "lucide-react";
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
  /** A real (non-abort) error cut the stream short — the text received up to that point is kept, never discarded, with this flag surfacing an inline "couldn't finish" note instead. */
  errored?: boolean;
}

/**
 * Real deltas already arrive from the server as they're generated (see
 * `runStream` below) — this just re-paces *drawing* them so a burst never
 * flashes onto screen in one jump. Chars-per-frame scales with how much is
 * backlogged: a steady trickle reveals at a brisk, readable typewriter
 * pace (the floor), while a sudden burst (or the tail end of an
 * already-finished stream) catches up in a bounded handful of frames
 * instead of dragging a long reply out — see item 4 of the brief this
 * implements ("adaptive speed, never a 10–20s decorative delay").
 */
const REVEAL_MIN_CHARS_PER_FRAME = 2;
const REVEAL_CATCH_UP_FRAMES = 24;

function nextRevealChunkSize(pendingLength: number): number {
  return Math.max(REVEAL_MIN_CHARS_PER_FRAME, Math.ceil(pendingLength / REVEAL_CATCH_UP_FRAMES));
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
            "text-base leading-relaxed",
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
            <>
              <MessageContent content={msg.content} />
              {msg.streaming && (
                <span className="bg-foreground/70 ml-0.5 inline-block h-3.5 w-[2px] animate-pulse align-text-bottom" aria-hidden="true" />
              )}
              {msg.errored && <p className="text-destructive mt-1.5 text-xs">{page.errorIncomplete}</p>}
            </>
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
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoAskedRef = useRef(false);
  const mountedRef = useRef(true);
  // The actual scrollable ancestor — the dashboard shell's shared `<main>`,
  // not something this component owns — resolved once on mount by walking
  // up from `bottomRef` rather than assumed, so this keeps working if the
  // surrounding layout ever changes.
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const nearBottomRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const NEAR_BOTTOM_THRESHOLD_PX = 120;

  const checkNearBottom = () => {
    const el = scrollParentRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
  };

  // Deliberately not `bottomRef.current?.scrollIntoView({ block: "end" })`:
  // that stops as soon as the target's own edge touches the scrollport's
  // edge — it has no notion that the last ~90px of this scrollport is
  // visually covered by the fixed bottom nav (that's exactly what
  // `<main>`'s bottom padding reserves room for). Scrolling the container
  // to its true `scrollHeight` instead moves the composer past that
  // reserved padding too, clearing the nav for real.
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = scrollParentRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
    else bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  useEffect(() => {
    let node: HTMLElement | null = bottomRef.current?.parentElement ?? null;
    while (node) {
      const style = getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) break;
      node = node.parentElement;
    }
    scrollParentRef.current = node;
    if (!node) return;

    const onScroll = () => {
      const atBottom = checkNearBottom();
      nearBottomRef.current = atBottom;
      setShowJumpToBottom(!atBottom);
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
    // Only needs to run once — the scroll parent doesn't change identity across renders.
  }, []);

  // A brand-new message (the user's own send) always scrolls into view —
  // only *streaming updates* to an already-visible message respect the
  // user having scrolled away (see the `content`-only effect further
  // down, next to `runStream`). The very first render needs its own
  // explicit flag: `prevMessageCountRef` starts out already equal to the
  // initial `messages.length` (it's seeded from the same value), so the
  // "did the count change" check below is trivially false on mount and
  // would otherwise never fire — meaning returning to an existing
  // conversation left the page sitting at scroll-top 0, with the composer
  // and most recent messages rendered below the fold, behind the fixed
  // bottom nav, until the user scrolled manually.
  const isFirstRenderRef = useRef(true);
  const prevMessageCountRef = useRef(messages.length);
  useEffect(() => {
    const isMount = isFirstRenderRef.current;
    isFirstRenderRef.current = false;
    if (isMount || messages.length !== prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length;
      nearBottomRef.current = true;
      setShowJumpToBottom(false);
      scrollToBottom(isMount || messages.length <= 1 ? "auto" : "smooth");
    }
  }, [messages.length]);

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
      if (!mountedRef.current) return;
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)));
    };

    // Real deltas arrive from the server as fast as the model generates
    // them (see `readCoachSseEvents`/`coachService.streamMessage`) — they
    // land in `pending` immediately. What actually reaches screen is
    // *drawn* from `pending` on a `requestAnimationFrame` cadence instead,
    // so a chunk that arrives coalesced (a whole sentence in one SSE
    // frame) still reveals as a smooth typewriter run rather than
    // flashing in, and this doubles as the render-batching item 13 asks
    // for — one state update per frame, not one per SSE event.
    let pending = "";
    let doneMeta: { suggestedActions: DisplayMessage["suggestedActions"]; memoryNoted: boolean } | null = null;
    let streamEnded = false;
    let rafId = 0;

    const revealTick = () => {
      if (pending.length > 0) {
        const take = nextRevealChunkSize(pending.length);
        const chunk = pending.slice(0, take);
        pending = pending.slice(take);
        if (mountedRef.current) {
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)));
          if (nearBottomRef.current) scrollToBottom("auto");
        }
      }
      if (pending.length > 0 || !streamEnded) {
        rafId = requestAnimationFrame(revealTick);
      } else {
        rafId = 0;
        if (doneMeta) updateAssistant({ streaming: false, ...doneMeta });
      }
    };
    rafId = requestAnimationFrame(revealTick);

    const stopRevealLoop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
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
          pending += event.text;
        } else if (event.type === "done") {
          sawDone = true;
          doneMeta = { suggestedActions: event.suggestedActions, memoryNoted: event.memoryNoted };
        } else if (event.type === "error") {
          errorCode = event.code ?? "generic";
          break;
        }
      }
      streamEnded = true;
      if (errorCode) throw new Error(errorCode);
      if (!sawDone) throw new Error("generic");
      onMessageSent();
    } catch (err) {
      streamEnded = true;
      stopRevealLoop();
      // Whatever text had already arrived but not yet finished drawing —
      // flush it immediately rather than lose it, on both the abort and
      // the real-error path below.
      if (pending && mountedRef.current) {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + pending } : m)));
        pending = "";
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        // The user stopped generation on purpose — keep whatever text streamed in so far, just mark it finished.
        updateAssistant({ streaming: false });
        return;
      }
      // A real network/server failure mid-stream — keep the partial reply
      // visible (never delete it) and mark it so, instead of the old
      // behavior of silently dropping the whole bubble.
      updateAssistant({ streaming: false, errored: true });
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
    <div className="mx-auto flex min-h-[65dvh] w-full max-w-3xl flex-col">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-3 text-center sm:px-4">
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
        // `justify-end` anchors a short thread to the bottom of the flex
        // column (next to the composer) instead of leaving it stranded up
        // near the header with a dead gap below — see item on the chat
        // composer floating mid-page.
        <div className="flex flex-1 flex-col justify-end space-y-3.5 px-3 py-2 sm:px-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <CoachMessageBubble key={msg.id} msg={msg} isLastAssistant={msg.id === lastAssistantId} onRegenerate={regenerate} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showJumpToBottom && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="sticky bottom-0 z-10 flex justify-center pb-1"
          >
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="shadow-card gap-1.5 rounded-full"
              onClick={() => {
                nearBottomRef.current = true;
                setShowJumpToBottom(false);
                scrollToBottom("smooth");
              }}
            >
              <ArrowDown className="size-3.5" />
              {page.scrollToBottom}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-3">
        <div ref={bottomRef} className="px-3 pb-4 sm:px-4">
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
