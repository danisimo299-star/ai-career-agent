"use client";

import { useEffect, useId, useState } from "react";

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label: string;
}

/**
 * The Hero's "profile readiness" visual — an arc, not a raw score. Starts
 * at 0 and animates in to `percent` on mount (per the entrance-animation
 * brief); respects `prefers-reduced-motion` by skipping straight to the
 * final value instead of transitioning.
 *
 * The percent text is always `text-foreground` (white in dark mode), and
 * the arc itself stays white with only a barely-there violet tint at its
 * tail (never a blue gradient) — the ring reads as white/off-white first,
 * matching the "numbers and rings are white" rule. The track circle sets
 * `fill="none"` as a real SVG attribute (not just a Tailwind class) and
 * colors itself via `currentColor` + a wrapping text-color class — the
 * same mechanism every lucide icon in this app already relies on —
 * rather than `stroke-{token}` utilities, so there is no dependency on a
 * `stroke-*` utility actually being generated/applied. The indicator arc
 * uses a scoped gradient (unique id per instance via `useId`, since a
 * page can render several rings at once).
 */
export function ProgressRing({ percent, size = 96, strokeWidth = 8, label }: ProgressRingProps) {
  const gradientId = useId();
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setDisplayPercent(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - displayPercent / 100);

  return (
    <div className="progress-ring-glow relative isolate shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--foreground)" />
            <stop offset="100%" stopColor="color-mix(in oklch, var(--foreground) 78%, var(--tool-chat) 22%)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke="currentColor"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          stroke={`url(#${gradientId})`}
          className="progress-ring-fill"
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-foreground font-semibold tabular-nums ${size < 48 ? "text-[0.65rem]" : size < 80 ? "text-sm" : "text-lg"}`}>
          {percent}%
        </span>
      </div>
    </div>
  );
}
