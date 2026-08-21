"use client";

import { signOut } from "next-auth/react";
import { User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getInitials } from "@/lib/utils";

interface DashboardTopbarProps {
  userName?: string | null;
}

export function DashboardTopbar({ userName }: DashboardTopbarProps) {
  const { dict } = useLocale();
  const initials = getInitials(userName);

  return (
    <header className="flex h-16 items-center justify-end gap-1 border-b px-6">
      <LanguageSwitcher />
      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-full">
          <Avatar className="size-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <User />
            {dict.nav.profile}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut />
            {dict.nav.signOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
