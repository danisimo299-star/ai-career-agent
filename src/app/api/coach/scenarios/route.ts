import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { coachService } from "@/server/services/coach.service";
import { compareScenariosInputSchema } from "@/lib/validation/coach.schema";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = compareScenariosInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const locale = await getLocale();

  try {
    const scenarios = await coachService.compareScenarios(user.id, locale, parsed.data.roleTitles);
    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error("coach.compareScenarios failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
