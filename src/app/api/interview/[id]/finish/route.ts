import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { interviewService, InterviewAccessError } from "@/server/services/interview.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const locale = await getLocale();

  try {
    const session = await interviewService.finishSession(user.id, id, locale);
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof InterviewAccessError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("interview.finishSession failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
