"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useMounted } from "@/hooks/use-mounted";

export interface TourStep {
  /** Matches a `data-tour="<selector>"` attribute somewhere in the shell — on mobile some targets don't exist (sidebar is desktop-only), so the card falls back to a centered, spotlight-less position. */
  selector: string;
  title: string;
  description: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function measure(selector: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const PADDING = 6;

export function ProductTour({ steps, onFinish, onSkip }: { steps: TourStep[]; onFinish: () => void; onSkip: () => void }) {
  const { dict } = useLocale();
  const t = dict.onboardingTour.controls;
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const mounted = useMounted();

  const step = steps[index];
  const isLast = index === steps.length - 1;

  useEffect(() => {
    const update = () => setRect(measure(step.selector));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step.selector]);

  if (!mounted) return null;

  const spotlightRect = rect && {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };

  // Position the card below the target, or above if there isn't room; centered when there's no target to anchor to (e.g. a desktop-only nav item on a mobile viewport).
  const cardStyle: React.CSSProperties = spotlightRect
    ? {
        position: "fixed",
        top: spotlightRect.top + spotlightRect.height + 12 + 340 > window.innerHeight ? undefined : spotlightRect.top + spotlightRect.height + 12,
        bottom: spotlightRect.top + spotlightRect.height + 12 + 340 > window.innerHeight ? window.innerHeight - spotlightRect.top + 12 : undefined,
        left: Math.min(Math.max(spotlightRect.left, 16), window.innerWidth - 336),
      }
    : { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Dimming + cutout in one element via a giant box-shadow — no separate backdrop layer needed. Click-through disabled so the tour stays modal. */}
      <motion.div
        key={step.selector}
        initial={false}
        animate={
          spotlightRect
            ? { top: spotlightRect.top, left: spotlightRect.left, width: spotlightRect.width, height: spotlightRect.height, opacity: 1 }
            : { top: "40%", left: "50%", width: 0, height: 0, opacity: 1 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed rounded-lg"
        style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)" }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          style={cardStyle}
          className="border-border bg-card w-80 max-w-[calc(100vw-2rem)] rounded-xl border p-4 shadow-xl"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">{step.title}</p>
            <button type="button" onClick={onSkip} aria-label={t.skip} className="text-muted-foreground hover:text-foreground -m-1 p-1">
              <X className="size-4" />
            </button>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>

          <div className="mt-3 flex gap-1">
            {steps.map((s, i) => (
              <span key={s.selector} className={`h-1 w-4 rounded-full transition-colors ${i === index ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Button size="sm" variant="ghost" onClick={onSkip}>
              {t.skip}
            </Button>
            <div className="flex gap-1.5">
              {index > 0 && (
                <Button size="sm" variant="outline" onClick={() => setIndex((i) => i - 1)}>
                  <ArrowLeft />
                  {t.back}
                </Button>
              )}
              <Button size="sm" onClick={() => (isLast ? onFinish() : setIndex((i) => i + 1))}>
                {isLast ? t.finish : t.next}
                {!isLast && <ArrowRight />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
