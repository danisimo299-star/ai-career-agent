import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { coachService } from "@/server/services/coach.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const messages = await coachService.listMessages(user.id);
  return NextResponse.json({ messages });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await coachService.clearHistory(user.id);
  return NextResponse.json({ ok: true });
}
