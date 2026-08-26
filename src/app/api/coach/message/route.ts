import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { coachService } from "@/server/services/coach.service";
import { coachMessageInputSchema } from "@/lib/validation/coach.schema";
import { coachSseResponse } from "../sse";

/**
 * Streams the Coach reply as Server-Sent Events instead of one JSON blob —
 * `delta` frames carry text as the model generates it, a trailing `done`
 * frame carries the suggested actions/memory flag once the reply and the
 * (concurrently-run) intent classification have both resolved. `EventSource`
 * can't send a POST body, so the client reads this with a plain `fetch` +
 * manual stream parsing instead of the `EventSource` API.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = coachMessageInputSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400 });

  const locale = await getLocale();

  return coachSseResponse(coachService.streamMessage(user.id, locale, parsed.data.message, request.signal));
}
