import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { careerMissionService, CareerMissionAccessError } from "@/server/services/career-mission.service";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const locale = await getLocale();

  try {
    const result = await careerMissionService.generateToday(user.id, locale);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CareerMissionAccessError && error.message === "no_roadmap") {
      return NextResponse.json({ error: "no_roadmap" }, { status: 409 });
    }
    if (error instanceof z.ZodError) {
      console.error("careerMissions.generateToday: AI response failed validation", error.flatten());
      return NextResponse.json({ error: "ai_invalid_response" }, { status: 502 });
    }
    console.error("careerMissions.generateToday failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
