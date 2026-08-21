import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { coachService } from "@/server/services/coach.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const analytics = await coachService.getApplicationAnalytics(user.id);
  return NextResponse.json({ analytics });
}
