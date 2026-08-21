import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { profileRepository } from "@/server/repositories/profile.repository";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const profile = await profileRepository.findByUserId(user.id);
  if (profile?.onboardingCompleted) redirect("/dashboard");

  return <OnboardingWizard />;
}
