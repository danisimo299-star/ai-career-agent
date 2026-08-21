import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jobsService } from "@/server/services/jobs.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const jobs = await jobsService.recommend(user.id);
  return NextResponse.json({ jobs });
}
