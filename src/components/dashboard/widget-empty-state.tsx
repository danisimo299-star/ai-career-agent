import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WidgetEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: { label: string; href: string };
}

/** Compact, honest empty state for a bento module — explains what's missing and how to get it, never fake content. */
export function WidgetEmptyState({ icon: Icon, title, description, cta }: WidgetEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-2 py-2">
      <Icon className="text-muted-foreground size-4.5" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
      {cta && (
        <Button size="sm" variant="outline" className="mt-1" nativeButton={false} render={<Link href={cta.href}>{cta.label}</Link>} />
      )}
    </div>
  );
}
