import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="bg-accent flex size-12 items-center justify-center rounded-full">
          <Icon className="text-primary size-6" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
        </div>
        {action && <div className="pt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}
