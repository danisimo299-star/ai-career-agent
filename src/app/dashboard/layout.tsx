import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { DashboardTour } from "@/components/onboarding/dashboard-tour";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { profileRepository } from "@/server/repositories/profile.repository";
import { getUserTargetRole, getTopbarNotifications } from "@/server/services/dashboard.service";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile?.onboardingCompleted) redirect("/onboarding");

  const locale = await getLocale();
  const [targetRole, notifications] = await Promise.all([getUserTargetRole(user.id), getTopbarNotifications(user.id, locale)]);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar userName={user?.name} userEmail={user?.email} targetRole={targetRole} />
      <div className="page-depth flex min-w-0 flex-1 flex-col">
        <DashboardTopbar userName={user?.name} userImage={user?.image} notifications={notifications} />
        {/* The one scroll container for the whole shell — sidebar/topbar stay
            fixed, every page (including Chat) scrolls in here, no page owns
            a competing inner scroll region. `min-h-0` is required for a
            flex child to actually shrink and let `overflow-y-auto` engage
            instead of just growing the parent. Chat's composer uses
            `position: sticky` against this container instead of a nested
            flex-fill height chain — sticky degrades gracefully to its
            natural flow position when content is short, so a short
            conversation never leaves a stretched empty gap above it. */}
        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto p-6 pb-[var(--mobile-bottom-nav-clearance)] md:pb-6">{children}</main>
      </div>
      <MobileBottomNav />
      <CommandPalette />
      <Suspense>
        <DashboardTour tourCompleted={profile.tourCompleted} />
      </Suspense>
    </div>
  );
}
