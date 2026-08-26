"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Settings, User, Sparkles, Monitor, Bell, Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { ProfileSection } from "./profile-section";
import { AiSection } from "./ai-section";
import { InterfaceSection } from "./interface-section";
import { NotificationsSection } from "./notifications-section";
import { PrivacySection } from "./privacy-section";
import type { SettingsProfileData } from "./types";

interface SettingsViewProps {
  userName: string;
  profile: SettingsProfileData;
}

type SettingsTab = "profile" | "ai" | "interfaceTab" | "notifications" | "privacy";

const TAB_ICON: Record<SettingsTab, typeof User> = {
  profile: User,
  ai: Sparkles,
  interfaceTab: Monitor,
  notifications: Bell,
  privacy: Shield,
};

const TAB_TONE: Record<SettingsTab, string> = {
  profile: "text-tool-profile",
  ai: "text-tool-chat",
  interfaceTab: "text-tool-roadmap",
  notifications: "text-tool-resume",
  privacy: "text-tool-interview",
};

export function SettingsView({ userName, profile }: SettingsViewProps) {
  const { dict } = useLocale();
  const page = dict.settings;
  const [tab, setTab] = useState<SettingsTab>("profile");

  const tabs: SettingsTab[] = ["profile", "ai", "interfaceTab", "notifications", "privacy"];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="space-y-6">
      <PageHeader title={page.title} description={page.subtitle} icon={Settings} />

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as SettingsTab)}>
        <div className="overflow-x-auto">
          <TabsList className="w-max min-w-full sm:w-fit sm:min-w-0">
            {tabs.map((key) => {
              const Icon = TAB_ICON[key];
              return (
                <TabsTrigger key={key} value={key} className="gap-1.5">
                  <Icon className={cn("size-3.5", tab === key && TAB_TONE[key])} />
                  {page.tabs[key]}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="relative mt-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <TabsContent value="profile">
                <ProfileSection userName={userName} profile={profile} />
              </TabsContent>
              <TabsContent value="ai">
                <AiSection profile={profile} />
              </TabsContent>
              <TabsContent value="interfaceTab">
                <InterfaceSection />
              </TabsContent>
              <TabsContent value="notifications">
                <NotificationsSection />
              </TabsContent>
              <TabsContent value="privacy">
                <PrivacySection />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>
    </motion.div>
  );
}
