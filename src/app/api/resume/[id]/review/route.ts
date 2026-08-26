import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { resumeService, ResumeAccessError } from "@/server/services/resume.service";
import { reviewResumeSchema } from "@/lib/validation/resume.schema";
import { AIProviderUnavailableError } from "@/lib/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = reviewResumeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const locale = await getLocale();

  try {
    const review = await resumeService.review(user.id, id, parsed.data.targetRole, locale);
    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof ResumeAccessError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ai_invalid_response" }, { status: 502 });
    if (error instanceof AIProviderUnavailableError) return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    console.error("resume.review failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
