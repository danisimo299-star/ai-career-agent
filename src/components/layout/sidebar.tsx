"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNav, type NavItem } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Sparkles, ChevronDown } from "lucide-react";

function isNavItemActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const { dict } = useLocale();
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="size-4" />
      {dict.nav[item.labelKey]}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { dict } = useLocale();

  const primaryItems = dashboardNav.filter((item) => item.group === "primary");
  const moreItems = dashboardNav.filter((item) => item.group === "more");
  const isMoreActive = moreItems.some((item) => isNavItemActive(pathname, item.href));

  const [moreOpen, setMoreOpen] = useState(isMoreActive);

  return (
    <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 flex-col border-r md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Sparkles className="text-primary size-5" />
        <span className="font-semibold">{siteConfig.name}</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {primaryItems.map((item) => (
          <NavLink key={item.href} item={item} isActive={isNavItemActive(pathname, item.href)} />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen((prev) => !prev)}
          aria-expanded={moreOpen}
          className={cn(
            "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isMoreActive
              ? "text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <span>{dict.dashboard.mobileNav.more}</span>
          <ChevronDown className={cn("size-4 transition-transform", moreOpen && "rotate-180")} />
        </button>

        {moreOpen && (
          <div className="flex flex-col gap-1">
            {moreItems.map((item) => (
              <NavLink key={item.href} item={item} isActive={isNavItemActive(pathname, item.href)} />
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
