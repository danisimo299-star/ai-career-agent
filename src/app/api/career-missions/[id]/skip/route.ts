import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { careerMissionService, CareerMissionAccessError } from "@/server/services/career-mission.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await careerMissionService.skipMission(user.id, id);
    const locale = await getLocale();
    const today = await careerMissionService.getToday(user.id, locale);
    return NextResponse.json(today);
  } catch (error) {
    if (error instanceof CareerMissionAccessError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("careerMissions.skipMission failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
