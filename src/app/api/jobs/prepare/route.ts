import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { jobsService } from "@/server/services/jobs.service";
import { prepareForJobSchema } from "@/lib/validation/job.schema";
import { AIProviderUnavailableError } from "@/lib/errors";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = prepareForJobSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const locale = await getLocale();

  try {
    const preparation = await jobsService.prepareForJob(user.id, locale, parsed.data);
    return NextResponse.json(preparation);
  } catch (error) {
    if (error instanceof AIProviderUnavailableError) return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    console.error("jobs.prepareForJob failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
