import { AIProviderUnavailableError } from "@/lib/errors";

function sseEvent(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Wraps an async generator of Coach stream events into an SSE `Response`.
 * Shared by `/api/coach/message` and `/api/coach/regenerate` — same framing,
 * same error mapping, only the generator differs. A client-initiated abort
 * (see `request.signal`, threaded into the generator) surfaces as
 * `DOMException("AbortError")` here; it's expected, not a real failure, so
 * it's swallowed instead of logged or turned into an `error` SSE frame the
 * disconnected client will never read.
 */
export function coachSseResponse<T>(generator: AsyncGenerator<T>): Response {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generator) {
          controller.enqueue(sseEvent(event));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // The client stopped generation — nothing to report.
        } else {
          console.error("coach stream failed", error);
          const code = error instanceof AIProviderUnavailableError ? "unavailable" : "generic";
          try {
            controller.enqueue(sseEvent({ type: "error", code }));
          } catch {
            // The client may already be gone — enqueueing on a closed controller throws; nothing more to do.
          }
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed (e.g. after the client aborted) — fine to ignore.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
