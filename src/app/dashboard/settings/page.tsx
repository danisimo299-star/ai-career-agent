"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Settings } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function SettingsPage() {
  const { dict } = useLocale();

  return (
    <div className="space-y-6">
      <PageHeader title={dict.dashboard.cards.settings.title} description={dict.dashboard.cards.settings.description} />
      <EmptyState
        icon={Settings}
        title={dict.common.comingSoon}
        description={dict.dashboard.cards.settings.description}
      />
    </div>
  );
}
