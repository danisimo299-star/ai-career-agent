"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { User, Settings, LogOut, ChevronDown, Sparkles, Bell, Target, Briefcase } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { NavSearch } from "@/components/layout/nav-search";
import { ProfyMindLogo } from "@/components/brand/profymind-logo";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getInitials } from "@/lib/utils";

interface TopbarNotifications {
  pendingMissionsCount: number;
  proactiveInsight: { skill: string; jobCount: number } | null;
}

interface DashboardTopbarProps {
  userName?: string | null;
  userImage?: string | null;
  notifications: TopbarNotifications;
}

const SEEN_STORAGE_KEY = "profymind-notifications-seen";

/** A stable fingerprint of the current notification set — changes only when the underlying signals actually change, so re-opening the bell on the same state doesn't re-flag it as new. */
function notificationsSignature(notifications: TopbarNotifications): string {
  const missions = notifications.pendingMissionsCount > 0 ? `missions:${notifications.pendingMissionsCount}` : "";
  const insight = notifications.proactiveInsight ? `insight:${notifications.proactiveInsight.skill}:${notifications.proactiveInsight.jobCount}` : "";
  return [missions, insight].filter(Boolean).join("|");
}

export function DashboardTopbar({ userName, userImage, notifications }: DashboardTopbarProps) {
  const { dict } = useLocale();
  const initials = getInitials(userName);
  const t = dict.topbar;

  const hasMissions = notifications.pendingMissionsCount > 0;
  const hasInsight = notifications.proactiveInsight !== null;
  const hasNotifications = hasMissions || hasInsight;
  const signature = notificationsSignature(notifications);
  const notificationCount = (hasMissions ? 1 : 0) + (hasInsight ? 1 : 0);

  // Starts `true` (nothing flagged) so the first paint never shows a dot
  // it might have to immediately retract once the real seen-state loads —
  // matches the "start neutral, upgrade after mount" pattern used for the
  // time-of-day greeting elsewhere in this app.
  const [seenSignature, setSeenSignature] = useState<string | null>(signature);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        setSeenSignature(window.localStorage.getItem(SEEN_STORAGE_KEY));
      } catch {
        // Storage can be unavailable (private mode, blocked) — the dot just stays based on the neutral default.
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const isUnseen = hasNotifications && signature !== seenSignature;

  const markSeen = (open: boolean) => {
    if (!open) return;
    setSeenSignature(signature);
    try {
      window.localStorage.setItem(SEEN_STORAGE_KEY, signature);
    } catch {
      // Non-critical — worst case the dot reappears next visit.
    }
  };

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4 md:gap-3 md:px-6">
      {/* Sidebar carries the wordmark at md+ (it's hidden entirely below
          that), so mobile needs its own — otherwise there's no branding
          anywhere on the screen once the sidebar disappears. */}
      <Link href="/dashboard" className="flex shrink-0 items-center md:hidden">
        <ProfyMindLogo size="sm" className="text-sm tracking-tight" />
      </Link>
      <NavSearch />
      <div className="flex flex-1 items-center justify-end gap-0.5 md:gap-1">
        {/* AI quick action is a shortcut to Coach, which is already a
            primary bottom-nav destination on mobile — redundant there, and
            cutting it (plus the two below) is what keeps the mobile row
            from cramming into the same space as the desktop one. */}
        <Button
          size="icon"
          variant="ghost"
          className="text-tool-chat hidden md:inline-flex"
          aria-label={t.aiQuickActionLabel}
          title={t.aiQuickActionLabel}
          nativeButton={false}
          render={<Link href="/dashboard/coach" />}
        >
          <Sparkles />
        </Button>

        {/* Theme and language stay fully reachable on mobile via Settings
            (`InterfaceSection`) — dropped here only to give the header
            room to breathe. */}
        <span className="hidden md:contents">
          <LanguageSwitcher />
          <ThemeToggle />
        </span>

        <DropdownMenu onOpenChange={markSeen}>
          <DropdownMenuTrigger
            render={
              <Button size="icon" variant="ghost" className="relative" aria-label={t.notificationsLabel} title={t.notificationsLabel}>
                <Bell />
                {isUnseen && (
                  <span className="bg-tool-resume-solid absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white">
                    {notificationCount}
                  </span>
                )}
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-72">
            <p className="text-muted-foreground px-1.5 py-1 text-xs font-medium">{t.notificationsTitle}</p>
            <DropdownMenuSeparator />
            {!hasNotifications && <p className="text-muted-foreground px-2 py-3 text-sm">{t.notificationsEmpty}</p>}
            {hasMissions && (
              <DropdownMenuItem render={<Link href="/dashboard/missions" />}>
                <span className="bg-tool-tasks-solid flex size-7 shrink-0 items-center justify-center rounded-lg text-white">
                  <Target className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {t.missionsPendingTemplate.replace("{count}", String(notifications.pendingMissionsCount))}
                </span>
              </DropdownMenuItem>
            )}
            {hasInsight && notifications.proactiveInsight && (
              <DropdownMenuItem render={<Link href="/dashboard/jobs" />}>
                <span className="bg-tool-jobs-solid flex size-7 shrink-0 items-center justify-center rounded-lg text-white">
                  <Briefcase className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {t.insightTemplate
                    .replace("{count}", String(notifications.proactiveInsight.jobCount))
                    .replace("{skill}", notifications.proactiveInsight.skill)}
                </span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            data-tour="settings"
            aria-label={userName ?? dict.nav.profile}
            className="hover:bg-accent ml-1 flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors duration-150"
          >
            <Avatar className="size-8">
              {userImage && <AvatarImage src={userImage} alt={userName ?? ""} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate text-sm font-medium md:inline">{userName ?? dict.nav.profile}</span>
            <ChevronDown className="text-muted-foreground hidden size-3.5 md:inline" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem render={<Link href="/dashboard/passport" />}>
              <User />
              {dict.nav.profile}
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
              <Settings />
              {dict.nav.settings}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut />
              {dict.nav.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
