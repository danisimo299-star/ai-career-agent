import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { coachService } from "@/server/services/coach.service";
import { coachSseResponse } from "../sse";

/** Same SSE framing as `/api/coach/message` — see `coachSseResponse` — for a fresh answer to the last question instead of a new one. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const locale = await getLocale();

  return coachSseResponse(coachService.regenerateLastReply(user.id, locale, request.signal));
}
