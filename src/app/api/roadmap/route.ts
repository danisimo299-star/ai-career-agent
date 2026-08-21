import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { roadmapService } from "@/server/services/roadmap.service";

const generateSchema = z.object({
  careerTitle: z.string().trim().min(1).max(200),
  careerRecommendationId: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const roadmap = await roadmapService.getForUser(user.id);
  return NextResponse.json({ roadmap });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const locale = await getLocale();

  try {
    const roadmap = await roadmapService.generate(
      user.id,
      parsed.data.careerTitle,
      locale,
      parsed.data.careerRecommendationId
    );
    return NextResponse.json({ roadmap });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("roadmap.generate: AI response failed validation", error.flatten());
      return NextResponse.json({ error: "ai_invalid_response" }, { status: 502 });
    }
    console.error("roadmap.generate failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
