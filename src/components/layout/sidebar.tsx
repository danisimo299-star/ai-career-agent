"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { dashboardNav, type NavItem } from "@/config/nav";
import { ProfyMindLogo } from "@/components/brand/profymind-logo";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, ChevronDown, User, Settings, LogOut, Rocket } from "lucide-react";

function isNavItemActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const { dict } = useLocale();
  return (
    <Link
      href={item.href}
      data-tour={item.href === "/dashboard/coach" ? "chat" : undefined}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground before:bg-primary before:absolute before:inset-y-1.5 before:-left-1 before:w-0.5 before:rounded-full"
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="size-4 shrink-0" />
      <span className="truncate">{dict.nav[item.labelKey]}</span>
    </Link>
  );
}

interface UserPanelProps {
  userName?: string | null;
  userEmail?: string | null;
  targetRole?: string | null;
}

/** The sidebar's bottom account row — identity + a menu, not a status widget. The avatar itself lives in the topbar now, not duplicated here. Secondary line prefers the user's real career goal (the thing that actually changes/matters), falling back to email, then nothing. */
function UserPanel({ userName, userEmail, targetRole }: UserPanelProps) {
  const { dict } = useLocale();
  const secondaryLine = targetRole ?? userEmail ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-tour="profile"
        className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-150 outline-none focus-visible:ring-2"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{userName ?? dict.nav.profile}</p>
          {secondaryLine && <p className="text-sidebar-foreground/50 truncate text-xs">{secondaryLine}</p>}
        </div>
        <ChevronsUpDown className="text-sidebar-foreground/40 size-3.5 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
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
  );
}

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
  targetRole?: string | null;
}

/**
 * Clean by design: logo, a flat nav list, and a bottom account panel —
 * nothing else. Deliberately not a mini-dashboard; status/recommendation
 * content all lives on the actual Dashboard page.
 */
/** Compact nudge toward the Coach — sidebar-native, not a status widget; drops silently if it ever starts crowding the nav. */
function SidebarGrowthCard() {
  const { dict } = useLocale();
  return (
    <div className="border-sidebar-border bg-sidebar-accent/40 space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-1.5">
        <Rocket className="text-tool-chat size-3.5" />
        <p className="text-xs font-semibold">{dict.sidebar.growthTitle}</p>
      </div>
      <p className="text-sidebar-foreground/60 text-xs">{dict.sidebar.growthDescription}</p>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 w-full text-xs"
        nativeButton={false}
        render={<Link href="/dashboard/coach">{dict.sidebar.growthCta}</Link>}
      />
    </div>
  );
}

export function Sidebar({ userName, userEmail, targetRole }: SidebarProps) {
  const pathname = usePathname();
  const { dict } = useLocale();

  const primaryItems = dashboardNav.filter((item) => item.group === "primary");
  const toolItems = dashboardNav.filter((item) => item.group === "tools");
  const isToolsActive = toolItems.some((item) => isNavItemActive(pathname, item.href));
  const [toolsOpen, setToolsOpen] = useState(isToolsActive);

  return (
    <aside className="bg-sidebar text-sidebar-foreground hidden w-60 shrink-0 flex-col border-r md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ProfyMindLogo size="sm" className="text-sm tracking-tight" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2.5">
        {primaryItems.map((item) => (
          <NavLink key={item.href} item={item} isActive={isNavItemActive(pathname, item.href)} />
        ))}

        <button
          type="button"
          data-tour="tools"
          onClick={() => setToolsOpen((v) => !v)}
          className={cn(
            "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mt-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
            isToolsActive && !toolsOpen && "text-sidebar-foreground/90"
          )}
          aria-expanded={toolsOpen}
        >
          {dict.nav.more}
          <ChevronDown className={cn("size-3.5 shrink-0 transition-transform duration-150", toolsOpen && "rotate-180")} />
        </button>

        {toolsOpen && (
          <div className="flex flex-col gap-0.5">
            {toolItems.map((item) => (
              <NavLink key={item.href} item={item} isActive={isNavItemActive(pathname, item.href)} />
            ))}
          </div>
        )}
      </nav>

      <div className="space-y-2 border-t p-2">
        <SidebarGrowthCard />
        <UserPanel userName={userName} userEmail={userEmail} targetRole={targetRole} />
      </div>
    </aside>
  );
}
