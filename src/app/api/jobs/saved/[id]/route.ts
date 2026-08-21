import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jobsService, JobAccessError } from "@/server/services/jobs.service";
import { updateSavedJobStatusSchema } from "@/lib/validation/job.schema";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSavedJobStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const savedJob = await jobsService.updateSavedJobStatus(user.id, id, parsed.data.status, parsed.data.notes);
    return NextResponse.json({ savedJob });
  } catch (error) {
    if (error instanceof JobAccessError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("jobs.updateSavedJobStatus failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await jobsService.deleteSavedJob(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof JobAccessError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("jobs.deleteSavedJob failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
