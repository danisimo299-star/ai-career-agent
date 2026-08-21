import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { careerMissionService } from "@/server/services/career-mission.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const history = await careerMissionService.getHistory(user.id);
  return NextResponse.json({ history });
}
