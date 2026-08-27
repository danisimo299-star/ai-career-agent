import type { LucideIcon } from "lucide-react";

interface WidgetHeaderProps {
  icon: LucideIcon;
  title: string;
}

/** The one consistent header every bento module uses — icon + compact title, nothing else. Keeps the dense grid from feeling like a dozen unrelated card designs. */
export function WidgetHeader({ icon: Icon, title }: WidgetHeaderProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="text-primary size-4 shrink-0" />
      <h3 className="truncate text-sm font-semibold tracking-tight">{title}</h3>
    </div>
  );
}
