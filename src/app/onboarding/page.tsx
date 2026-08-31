import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { profileRepository } from "@/server/repositories/profile.repository";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

// Same reasoning as `dashboard/layout.tsx` — signed-in only, redirects
// before rendering for anyone else, noindex is defense-in-depth.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const profile = await profileRepository.findByUserId(user.id);
  if (profile?.onboardingCompleted) redirect("/dashboard");

  return <OnboardingWizard />;
}
