import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { profileService } from "@/server/services/profile.service";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await profileService.resetCareerProfile(user.id);
  return NextResponse.json({ ok: true });
}
