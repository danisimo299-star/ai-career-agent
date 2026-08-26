import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { profileRepository } from "@/server/repositories/profile.repository";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const profile = await profileRepository.findByUserId(user.id);

  return (
    <SettingsView
      userName={user.name ?? ""}
      profile={{
        age: profile?.age ?? null,
        city: profile?.city ?? null,
        educationStage: profile?.educationStage ?? null,
        experienceLevel: profile?.experienceLevel ?? null,
        aiUseProfileContext: profile?.aiUseProfileContext ?? true,
        aiRememberHistory: profile?.aiRememberHistory ?? true,
        aiReplyStyle: profile?.aiReplyStyle ?? "BALANCED",
      }}
    />
  );
}
