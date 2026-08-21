"use client";

import { MessageBubble as SharedMessageBubble } from "@/components/shared/message-bubble";
import type { QuestionnaireMessageData } from "./types";

export function MessageBubble({ message }: { message: QuestionnaireMessageData }) {
  if (!message.content) return null;
  return <SharedMessageBubble message={{ id: message.id, role: message.role, content: message.content }} />;
}
