"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const SIZE_PX: Record<"sm" | "md" | "lg", number> = { sm: 18, md: 22, lg: 32 };
const LOGO_SRC = "/brand/profymind-logo.png";

/** Module-level so every instance on the page shares one probe result instead of each re-checking — resets only on a full page load. */
let cachedAvailable: boolean | null = null;

export interface ProfyMindLogoProps {
  /** Show the "ProfyMind" wordmark next to the mark — off for icon-only spots (favicon-sized contexts, tight nav rows). */
  withWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * The single source of truth for the ProfyMind brand mark — every
 * sidebar/login/register/landing header renders this instead of its own
 * `<img>`/icon, so swapping the asset (drop the real file at
 * `/public/brand/profymind-logo.png`) updates the whole app at once.
 *
 * No custom asset exists yet, so this renders the clean Sparkles mark by
 * default — never a broken-image icon: the real file is probed off-DOM (a
 * plain `Image()`, never mounted in the page) and only swapped in once it's
 * confirmed to actually load, so there's nothing to flash broken while
 * waiting for a real logo to be dropped in.
 */
export function ProfyMindLogo({ withWordmark = true, size = "md", className }: ProfyMindLogoProps) {
  const [available, setAvailable] = useState(cachedAvailable === true);

  useEffect(() => {
    // Already resolved (by this or another instance earlier on the page) —
    // the initial `useState` above already picked it up, nothing to probe.
    if (cachedAvailable !== null) return;
    const probe = new window.Image();
    probe.onload = () => {
      cachedAvailable = true;
      setAvailable(true);
    };
    probe.onerror = () => {
      cachedAvailable = false;
    };
    probe.src = LOGO_SRC;
  }, []);

  const px = SIZE_PX[size];

  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      {available ? (
        // eslint-disable-next-line @next/next/no-img-element -- brand asset, already confirmed loadable by the probe above.
        <img src={LOGO_SRC} alt={siteConfig.name} width={px} height={px} className="shrink-0 object-contain" />
      ) : (
        <Sparkles className="text-primary shrink-0" style={{ width: px, height: px }} />
      )}
      {withWordmark && <span className="truncate">{siteConfig.name}</span>}
    </span>
  );
}
