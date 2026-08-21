import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { profileService } from "@/server/services/profile.service";
import { profileUpdateSchema } from "@/lib/validation/profile.schema";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await profileService.getProfile(user.id);
  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const profile = await profileService.updateProfile(user.id, parsed.data);
  return NextResponse.json(profile);
}
