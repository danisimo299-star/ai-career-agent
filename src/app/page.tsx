import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LandingPage } from "@/components/landing/landing-page";

/**
 * This was the actual cause of "closing the browser feels like it logged
 * me out": the root URL — the one a bookmark or a freshly reopened browser
 * actually lands on — used to render the public marketing page
 * unconditionally, with no auth check at all, regardless of whether the
 * visitor had a perfectly valid session. The session cookie was never the
 * problem; this page just never looked at it. `dashboard/layout.tsx`
 * handles the onboarding-incomplete case from `/dashboard`, so this only
 * needs the one check.
 */
export default async function RootPage() {
  const user = await getCurrentUser();
  if (user?.id) redirect("/dashboard");

  return <LandingPage />;
}
