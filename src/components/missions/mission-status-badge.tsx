"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { CareerMissionStatus } from "./types";

export function MissionStatusBadge({ status }: { status: CareerMissionStatus }) {
  const { dict } = useLocale();
  const variant = status === "COMPLETED" ? "default" : status === "EXPIRED" || status === "SKIPPED" ? "outline" : "secondary";

  return <Badge variant={variant}>{dict.dashboard.missionsPage.status[status]}</Badge>;
}
