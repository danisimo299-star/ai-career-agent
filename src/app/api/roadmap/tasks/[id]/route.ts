import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { roadmapService, RoadmapAccessError } from "@/server/services/roadmap.service";

const toggleSchema = z.object({ completed: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const roadmap = await roadmapService.toggleTask(user.id, id, parsed.data.completed);
    return NextResponse.json({ roadmap });
  } catch (error) {
    if (error instanceof RoadmapAccessError) {
      const status = error.message === "locked" ? 409 : 404;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("roadmap.toggleTask failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
