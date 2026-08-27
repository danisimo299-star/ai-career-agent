"use client";

import { motion, AnimatePresence } from "motion/react";
import { Compass, Map, FileText, Mic, Briefcase, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfyMindLogo } from "@/components/brand/profymind-logo";
import { useLocale } from "@/lib/i18n/locale-provider";

const FEATURE_ICONS = [Compass, Map, FileText, Mic, Briefcase, Sparkles] as const;

/**
 * The first screen of the post-registration flow (item 12 of the onboarding
 * brief) — shown once before the interactive product tour starts. A plain
 * centered overlay, not the shared `Dialog` (which is always small/`max-w-sm`
 * and not meant to gate the rest of the shell behind a deliberate "Начать
 * знакомство" action).
 */
export function WelcomeScreen({ open, onStart }: { open: boolean; onStart: () => void }) {
  const { dict } = useLocale();
  const t = dict.onboardingTour.welcome;
  const features = t.features as unknown as string[];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-background/90 fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="border-border bg-card w-full max-w-md rounded-2xl border p-7 shadow-xl"
          >
            <div className="bg-primary/10 text-primary mb-5 flex size-11 items-center justify-center rounded-xl">
              <ProfyMindLogo withWordmark={false} size="sm" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{t.title}</h1>
            <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">{t.subtitle}</p>

            <ul className="mt-5 space-y-2.5">
              {features.map((feature, i) => {
                const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
                return (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    <span className="bg-secondary text-foreground flex size-6 shrink-0 items-center justify-center rounded-md">
                      <Icon className="size-3.5" />
                    </span>
                    {feature}
                  </li>
                );
              })}
            </ul>

            <Button className="mt-6 w-full" onClick={onStart}>
              {t.cta}
              <ArrowRight />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
