"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useMounted } from "@/hooks/use-mounted";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { dict } = useLocale();
  const mounted = useMounted();

  const isDark = mounted ? (theme === "system" ? resolvedTheme : theme) === "dark" : false;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dict.theme.toggle}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
