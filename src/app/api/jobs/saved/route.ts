import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jobsService } from "@/server/services/jobs.service";
import { saveJobSchema } from "@/lib/validation/job.schema";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const savedJobs = await jobsService.listSaved(user.id);
  return NextResponse.json({ savedJobs });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = saveJobSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const savedJob = await jobsService.saveJob(user.id, parsed.data);
  return NextResponse.json({ savedJob });
}
