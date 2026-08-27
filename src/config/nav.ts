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
  // "primary" items render directly in the sidebar; "tools" items collapse
  // into the "Ещё"/"More" disclosure; "settings" and "account" are reachable
  // only from the account dropdown (topbar + sidebar UserPanel) — Career
  // Profile deliberately lives there, not in the browsable nav list, so it
  // reads as "your account" rather than another tool. The mobile bottom nav
  // doesn't read this field — it has its own fixed primary set — so it
  // still surfaces every item regardless of how this grouping changes.
  group: "primary" | "tools" | "settings" | "account";
}

export const dashboardNav: NavItem[] = [
  { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard, group: "primary" },
  { labelKey: "missions", href: "/dashboard/missions", icon: Target, group: "primary" },
  { labelKey: "coach", href: "/dashboard/coach", icon: Sparkles, group: "primary" },
  { labelKey: "resume", href: "/dashboard/resume", icon: FileText, group: "primary" },
  { labelKey: "jobs", href: "/dashboard/jobs", icon: Briefcase, group: "primary" },
  { labelKey: "passport", href: "/dashboard/passport", icon: IdCard, group: "account" },
  // A clipboard/assessment icon, deliberately NOT a chat bubble — the
  // Career Interview is a structured profile-builder, not a chat, and
  // should read as visually distinct from Coach's Sparkles icon above.
  { labelKey: "questionnaire", href: "/dashboard/questionnaire", icon: ClipboardList, group: "tools" },
  { labelKey: "careerAnalysis", href: "/dashboard/career-analysis", icon: Compass, group: "tools" },
  { labelKey: "roadmap", href: "/dashboard/roadmap", icon: Map, group: "tools" },
  { labelKey: "interview", href: "/dashboard/interview", icon: Mic, group: "tools" },
  { labelKey: "settings", href: "/dashboard/settings", icon: Settings, group: "settings" },
];
