import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { jobsService } from "@/server/services/jobs.service";
import { jobSearchAssistantInputSchema } from "@/lib/validation/job.schema";

/** Converts free text into structured filters only — the client must still call /api/jobs/search with the result, which re-validates every field. Never executes a query itself. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = jobSearchAssistantInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const locale = await getLocale();

  try {
    const filters = await jobsService.parseSearchAssistantQuery(locale, parsed.data.freeText);
    return NextResponse.json({ filters });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "ai_invalid_response" }, { status: 502 });
    console.error("jobs.parseSearchAssistantQuery failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
