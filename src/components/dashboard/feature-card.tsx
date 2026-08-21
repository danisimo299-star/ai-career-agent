import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  comingSoonLabel: string;
  openLabel: string;
  available?: boolean;
}

export function FeatureCard({
  href,
  icon: Icon,
  title,
  description,
  comingSoonLabel,
  openLabel,
  available = false,
}: FeatureCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="hover-lift h-full group-hover:border-primary/40">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
            <Icon className="text-primary size-5" />
          </div>
          {!available && <Badge variant="secondary">{comingSoonLabel}</Badge>}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium",
              available ? "text-primary" : "text-muted-foreground"
            )}
          >
            {openLabel}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
