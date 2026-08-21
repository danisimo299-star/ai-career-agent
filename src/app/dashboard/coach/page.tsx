import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { coachService } from "@/server/services/coach.service";
import { stripCoachDisplayMarkers } from "@/lib/ai/career/mock-coach";
import { CoachView } from "@/components/coach/coach-view";
import type { CoachMessageData, CoachActionSuggestion } from "@/components/coach/types";

export default async function CoachPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const locale = await getLocale();

  const [messages, context, readiness, applicationAnalytics, nextActions, plan] = await Promise.all([
    coachService.listMessages(user.id),
    coachService.getContext(user.id, locale),
    coachService.getReadiness(user.id, locale),
    coachService.getApplicationAnalytics(user.id),
    coachService.getNextActions(user.id, locale),
    coachService.getCareerPlan(user.id),
  ]);

  const initialMessages: CoachMessageData[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: stripCoachDisplayMarkers(m.content),
    suggestedActions: (m.suggestedActions as unknown as CoachActionSuggestion[] | null) ?? null,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <CoachView
      initialMessages={initialMessages}
      context={context}
      readiness={readiness}
      applicationAnalytics={applicationAnalytics}
      nextActions={nextActions}
      plan={plan}
    />
  );
}
