"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Search } from "lucide-react";
import { dashboardNav } from "@/config/nav";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export const OPEN_COMMAND_PALETTE_EVENT = "profymind:open-command-palette";

/**
 * A real `⌘K` navigation search over ProfyMind's actual sections — not a
 * decorative input. Mounted once at the App Shell level so the shortcut
 * works from any dashboard page; the top bar's search field is just
 * another trigger for the same palette (dispatches `OPEN_COMMAND_PALETTE_EVENT`
 * rather than owning its own separate search UI).
 */
export function CommandPalette() {
  const router = useRouter();
  const { dict } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpenRequest() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenRequest);
    };
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setActiveIndex(0);
    }
  };

  const results = useMemo(() => {
    const items = dashboardNav.filter((item) => item.group !== "settings").map((item) => ({ item, label: dict.nav[item.labelKey] }));
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(({ label }) => label.toLowerCase().includes(needle));
  }, [query, dict]);

  const go = (href: string) => {
    router.push(href);
    handleOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          className="border-border bg-popover text-popover-foreground fixed top-[18%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border shadow-2xl outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
          onKeyDown={(e) => {
            if (results.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(results[activeIndex].item.href);
            }
          }}
        >
          <div className="border-border flex items-center gap-2 border-b px-3 py-2.5">
            <Search className="text-muted-foreground size-4 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder={dict.dashboard.search.placeholder}
              className="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
            />
            <kbd className="text-muted-foreground border-border rounded border px-1.5 py-0.5 text-[0.65rem]">Esc</kbd>
          </div>
          <div className="max-h-80 overflow-y-auto p-1.5">
            {results.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">{dict.dashboard.search.noResults}</p>
            ) : (
              <ul>
                {results.map(({ item, label }, i) => (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => go(item.href)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-100",
                        i === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="text-muted-foreground size-4 shrink-0" />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
