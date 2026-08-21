import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { interviewService, InterviewAccessError } from "@/server/services/interview.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const session = await interviewService.getById(user.id, id);
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof InterviewAccessError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("interview.getById failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
