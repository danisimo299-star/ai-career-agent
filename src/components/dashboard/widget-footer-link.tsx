import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface WidgetFooterLinkProps {
  href: string;
  label: string;
}

/** The "→" link every bento module ends on — one shared style so the grid reads as one system. */
export function WidgetFooterLink({ href, label }: WidgetFooterLinkProps) {
  return (
    <Link href={href} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors duration-150">
      {label}
      <ArrowRight className="size-3" />
    </Link>
  );
}
