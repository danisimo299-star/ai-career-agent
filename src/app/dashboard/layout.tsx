import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { getCurrentUser } from "@/lib/auth/session";
import { profileRepository } from "@/server/repositories/profile.repository";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile?.onboardingCompleted) redirect("/onboarding");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar userName={user?.name} />
        <main className="min-w-0 flex-1 space-y-6 p-6 pb-24 md:pb-6">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
