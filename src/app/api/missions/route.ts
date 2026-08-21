import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { missionsService } from "@/server/services/missions.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const missions = await missionsService.sync(user.id);
  return NextResponse.json({ missions });
}
