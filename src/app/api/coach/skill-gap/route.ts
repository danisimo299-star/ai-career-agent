import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { coachService } from "@/server/services/coach.service";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const locale = await getLocale();
  const url = new URL(request.url);
  const targetRole = url.searchParams.get("targetRole") ?? undefined;
  const city = url.searchParams.get("city") ?? undefined;

  const skillGap = await coachService.getSkillGap(user.id, locale, targetRole, city);
  return NextResponse.json({ skillGap });
}
