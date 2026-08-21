import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ClipboardList,
  Compass,
  IdCard,
  Map,
  Target,
  FileText,
  Mic,
  Briefcase,
  Sparkles,
  Settings,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export interface NavItem {
  labelKey: keyof Dictionary["nav"];
  href: string;
  icon: LucideIcon;
  // "primary" items render directly in the sidebar; "more" items collapse
  // into the "Ещё"/"More" disclosure — same grouping the mobile bottom nav
  // already applies via its own PRIMARY_HREFS list.
  group: "primary" | "more";
}

export const dashboardNav: NavItem[] = [
  { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard, group: "primary" },
  // A clipboard/assessment icon, deliberately NOT a chat bubble — the
  // Career Interview (formerly "Questionnaire") is a structured
  // profile-builder, not a chat, and should read as visually distinct
  // from Chat's Sparkles icon below.
  { labelKey: "questionnaire", href: "/dashboard/questionnaire", icon: ClipboardList, group: "primary" },
  { labelKey: "careerAnalysis", href: "/dashboard/career-analysis", icon: Compass, group: "more" },
  { labelKey: "passport", href: "/dashboard/passport", icon: IdCard, group: "more" },
  { labelKey: "roadmap", href: "/dashboard/roadmap", icon: Map, group: "more" },
  { labelKey: "missions", href: "/dashboard/missions", icon: Target, group: "more" },
  { labelKey: "resume", href: "/dashboard/resume", icon: FileText, group: "more" },
  { labelKey: "interview", href: "/dashboard/interview", icon: Mic, group: "more" },
  { labelKey: "jobs", href: "/dashboard/jobs", icon: Briefcase, group: "more" },
  { labelKey: "coach", href: "/dashboard/coach", icon: Sparkles, group: "primary" },
  { labelKey: "settings", href: "/dashboard/settings", icon: Settings, group: "more" },
];
