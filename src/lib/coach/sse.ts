import type { CoachActionSuggestion } from "@/components/coach/types";

export interface StreamDeltaEvent {
  type: "delta";
  text: string;
}
export interface StreamDoneEvent {
  type: "done";
  suggestedActions: CoachActionSuggestion[];
  memoryNoted: boolean;
}
export interface StreamErrorEvent {
  type: "error";
  code?: "unavailable" | "generic";
}
export type CoachStreamEvent = StreamDeltaEvent | StreamDoneEvent | StreamErrorEvent;

/** Parses `/api/coach/message`'s and `/api/coach/regenerate`'s SSE stream — shared by the full Chat page and the Dashboard chat preview so both read the exact same wire format. */
export async function* readCoachSseEvents(response: Response): AsyncGenerator<CoachStreamEvent> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      try {
        yield JSON.parse(line.slice("data:".length).trim()) as CoachStreamEvent;
      } catch {
        // Ignore a malformed frame rather than breaking the whole stream.
      }
    }
  }
}
