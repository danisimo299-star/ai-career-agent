"use client";

import { motion } from "motion/react";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MessageBubbleData {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/** Generic two-party message bubble — shared by the Interview Simulator's Q&A transcript and (indirectly) the Questionnaire. */
export function MessageBubble({ message }: { message: MessageBubbleData }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
        )}
      >
        {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap sm:max-w-[70%]",
          isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"
        )}
      >
        {message.content}
      </div>
    </motion.div>
  );
}
