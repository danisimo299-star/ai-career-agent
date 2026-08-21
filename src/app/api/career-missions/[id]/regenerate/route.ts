import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { careerMissionService, CareerMissionAccessError } from "@/server/services/career-mission.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const locale = await getLocale();

  try {
    const missions = await careerMissionService.regenerateMission(user.id, id, locale);
    return NextResponse.json({ missions });
  } catch (error) {
    if (error instanceof CareerMissionAccessError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      console.error("careerMissions.regenerateMission: AI response failed validation", error.flatten());
      return NextResponse.json({ error: "ai_invalid_response" }, { status: 502 });
    }
    console.error("careerMissions.regenerateMission failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
