import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { chatService } from "@/server/services/chat.service";
import { profileRepository } from "@/server/repositories/profile.repository";
import { QuestionnaireWindow } from "@/components/questionnaire/questionnaire-window";
import type { QuestionSpecData } from "@/components/questionnaire/types";

export default async function QuestionnairePage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const locale = await getLocale();
  const [messages, progress, profile] = await Promise.all([
    chatService.getConversation(user.id, locale),
    chatService.getProgress(user.id),
    profileRepository.findByUserId(user.id),
  ]);

  const initialMessages = messages.map((message) => ({
    id: message.id,
    role: message.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: message.content,
    questionSpec: (message.questionSpec as unknown as QuestionSpecData | null) ?? null,
  }));

  return (
    // `<main>` pads its bottom by `--mobile-bottom-nav-clearance` on mobile
    // (room for the fixed bottom nav) but only 1.5rem at md+ — this
    // full-bleed view has to cancel exactly that via margin, not a flat
    // `-m-6`. Canceling the margin alone isn't enough on its own, though:
    // the container's *height* also has to shrink by that same amount on
    // mobile, or it fills the full space below the header and its own
    // bottom edge — including whatever sits at the end of the scrollable
    // question list, like the "Продолжить" button — ends up rendered
    // underneath the fixed bottom nav instead of above it.
    <div className="-mx-6 -mt-6 -mb-[var(--mobile-bottom-nav-clearance)] flex h-[calc(100dvh-4rem-var(--mobile-bottom-nav-clearance))] flex-col md:-mb-6 md:h-[calc(100dvh-4rem)]">
      <QuestionnaireWindow
        initialMessages={initialMessages}
        initialProgress={progress.percent}
        initialStep={progress.step}
        initialTotalSteps={progress.total}
        initialIsComplete={progress.isComplete}
        interests={profile?.interests ?? []}
      />
    </div>
  );
}
