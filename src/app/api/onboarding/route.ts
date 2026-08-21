import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { onboardingSchema } from "@/lib/validation/onboarding.schema";
import { onboardingService } from "@/server/services/onboarding.service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const profile = await onboardingService.complete(user.id, parsed.data);
  return NextResponse.json(profile);
}
