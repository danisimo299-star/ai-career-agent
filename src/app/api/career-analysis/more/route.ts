import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { careerAnalysisService, CareerAnalysisAlreadyProcessingError } from "@/server/services/career-analysis.service";
import { AIProviderUnavailableError } from "@/lib/errors";

/** "Показать ещё варианты" — adds more validated professions without discarding what's already there (see `careerAnalysisService.findMore`). */
export async function POST() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const locale = await getLocale();

  try {
    const result = await careerAnalysisService.findMore(user.id, locale);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CareerAnalysisAlreadyProcessingError) {
      return NextResponse.json({ error: "already_processing" }, { status: 409 });
    }
    if (error instanceof AIProviderUnavailableError) {
      return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    }
    console.error("careerAnalysis.findMore failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
