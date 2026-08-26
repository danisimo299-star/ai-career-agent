import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { interviewService, InterviewAccessError } from "@/server/services/interview.service";
import { AIProviderUnavailableError } from "@/lib/errors";

const answerSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const locale = await getLocale();

  try {
    const session = await interviewService.submitAnswer(user.id, id, parsed.data.answer, locale);
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof InterviewAccessError) {
      const status = error.message === "not_found" ? 404 : 409;
      return NextResponse.json({ error: error.message }, { status });
    }
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ai_invalid_response" }, { status: 502 });
    if (error instanceof AIProviderUnavailableError) return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    console.error("interview.submitAnswer failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
