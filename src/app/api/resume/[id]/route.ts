import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { resumeService, ResumeAccessError } from "@/server/services/resume.service";
import { updateResumeSchema } from "@/lib/validation/resume.schema";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const resume = await resumeService.getById(user.id, id);
    return NextResponse.json({ resume });
  } catch (error) {
    if (error instanceof ResumeAccessError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("resume.getById failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateResumeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const resume = await resumeService.update(user.id, id, parsed.data);
    return NextResponse.json({ resume });
  } catch (error) {
    if (error instanceof ResumeAccessError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    console.error("resume.update failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
