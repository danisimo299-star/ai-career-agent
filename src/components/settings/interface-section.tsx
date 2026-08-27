"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Compass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useMounted } from "@/hooks/use-mounted";
import { locales } from "@/lib/i18n/config";

const THEMES = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

export function InterfaceSection() {
  const { theme, setTheme } = useTheme();
  const { dict, locale, setLocale } = useLocale();
  const mounted = useMounted();
  const page = dict.settings.interfaceSection;

  return (
    <Card>
      <CardContent className="max-w-md space-y-6 py-6">
        <div className="space-y-2">
          <Label>{page.themeLabel}</Label>
          <div className="flex gap-2">
            {THEMES.map(({ value, icon: Icon }) => {
              const active = mounted && theme === value;
              return (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  className={cn("gap-1.5", active && "pointer-events-none")}
                  onClick={() => setTheme(value)}
                >
                  <Icon className="size-3.5" />
                  {dict.theme[value]}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{page.languageLabel}</Label>
          <div className="flex gap-2">
            {locales.map((code) => (
              <Button
                key={code}
                type="button"
                size="sm"
                variant={locale === code ? "default" : "outline"}
                className={cn(locale === code && "pointer-events-none")}
                onClick={() => setLocale(code)}
              >
                {dict.language[code]}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>{page.tourLabel}</Label>
          <p className="text-muted-foreground text-sm">{page.tourDescription}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            nativeButton={false}
            render={<Link href="/dashboard?tour=replay" />}
          >
            <Compass className="size-3.5" />
            {page.tourCta}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
