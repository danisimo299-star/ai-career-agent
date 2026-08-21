"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { siteConfig } from "@/config/site";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Sparkles, MessageCircle, Compass, Map, FileText, Mic, Briefcase } from "lucide-react";

const featureIcons = [MessageCircle, Compass, Map, FileText, Mic, Briefcase] as const;
const featureKeys = ["chat", "careerAnalysis", "roadmap", "resume", "interview", "jobs"] as const;

export default function LandingPage() {
  const { dict } = useLocale();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="text-primary size-5" />
          {siteConfig.name}
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" nativeButton={false} render={<Link href="/login">{dict.nav.signIn}</Link>} className="ml-1" />
          <Button nativeButton={false} render={<Link href="/register">{dict.nav.getStarted}</Link>} />
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {dict.landing.title}
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg text-balance">
          {dict.landing.subtitle}
        </p>
        <div className="flex gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/register">{dict.landing.ctaStart}</Link>} />
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login">{dict.landing.ctaLogin}</Link>} />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
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
