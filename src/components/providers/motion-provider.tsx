"use client";

import { MotionConfig } from "motion/react";

/**
 * `reducedMotion="user"` makes every `motion.*`/`AnimatePresence` animation
 * in the app automatically respect the OS-level "reduce motion" setting
 * (durations collapse to ~0 instead of the animation being hand-guarded
 * per component) — a single app-wide fix instead of adding a
 * `prefers-reduced-motion` check to every animated component individually.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
