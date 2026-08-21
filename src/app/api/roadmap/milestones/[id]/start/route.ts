import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { roadmapService, RoadmapAccessError } from "@/server/services/roadmap.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const roadmap = await roadmapService.startMilestone(user.id, id);
    return NextResponse.json({ roadmap });
  } catch (error) {
    if (error instanceof RoadmapAccessError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("roadmap.startMilestone failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
