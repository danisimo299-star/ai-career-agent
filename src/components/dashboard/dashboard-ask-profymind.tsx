"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

/** Wide bottom AI section — a shortcut into the real Chat/Coach feature, not a decorative banner: every starter prompt is a working link that opens Chat pre-filled with that question. */
export function DashboardAskProfyMind() {
  const { dict } = useLocale();
  const a = dict.dashboard.askProfyMind;

  const starters = [a.starters.improveResume, a.starters.skillsToLearn, a.starters.reviewProfile];

  return (
    <Card className="ambient-ai">
      <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-tool-chat-solid flex size-11 shrink-0 items-center justify-center rounded-xl text-white">
            <Sparkles className="size-5" />
          </span>
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold">{a.title}</h2>
            <p className="text-muted-foreground text-sm">{a.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {starters.map((prompt) => (
            <Button
              key={prompt}
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href={`/dashboard/coach?ask=${encodeURIComponent(prompt)}`}>{prompt}</Link>}
            />
          ))}
          <Button
            size="sm"
            nativeButton={false}
            render={
              <Link href="/dashboard/coach">
                {a.openCta}
                <ArrowRight />
              </Link>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
