import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { careerAnalysisService } from "@/server/services/career-analysis.service";
import { AIProviderUnavailableError } from "@/lib/errors";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await careerAnalysisService.getExisting(user.id);
  return NextResponse.json(result);
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const locale = await getLocale();

  try {
    const result = await careerAnalysisService.analyze(user.id, locale);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AIProviderUnavailableError) {
      console.error("careerAnalysis.analyze: AI provider unavailable", error);
      return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    }
    console.error("careerAnalysis.analyze failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
