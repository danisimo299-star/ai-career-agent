import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { coachService } from "@/server/services/coach.service";
import { coachMessageInputSchema } from "@/lib/validation/coach.schema";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = coachMessageInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const locale = await getLocale();

  try {
    const result = await coachService.sendMessage(user.id, locale, parsed.data.message);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ai_invalid_response" }, { status: 502 });
    console.error("coach.sendMessage failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
