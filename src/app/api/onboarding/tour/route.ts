import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { onboardingService } from "@/server/services/onboarding.service";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await onboardingService.completeTour(user.id);
  return NextResponse.json({ ok: true });
}
