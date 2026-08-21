import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jobsService } from "@/server/services/jobs.service";
import { jobSearchFiltersSchema } from "@/lib/validation/job.schema";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = jobSearchFiltersSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const result = await jobsService.search(user.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("jobs.search failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
