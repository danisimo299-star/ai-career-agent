import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { resumeService } from "@/server/services/resume.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const resumes = await resumeService.listByUser(user.id);
  return NextResponse.json({ resumes });
}
