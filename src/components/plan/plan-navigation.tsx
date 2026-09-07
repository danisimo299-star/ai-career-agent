"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import type { PlanView } from "@/lib/career/plan-navigation";

export function PlanNavigation({ view }: { view: PlanView }) {
  const { dict } = useLocale();
  const copy = dict.dashboard.planPage;
  return (
    <nav aria-label={dict.nav.plan} className="bg-muted flex w-full gap-1 rounded-lg p-1 sm:w-fit">
      {(["today", "all"] as const).map((item) => (
        <Link key={item} href={`/dashboard/plan?view=${item}`} scroll={false}
          aria-current={view === item ? "page" : undefined}
          className={cn("flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-md px-5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none", view === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {copy[item]}
        </Link>
      ))}
    </nav>
  );
}
