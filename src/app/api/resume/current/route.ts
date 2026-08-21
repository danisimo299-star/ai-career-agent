import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { resumeService } from "@/server/services/resume.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const resume = await resumeService.getCurrent(user.id);
    return NextResponse.json({ resume });
  } catch (error) {
    console.error("resume.getCurrent failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
