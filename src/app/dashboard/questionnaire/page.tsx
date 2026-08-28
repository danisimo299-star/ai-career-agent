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
    // `<main>` pads its bottom by 6rem on mobile (room for the fixed bottom
    // nav) but only 1.5rem at md+ — this full-bleed view has to cancel
    // exactly that, not a flat `-m-6`, or mobile is left with ~4.5rem of
    // dead space below the composer.
    <div className="-mx-6 -mt-6 -mb-24 flex h-[calc(100dvh-4rem)] flex-col md:-mb-6">
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
