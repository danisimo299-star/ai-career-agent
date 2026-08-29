import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { interviewService } from "@/server/services/interview.service";
import { AIProviderUnavailableError } from "@/lib/errors";

const startSessionSchema = z.object({
  targetRole: z.string().trim().min(1).max(150),
  interviewType: z.enum(["GENERAL", "TECHNICAL", "BEHAVIORAL", "HR", "MIXED", "RESUME_BASED"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  experienceLevel: z.enum(["STUDENT", "JUNIOR", "MID", "SENIOR"]),
  questionCount: z.union([z.literal(5), z.literal(10), z.literal(15)]),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = startSessionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const locale = await getLocale();

  try {
    const session = await interviewService.startSession(user.id, locale, parsed.data);
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ai_invalid_response" }, { status: 502 });
    if (error instanceof AIProviderUnavailableError) return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    console.error("interview.startSession failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
