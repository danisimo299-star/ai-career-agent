import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { careerAnalysisService, CareerAnalysisAlreadyProcessingError } from "@/server/services/career-analysis.service";
import { AIProviderUnavailableError } from "@/lib/errors";
import { AICapacityError } from "@/lib/ai/concurrency";

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
    // A second request while this user's own generation is still in flight
    // (double-click before the button disabled, a second tab, a network
    // retry) — never a real failure, so the client falls back to polling
    // the one generation that's actually running instead of erroring out.
    if (error instanceof CareerAnalysisAlreadyProcessingError) {
      return NextResponse.json({ error: "already_processing" }, { status: 409 });
    }
    if (error instanceof AICapacityError) {
      // The local Ollama process is already at its concurrent-generation
      // limit and this request wasn't willing to queue any longer — a real,
      // honest "busy" state, not a bug (item 29 of the performance brief).
      return NextResponse.json({ error: "ai_busy" }, { status: 503 });
    }
    if (error instanceof AIProviderUnavailableError) {
      console.error("careerAnalysis.analyze: AI provider unavailable", error);
      return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    }
    console.error("careerAnalysis.analyze failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
