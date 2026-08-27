"use client";

import { Search } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { OPEN_COMMAND_PALETTE_EVENT } from "./command-palette";

/** The top bar's search field — a trigger for the real `⌘K` command palette (`CommandPalette`), not a separate search implementation of its own. */
export function NavSearch() {
  const { dict } = useLocale();

  return (
    <button
      type="button"
      data-tour="search"
      onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
      className="border-border/60 bg-card hover:border-ring text-muted-foreground flex w-full max-w-sm items-center gap-2 rounded-lg border py-2 pr-2 pl-3 text-left text-sm transition-colors duration-150"
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 truncate">{dict.dashboard.search.placeholder}</span>
      <kbd className="border-border/70 bg-muted hidden shrink-0 rounded border px-1.5 py-0.5 text-[0.65rem] sm:inline-block">⌘K</kbd>
    </button>
  );
}
