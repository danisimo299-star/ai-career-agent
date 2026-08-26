"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Compass, Briefcase, Sparkles, MoreHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { dashboardNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";

const PRIMARY_HREFS = ["/dashboard", "/dashboard/career-analysis", "/dashboard/jobs", "/dashboard/coach"] as const;

const PRIMARY_ICONS: Record<(typeof PRIMARY_HREFS)[number], LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/career-analysis": Compass,
  "/dashboard/jobs": Briefcase,
  "/dashboard/coach": Sparkles,
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const { dict } = useLocale();
  const nav = dict.dashboard.mobileNav;
  const [open, setOpen] = useState(false);

  const moreItems = dashboardNav.filter(
    (item) => item.group !== "account" && !PRIMARY_HREFS.includes(item.href as (typeof PRIMARY_HREFS)[number])
  );
  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  const primaryLabel: Record<(typeof PRIMARY_HREFS)[number], string> = {
    "/dashboard": nav.home,
    "/dashboard/career-analysis": nav.career,
    "/dashboard/jobs": nav.jobs,
    "/dashboard/coach": nav.coach,
  };

  return (
    <nav
      aria-label={nav.navLabel}
      className="bg-background/95 supports-backdrop-filter:backdrop-blur fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {PRIMARY_HREFS.map((href) => {
        const Icon = PRIMARY_ICONS[href];
        const isActive = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className={cn("flex size-8 items-center justify-center rounded-full", isActive && "bg-primary/15")}>
              <Icon className="size-5" />
            </span>
            {primaryLabel[href]}
          </Link>
        );
      })}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
            isMoreActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <span className={cn("flex size-8 items-center justify-center rounded-full", isMoreActive && "bg-primary/15")}>
            <MoreHorizontal className="size-5" />
          </span>
          {nav.more}
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{nav.moreSheetTitle}</SheetTitle>
            <SheetDescription>{nav.moreSheetDescription}</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 px-4 pb-6">
            {moreItems.map((item) => {
              const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "hover-lift flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs font-medium",
                    isActive ? "border-primary/40 bg-primary/10 text-primary" : "text-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                  {dict.nav[item.labelKey]}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
