import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { chatService } from "@/server/services/chat.service";

/** "Пройти интервью заново" — starts a fresh `InterviewAttempt`; the old Career Profile/Analysis stay active until the new attempt actually completes. See `chatService.restartInterview`. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await chatService.restartInterview(user.id);
  return NextResponse.json({ ok: true });
}
