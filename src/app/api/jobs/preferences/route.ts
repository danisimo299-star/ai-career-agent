import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jobsService } from "@/server/services/jobs.service";
import { jobPreferencesSchema } from "@/lib/validation/job.schema";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const preferences = await jobsService.getPreferences(user.id);
  return NextResponse.json({ preferences });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = jobPreferencesSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const preferences = await jobsService.updatePreferences(user.id, parsed.data);
  return NextResponse.json({ preferences });
}
