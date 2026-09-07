"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ProfyMindLogo } from "@/components/brand/profymind-logo";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MessageCircle, Compass, Map, FileText, Mic, Briefcase } from "lucide-react";

const featureIcons = [MessageCircle, Compass, Map, FileText, Mic, Briefcase] as const;
const featureKeys = ["chat", "careerAnalysis", "roadmap", "resume", "interview", "jobs"] as const;

/** The public marketing page — only ever rendered for a signed-out visitor; `app/page.tsx` redirects an authenticated one to `/dashboard` before this renders at all. */
export function LandingPage() {
  const { dict } = useLocale();

  return (
    <div className="flex flex-1 flex-col">
      <header className="grid grid-cols-[1fr_auto] items-center gap-2 border-b px-4 py-3 sm:flex sm:h-16 sm:justify-between sm:px-6 sm:py-0">
        <ProfyMindLogo />
        <div className="contents sm:flex sm:items-center sm:gap-1">
          <div className="flex items-center gap-1"><LanguageSwitcher /><ThemeToggle /></div>
          <Button variant="ghost" nativeButton={false} render={<Link href="/login">{dict.nav.signIn}</Link>} className="sm:ml-1" />
          <Button nativeButton={false} render={<Link href="/register">{dict.nav.getStarted}</Link>} />
        </div>
      </header>

      <section className="mx-auto flex w-full min-w-0 max-w-3xl flex-col items-center gap-6 px-6 py-14 text-center sm:py-24">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {dict.landing.title}
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg text-balance">
          {dict.landing.subtitle}
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button size="lg" nativeButton={false} render={<Link href="/register">{dict.landing.ctaStart}</Link>} />
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login">{dict.landing.ctaLogin}</Link>} />
        </div>
      </section>

      <section className="mx-auto grid w-full min-w-0 max-w-5xl grid-cols-1 gap-4 px-6 pb-14 sm:grid-cols-2 sm:pb-24 lg:grid-cols-3">
        {featureKeys.map((key, index) => {
          const Icon = featureIcons[index];
          const feature = dict.landing.features[key];
          return (
            <Card key={key}>
              <CardHeader>
                <Icon className="text-primary size-5" />
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {feature.description}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
